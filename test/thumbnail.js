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

  // webpage without verification
  it('should create website thumbnail', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(false);
    stub.callThrough();
    chai.request(server)
      .get('/thumbnail?file=' + 'https://google.com')
      .end((err, res) => {
        res.status.should.equal(200);
        done();
      });
  });

  it('should return 404 for non existing domain', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(false);
    stub.callThrough();
    chai.request(server)
      .get('/thumbnail?file=' + 'http://notexisting.domain')
      .end((err, res) => {
        res.status.should.equal(404);
        done();
      });
  });

  it('should return 501 for not implemented document format', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(false);
    stub.callThrough();
    chai.request(server)
      .get('/thumbnail?file=' + 'http://che.org.il/wp-content/uploads/2016/12/pdf-sample.pdf')
      .end((err, res) => {
        res.status.should.equal(501);
        done();
      });
  });
});

describe('Thumbnail Controller verification', function () {
  this.timeout(30000);

  afterEach(function () {
    sandbox.restore();
  });

  it('should create verification key', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(true);
    stub.withArgs('Thumbnail.Verification.Accounts').returns([{
      'Description': 'sampledescription',
      'Enabled': true,
      'Token': 'sampletoken',
    }]);
    stub.callThrough();
    const path = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://google.com');
    console.log('request verification path', path);
    chai.request(server)
      .get(path)
      .end((err, res) => {
        res.status.should.equal(200);
        res.text.should.equal('103655');
        done();
      });
  });


  it('should not create verification key', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(true);
    stub.withArgs('Thumbnail.Verification.Accounts').returns([{
      'Description': 'sampledescription',
      'Enabled': false,
      'Token': 'sampletoken',
    }]);
    stub.callThrough();
    const path = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://google.com');
    console.log('request verification path', path);
    chai.request(server)
      .get(path)
      .end((err, res) => {
        res.status.should.equal(403);
        done();
      });
  });


  it('should not create verification key', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(true);
    stub.withArgs('Thumbnail.Verification.Accounts').returns([{
      'Description': 'sampledescription',
      'Enabled': true,
      'Token': 'othertoken',
    }]);
    stub.callThrough();
    const path = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://google.com');
    console.log('request verification path', path);
    chai.request(server)
      .get(path)
      .end((err, res) => {
        res.status.should.equal(403);
        done();
      });
  });

  it('should create hostname specific verification key only', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(true);
    stub.withArgs('Thumbnail.Verification.Accounts').returns([{
      'Description': 'sampledescription',
      'Enabled': true,
      'Type': 'hostname',
      'Token': 'sampletoken',
    }]);
    stub.callThrough();
    const path = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Wikipedia:Hauptseite');
    const path2 = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Portal:Wissenschaft');
    const auth = '13f62f';
    console.log('request verification path', path);
    chai.request(server)
      .get(path)
      .end((err, res) => {
        res.status.should.equal(200);
        res.text.should.equal(auth);
        done();
      });
  });
  
  it('should match hostname specific verification key', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(true);
    stub.withArgs('Thumbnail.Verification.Accounts').returns([{
      'Description': 'sampledescription',
      'Enabled': true,
      'Type': 'hostname',
      'Token': 'sampletoken',
    }]);
    stub.callThrough();
    const path = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Wikipedia:Hauptseite');
    const path2 = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Portal:Wissenschaft');
    const auth = '13f62f';
    console.log('request verification path', path2);
    chai.request(server)
      .get(path)
      .end((err, res) => {
        res.status.should.equal(200);
        res.text.should.equal(auth);
        done();
      });
  });

  it('should create url specific verification key', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(true);
    stub.withArgs('Thumbnail.Verification.Accounts').returns([{
      'Description': 'sampledescription',
      'Enabled': true,
      'Type': 'url', // or without Type
      'Token': 'sampletoken',
    }]);
    stub.callThrough();
    const path = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Wikipedia:Hauptseite');
    const path2 = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Portal:Wissenschaft');
    const auth = '1659cf';
    console.log('request verification path', path);
    chai.request(server)
      .get(path)
      .end((err, res) => {
        res.status.should.equal(200);
        res.text.should.equal(auth);
        console.log('hostname unspecific auth key 1:', res.text)
        done();
      });
  });

  it('should not match url specific verification key', (done) => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('Thumbnail.Verification.Enabled').returns(true);
    stub.withArgs('Thumbnail.Verification.Accounts').returns([{
      'Description': 'sampledescription',
      'Enabled': true,
      'Type': 'url', // or without Type
      'Token': 'sampletoken',
    }]);
    stub.callThrough();
    const path = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Wikipedia:Hauptseite');
    const path2 = '/thumbnail/verify/sampletoken/' + encodeURIComponent('https://de.wikipedia.org/wiki/Portal:Wissenschaft');
    const auth = '1659cf';
    console.log('request verification path', path2);
    chai.request(server)
      .get(path)
      .end((err, res) => {
        res.status.should.equal(200);
        res.text.should.equal(auth);
        console.log('hostname unspecific auth key 1:', res.text)
        done();
      });
  });
});
