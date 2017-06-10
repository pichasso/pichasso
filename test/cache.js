const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('config');
const fileCache = require('../middleware/fileCache');
const fs = require('fs');
const server = require('../app');
const sinon = require('sinon');

chai.should();
chai.use(chaiHttp);

describe('Cache', () => {
  beforeEach(() => {
    fileCache.clear();
  });

  it('should cache the requested image', (done) => {
    chai.request(server)
      .get('/image?url=https://http.cat/400')
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
      .get('/image?url=https://http.cat/400')
      .end((err, res) => {
        res.status.should.equal(200);
        const etag = res.headers.etag;
        chai.request(server)
          .get('/image?url=https://http.cat/400')
          .end((err, res) => {
            res.status.should.equal(200);
            etag.should.equal(res.headers.etag);
            done();
          });
      });
  });

  it('should return status 304 for etag', (done) => {
    chai.request(server)
      .get('/image?url=https://http.cat/400')
      .end((err, res) => {
        res.status.should.equal(200);
        chai.request(server)
          .get('/image?url=https://http.cat/400')
          .set('If-None-Match', res.headers.etag)
          .end((err, res) => {
            res.status.should.equal(304);
            done();
          });
      });
  });

  it('should serve files from cache', (done) => {
    sinon.spy(fileCache, 'load');
    chai.request(server)
      .get('/image?url=https://http.cat/400')
      .end((err, res) => {
        res.status.should.equal(200);
        chai.request(server)
          .get('/image?url=https://http.cat/400')
          .end((err, res) => {
            res.should.be.ok;
            fileCache.load.calledOnce.should.be.true;
            fileCache.load.restore();
            done();
          });
      });
  });
});

