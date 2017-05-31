const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');

chai.should();
chai.use(chaiHttp);

it('should render the home page', () => chai.request(server)
    .get('/')
    .then((res) => {
      res.should.have.status(200);
      res.text.should.have.string('Pichasso is running');
    })
    .catch((err) => {
      throw err;
    }));
