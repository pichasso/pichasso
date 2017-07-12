const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const sinon = require('sinon');

const sandbox = sinon.sandbox.create();

chai.should();
chai.use(chaiHttp);


const samplePdfUrl = 'http://www.barrierefreies-webdesign.de/' +
  'knowhow/pdf-checkliste/pdf/Checkliste-Barrierefreies-PDF.pdf';

// parameters:
// file
// download
// quality: printer, screen or ebook (default: screen)
describe('PDF Controller', () => {
  afterEach(function () {
    sandbox.restore();
  });

  it('should return the compressed file', (done) => {
    chai.request(server)
      .get('/pdf?file=' + samplePdfUrl)
      .end((err, res) => {
        res.status.should.equal(200);
        done();
      });
  });
});
