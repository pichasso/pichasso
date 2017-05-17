var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app.js');
var should = chai.should();

chai.use(chaiHttp);

it('should render the home page', () => {
  return chai.request(server)
    .get('/')
    .then(res => {
      res.should.have.status(200);
      res.text.should.have.string('Pichasso is running');
    })
    .catch(err => {
      throw err;
    });
});