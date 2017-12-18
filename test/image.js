const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const sinon = require('sinon');
const config = require('config');

const sandbox = sinon.sandbox.create();

chai.should();
chai.use(chaiHttp);

// parameters:
// file: valid, image
// width: > 0
// height: > 0
// crop: fill, fit, scale (default: fill)
// gravity: center, north, east, south, west, northeast, southeast, southwest, northwest, entropy, attention
// format: (default: best accepted), webp, jpeg, png
// quality: 1-100
describe('Image Controller', () => {
  afterEach(function () {
    sandbox.restore();
  });

  it('should return error image', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Logging.EnableErrorImages').returns(true);
    stub.callThrough();
    chai.request(server)
      .get('/image')
      .end((err, res) => {
        res.status.should.equal(400);
        res.headers['content-type'].should.equal('image/png');
        done();
      });
  });

  it('should return undefined file', (done) => {
    chai.request(server)
      .get('/image')
      .end((err, res) => {
        res.status.should.equal(400);
        res.text.should.have.string('Undefined file');
        done();
      });
  });

  it('should return not found', (done) => {
    chai.request(server)
      .get('/image?file=http://google.de/404')
      .end((err, res) => {
        res.status.should.equal(404);
        res.text.should.have.string('Request failed');
        done();
      });
  });

  it('should return bad request', (done) => {
    chai.request(server)
      .get('/image?file=https://httpx.cat/')
      .end((err, res) => {
        res.status.should.equal(404);
        res.text.should.have.string('Request failed');
        done();
      });
  });

  it('should return wrong format no image', (done) => {
    chai.request(server)
      .get('/image?file=https://http.cat/')
      .end((err, res) => {
        res.status.should.equal(400);
        res.text.should.have.string('Invalid content-type');
        done();
      });
  });

  it('should return external data disabled', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('ImageSource.LoadExternalData.Enabled')
      .returns(false);
    stub.callThrough();
    chai.request(server)
      .get('/image?file=https://http.cat/')
      .end((err, res) => {
        res.status.should.equal(400);
        res.text.should.have.string('Loading external data has been disabled.');
        done();
      });
  });

  it('should return protocol not allowed', (done) => {
    chai.request(server)
      .get('/image?file=htp://http.cat/')
      .end((err, res) => {
        res.status.should.equal(400);
        res.text.should.have.string('Protocol not allowed');
        done();
      });
  });

  it('should return domain source not allowed', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('ImageSource.LoadExternalData.WhitelistRegex')
      .returns(['onlythisdomain\.com']);
    stub.callThrough();
    chai.request(server)
      .get('/image?file=https://http.cat/')
      .end((err, res) => {
        res.status.should.equal(400);
        res.text.should.have.string('Domain source not allowed');
        done();
      });
  });

  it('should return loading by id disabled', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('ImageSource.LoadById.Enabled')
      .returns(false);
    stub.callThrough();
    chai.request(server)
      .get('/image?file=1234567')
      .end((err, res) => {
        res.status.should.equal(400);
        res.text.should.have.string('Loading data by id has been disabled.');
        done();
      });
  });

  it('should return file too large', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('ImageSource.MaxFileSize')
      .returns(4000);
    stub.withArgs('ImageSource.LoadExternalData.Enabled')
      .returns(true);
    stub.withArgs('ImageSource.LoadExternalData.WhitelistRegex')
      .returns([]);
    stub.callThrough();
    chai.request(server)
      .get('/image?file=' +
        'https://upload.wikimedia.org/wikipedia/commons/2/24/' +
        'Willaerts_Adam_The_Embarkation_of_the_Elector_Palantine_Oil_Canvas-huge.jpg')
      .end((err, res) => {
        res.status.should.equal(400);
        res.text.should.have.string('File exceeds size limit');
        done();
      });
  });

  it('should return the same image', () => chai.request(server)
    .get('/image?file=https://http.cat/100')
    .then((res) => {
      res.should.be.ok;
    }));

  it('should handle response header without content-length', () => chai.request(server)
    .get('/image?file=https://i1.sndcdn.com/avatars-000049805703-zgm5k2-t500x500.jpg')
    .then((res) => {
      res.should.be.ok;
    }));

  describe('(width and height)', () => {
    afterEach(() => {
      sandbox.restore();
    });

    it('should return an invalid width error', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&width=0')
        .end((res) => {
          res.status.should.equal(400);
          done();
        });
    });

    it('should return the width scaled image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&width=100')
      .then((res) => {
        res.should.be.ok;
        // TODO: check width
      }));

    it('should return the width upscaled image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&width=1000')
      .then((res) => {
        res.should.be.ok;
        // TODO: check width
      }));

    it('should return an invalid height error', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&height=0')
        .end((err, res) => {
          res.status.should.equal(400);
          done();
        });
    });

    it('should return the height scaled image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&height=100')
      .then((res) => {
        res.should.be.ok;
        // TODO: check height
      }));

    it('should return the height upscaled image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&height=1000')
      .then((res) => {
        res.should.be.ok;
        // TODO: check height
      }));


    it('should return the height and width scaled (square) image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&height=100&width=100')
      .then((res) => {
        res.should.be.ok;
        // TODO: check height
      }));


    it('should return the height and width scaled (rect) image ', () => chai.request(server)
      .get('/image?file=https://http.cat/100&height=100&width=200')
      .then((res) => {
        res.should.be.ok;
        // TODO: check height
      }));
  });

  describe('(crop)', () => {
    afterEach(() => {
      sandbox.restore();
    });

    it('should return the invalid crop error', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&width=100&crop=notExisting')
        .end((err, res) => {
          res.status.should.equal(400);
          done();
        });
    });

    it('should return the uncropped image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&crop=fill')
      .then((res) => {
        res.should.be.ok;
        // TODO: check width
      }));

    it('should return the cropped(fill) image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&width=100&crop=fill')
      .then((res) => {
        res.should.be.ok;
        // TODO: check width
      }));

    it('should return the cropped(fit) image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&width=100&crop=fit')
      .then((res) => {
        res.should.be.ok;
        // TODO: check width
      }));

    it('should return the cropped(scale) image', () => chai.request(server)
      .get('/image?file=https://http.cat/100&width=100&crop=scale')
      .then((res) => {
        res.should.be.ok;
        // TODO: check width
      }));
  });

  describe('(gravity)', () => {
    afterEach(() => {
      sandbox.restore();
    });

    it('should return the invalid gravity error', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&width=100&height=150&crop=fill&gravity=notExisting')
        .end((err, res) => {
          res.status.should.equal(400);
          done();
        });
    });

    it('should return the cropped (east) image', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&width=100&height=150&crop=fill&gravity=east')
        .end((err, res) => {
          res.status.should.equal(200);
          done();
        });
    });

    it('should return the cropped (entropy) image', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&width=100&height=150&crop=fill&gravity=entropy')
        .end((err, res) => {
          res.status.should.equal(200);
          done();
        });
    });

    it('should return the cropped (faces) image without faces', function (done) {
      this.timeout(10000);
      chai.request(server)
        .get('/image?file=https://upload.wikimedia.org/wikipedia/commons/8/8c/Telefunken_FuBK.jpg' +
          '&width=100&height=150&crop=fill&gravity=faces')
        .end((err, res) => {
          res.status.should.equal(200);
          done();
        });
    });

    it('should return the cropped (faces) image with face', function (done) {
      this.timeout(10000);
      chai.request(server)
        .get('/image?file=https://upload.wikimedia.org/wikipedia/commons/5/5d/Half_Dome--cables.jpeg' +
          '&width=100&height=150&crop=fill&gravity=faces')
        .end((err, res) => {
          res.status.should.equal(200);
          done();
        });
    });
  });

  describe('(quality)', () => {
    afterEach(() => {
      sandbox.restore();
    });

    it('should return the invalid quality error', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&quality=0')
        .end((err, res) => {
          res.status.should.equal(400);
          done();
        });
    });

    it('should return the invalid quality error', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&quality=101')
        .end((err, res) => {
          res.status.should.equal(400);
          done();
        });
    });

    it('should return the image with new quality', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&quality=80')
        .end((err, res) => {
          res.status.should.equal(200);
          done();
        });
    });
  });

  describe('(format)', () => {
    afterEach(() => {
      sandbox.restore();
    });

    it('should return invalid format error', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&format=notExisting')
        .end((err, res) => {
          // TODO: The favored behavior has to discussed
          res.status.should.equal(400);
          done();
        });
    });

    it('should return the image as webp', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&format=webp')
        .end((err, res) => {
          res.status.should.equal(200);
          res.headers['content-type'].should.equal('image/webp');
          done();
        });
    });

    it('should return the image as jpeg', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&format=jpeg')
        .end((err, res) => {
          res.status.should.equal(200);
          res.headers['content-type'].should.equal('image/jpeg');
          done();
        });
    });

    it('should return the image as png', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100&format=png')
        .end((err, res) => {
          res.status.should.equal(200);
          res.headers['content-type'].should.equal('image/png');
          done();
        });
    });

    it('should return the image as png automatically, if it has an alpha channel', (done) => {
      chai.request(server)
        .get('/image?file=https://www.sarasoueidan.com/images/svg-vs-gif--circle-on-transparent-background.gif')
        .end((err, res) => {
          res.status.should.equal(200);
          res.headers['content-type'].should.equal('image/png');
          done();
        });
    });

    it('should not return the image as webp automatically, if accepted', (done) => {
      chai.request(server)
        .get('/image?file=https://http.cat/100')
        .set('Accept', 'image/webp')
        .end((err, res) => {
          res.status.should.equal(200);
          res.headers['content-type'].should.equal('image/jpeg');
          done();
        });
    });

    it('should return the image as webp automatically, if accepted', (done) => {
      const stub = sandbox.stub(config, 'get');
      stub.withArgs('ImageConversion.DefaultFormatDetection')
        .returns(true);
      stub.callThrough();
      chai.request(server)
        .get('/image?file=https://http.cat/100')
        .set('Accept', 'image/webp')
        .end((err, res) => {
          res.status.should.equal(200);
          res.headers['content-type'].should.equal('image/webp');
          done();
        });
    });
  });

  it('should render the test interface', (done) => {
    chai.request(server)
      .get('/image/test')
      .end((err, res) => {
        res.should.have.status(200);
        res.text.should.have.string('test interface');
        done();
      });
  });
});
