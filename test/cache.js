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

describe('Cache', () => {
  beforeEach(() => {
    fileCache.clear();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should cache the requested image', (done) => {
    chai.request(server)
      .get('/image?file=https://http.cat/400')
      .end((err, res) => {
        res.status.should.equal(200);
        const filePath = config.get('Caching.Imagepath') + res.headers.etag;
        fs.exists(filePath, (exists) => {
          exists.should.be.true;
          done();
        });
      });
  });

  it('should return same etag for same image', (done) => {
    chai.request(server)
      .get('/image?file=https://http.cat/400')
      .end((err, res) => {
        res.status.should.equal(200);
        const etag = res.headers.etag;
        chai.request(server)
          .get('/image?file=https://http.cat/400')
          .end((err, res) => {
            res.status.should.equal(200);
            etag.should.equal(res.headers.etag);
            done();
          });
      });
  });

  it('should return status 304 for etag', (done) => {
    chai.request(server)
      .get('/image?file=https://http.cat/400')
      .end((err, res) => {
        res.status.should.equal(200);
        chai.request(server)
          .get('/image?file=https://http.cat/400')
          .set('If-None-Match', res.headers.etag)
          .end((err, res) => {
            res.status.should.equal(304);
            done();
          });
      });
  });

  it('should serve files from cache', (done) => {
    sandbox.spy(fileCache, 'load');
    let path = '/image?file=https://http.cat/400';
    fileCache.clear();
    chai.request(server)
      .get(path)
      .end((err, res) => {
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
      .get('/image?file=https://http.cat/400')
      .end((err, res) => {
        res.status.should.equal(200);
        const etag = res.headers.etag;
        const cachedFilePath = config.get('Caching.Imagepath') + etag;
        fs.unlink(cachedFilePath);
        chai.request(server)
          .get('/image?file=https://http.cat/400')
          .end((err, res) => {
            res.should.be.ok;
            fileCache.remove.calledWith(etag);
            done();
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

