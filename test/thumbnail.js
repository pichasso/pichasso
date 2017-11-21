const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const sinon = require('sinon');
const config = require('config');

const sandbox = sinon.sandbox.create();

chai.should();
chai.use(chaiHttp);

// parameters:
// file = web url

describe('Thumbnail Controller', function () {
  this.timeout(30000);

  afterEach(function () {
    sandbox.restore();
  });

  // webpage
  it('should create website thumbnail', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled')
      .returns(false);
    stub.callThrough();
    chai.request(server)
      .get('/thumbnail?file=' + 'https://google.com')
      .end((err, res) => {
        res.status.should.equal(200);
        done();
      });
  });
});
