const config = require('config');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const server = require('../app.js');

const sandbox = sinon.sandbox.create();

chai.should();
chai.use(chaiHttp);

describe('index', function () {
  afterEach(function () {
    sandbox.restore();
  });

  it('should render the home page', () => {
    chai.request(server)
      .get('/')
      .then((res) => {
        res.should.have.status(200);
        res.text.should.have.string('Pichasso is running');
        done();
      })
      .catch((err) => {
        throw err;
      });
  });

  it('should return status 200', () => {
    chai.request(server)
      .head('/')
      .then((res) => {
        res.should.have.status(200);
        done();
      })
      .catch((err) => {
        throw err;
      });
  });

  it('should not find this page', () => {
    chai.request(server)
      .get('/notExisting')
      .end(res => res.should.have.status(404)).then(() => done());
  });

  it('clear cache returns forbidden without correct hash', () => {
    Promise.all(chai.request(server)
      .get('/clear')
      .end(res => res.should.have.status(404)),
    chai.request(server)
      .get('/clear/123456')
      .end((err, res) => {
        res.should.have.status(403);
      })).then(() => done());
  });

  it('clear cache executed with correct hash', () => {
    let stub = sandbox.stub(config, 'get');
    stub.withArgs('Caching.ClearHash')
      .returns('testhash');
    stub.callThrough();
    chai.request(server)
      .get('/clear/testhash')
      .end((err, res) => res.should.have.status(200)).then(() => done());
  });
});
