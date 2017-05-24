var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app.js');
var should = chai.should();

chai.use(chaiHttp);

it('should return an image', () => {
  return chai.request(server)
    .get('/image?url=https://http.cat/100&width=100&height=100')
    .then(res => {
      res.should.be.ok;
    })
    .catch(err => {
      throw err;
    });
});
