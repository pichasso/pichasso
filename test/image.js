const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');

chai.should();
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
