const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');

chai.should();
chai.use(chaiHttp);

describe('Cache', () => {
  it('should return cached image for etag', (done) => {
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
});

