const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const sinon = require('sinon');

const sandbox = sinon.sandbox.create();

chai.should();
chai.use(chaiHttp);


const samplePdfUrl = 'http://www.barrierefreies-webdesign.de/' +
  'knowhow/pdf-checkliste/pdf/Checkliste-Barrierefreies-PDF.pdf';

// TODO: use smaller file
const samplePdfUrlNoExtension = 'https://openwho.org/files/d78ff47e-7475-48eb-bb36-25aa0a848acd';

// parameters:
// file
// download
// quality: printer, screen or ebook (default: printer)
describe('PDF Controller', function () {
  this.timeout(30000);

  afterEach(function () {
    sandbox.restore();
  });

  // file
  it('should fail safely on non-pdf resources', (done) => {
    chai.request(server)
      .get('/pdf?file=' + 'https://openwho.org/files')
      .end((err, res) => {
        res.status.should.equal(400);
        done();
      });
  });

  it('should return the compressed file', (done) => {
    chai.request(server)
      .get('/pdf?file=' + samplePdfUrl)
      .end((err, res) => {
        res.status.should.equal(200);
        done();
      });
  });

  it('should return the compressed file (even without extension)', function (done) {
    chai.request(server)
      .get('/pdf?file=' + samplePdfUrlNoExtension)
      .end((err, res) => {
        res.status.should.equal(200);
        done();
      });
  });

  // download
  it('should download the compressed file', (done) => {
    chai.request(server)
      .get('/pdf?file=' + samplePdfUrl + '&download=1')
      .end((err, res) => {
        res.status.should.equal(200);
        res.headers['content-disposition'].should.contain('attachment');
        done();
      });
  });

  it('should not download the compressed file', (done) => {
    chai.request(server)
      .get('/pdf?file=' + samplePdfUrl)
      .end((err, res) => {
        res.status.should.equal(200);
        res.headers['content-disposition'].should.not.contain('attachment');
        done();
      });
  });

  // quality
  it('should return the compressed file in printer quality', (done) => {
    chai.request(server)
      .get('/pdf?file=' + samplePdfUrl + '&quality=printer')
      .end((err, res) => {
        res.status.should.equal(200);
        done();
      });
  });

  it('should return the compressed file in screen quality', (done) => {
    chai.request(server)
      .get('/pdf?file=' + samplePdfUrl + '&quality=screen')
      .end((err, res) => {
        res.status.should.equal(200);
        done();
      });
  });
});
