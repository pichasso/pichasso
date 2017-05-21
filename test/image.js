var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app.js');
var should = chai.should();

chai.use(chaiHttp);

it.skip('should respond not implemented', () => {
  return chai.request(server)
    .get('/image')
    .then(res => {
      throw res;
    })
    .catch(err => {
      err.should.have.status(501);
    });
});
