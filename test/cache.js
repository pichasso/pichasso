const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('config');
const fileCache = require('../middleware/fileCache');
const fs = require('fs');
const server = require('../app');
const sinon = require('sinon');

const sandbox = sinon.sandbox.create();

chai.should();
chai.use(chaiHttp);

const samplePdfUrl = 'http://www.barrierefreies-webdesign.de/' +
  'knowhow/pdf-checkliste/pdf/Checkliste-Barrierefreies-PDF.pdf';
const sampleImageUrl = 'https://http.cat/400';

describe('Cache', () => {
  describe('Images', () => {
    beforeEach((done) => {
      fileCache.clear();
      setTimeout(done, 1000);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should cache the requested image', (done) => {
      chai.request(server)
        .get('/image?file=' + sampleImageUrl)
        .end((err, res) => {
          res.status.should.equal(200);
          const filePath = config.get('Caching.Directory') + res.headers.etag;
          fs.exists(filePath, (exists) => {
            exists.should.be.true;
            done();
          });
        });
    });

    it('should return same etag for same image', (done) => {
      chai.request(server)
        .get(`/image?file=${sampleImageUrl}`)
        .end((err, res) => {
          res.status.should.equal(200);
          const etag = res.headers.etag;
          chai.request(server)
            .get(`/image?file=${sampleImageUrl}`)
            .end((err, res) => {
              res.status.should.equal(200);
              etag.should.equal(res.headers.etag);
              done();
            });
        });
    });

    it('should return status 304 for etag', (done) => {
      chai.request(server)
        .get(`/image?file=${sampleImageUrl}`)
        .end((err, res) => {
          res.status.should.equal(200);
          setTimeout(() => {
            chai.request(server)
              .get(`/image?file=${sampleImageUrl}`)
              .set('If-None-Match', res.headers.etag)
              .end((sndErr, sndRes) => {
                console.log(res.headers.etag);
                console.log(sndRes.headers.etag);
                sndRes.status.should.equal(304);
                done();
              });
          }, 500);
        });
    });

    it('should serve files from cache', (done) => {
      sandbox.spy(fileCache, 'load');
      let path = `/image?file=${sampleImageUrl}`;
      fileCache.clear();
      chai.request(server)
        .get(path)
        .end((err, res) => {
          if (err) {
            console.log(err);
          }
          res.status.should.equal(200);
          setTimeout(function () {
            // wait until file persisted
            chai.request(server)
            .get(path)
            .end((err, res) => {
              res.should.be.ok;
              fileCache.load.calledOnce.should.be.true;
              done();
            });
          }, 500);
        });
    });

    it('should download the file again, if cache fails', (done) => {
      sandbox.spy(fileCache, 'remove');
      chai.request(server)
        .get(`/image?file=${sampleImageUrl}`)
        .end((err, res) => {
          res.status.should.equal(200);
          const etag = res.headers.etag;
          const cachedFilePath = config.get('Caching.Directory') + etag;
          fs.unlink(cachedFilePath);
          chai.request(server)
            .get(`/image?file=${sampleImageUrl}`)
            .end((err, res) => {
              res.should.be.ok;
              fileCache.remove.calledWith(etag);
              done();
            });
        });
    });
  });

  describe('PDFs', function () {
    this.timeout(30000);

    beforeEach((done) => {
      fileCache.clear();
      setTimeout(done, 1000);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should cache the requested pdf', (done) => {
      chai.request(server)
        .get(`/pdf?file=${samplePdfUrl}`)
        .end((err, res) => {
          res.status.should.equal(200);
          const filePath = config.get('Caching.Directory') + res.headers.etag;
          fs.exists(filePath, (exists) => {
            exists.should.be.true;
            done();
          });
        });
    });

    it('should return same etag for same pdf', function (done) {
      chai.request(server)
        .get(`/pdf?file=${samplePdfUrl}`)
        .end((err, res) => {
          res.status.should.equal(200);
          const etag = res.headers.etag;
          chai.request(server)
            .get(`/pdf?file=${samplePdfUrl}`)
            .end((err, res) => {
              res.status.should.equal(200);
              etag.should.equal(res.headers.etag);
              done();
            });
        });
    });

    it('should return status 304 for etag', (done) => {
      chai.request(server)
        .get(`/pdf?file=${samplePdfUrl}`)
        .end((err, res) => {
          res.status.should.equal(200);
          setTimeout(() => {
            chai.request(server)
              .get(`/pdf?file=${samplePdfUrl}`)
              .set('If-None-Match', res.headers.etag)
              .end((sndErr, sndRes) => {
                sndRes.status.should.equal(304);
                done();
              });
          }, 500);
        });
    });

    it('should serve files from cache', function (done) {
      sandbox.spy(fileCache, 'load');
      let path = `/pdf?file=${samplePdfUrl}`;
      fileCache.clear();
      chai.request(server)
        .get(path)
        .end((err, res) => {
          res.status.should.equal(200);
          setTimeout(function () {
            // wait until file persisted
            chai.request(server)
            .get(path)
            .end((sndErr, sndRes) => {
              sndRes.should.be.ok;
              fileCache.load.calledOnce.should.be.true;
              done();
            });
          }, 1000);
        });
    });

    it('should download the file again, if cache fails', function (done) {
      sandbox.spy(fileCache, 'remove');
      chai.request(server)
        .get(`/pdf?file=${samplePdfUrl}`)
        .end((err, res) => {
          res.status.should.equal(200);
          const etag = res.headers.etag;
          const cachedFilePath = config.get('Caching.Directory') + etag;
          fs.unlink(cachedFilePath);
          chai.request(server)
            .get(`/pdf?file=${samplePdfUrl}`)
            .end((err, res) => {
              res.should.be.ok;
              fileCache.remove.calledWith(etag);
              done();
            });
        });
    });
  });

  it('should not fail when removing not existing file', (done) => {
    fileCache.remove('notExisting');
    done();
  });

  it('should fail safely when file creation is not possible', (done) => {
    fileCache.add('', '', null);
    done();
  });
});

