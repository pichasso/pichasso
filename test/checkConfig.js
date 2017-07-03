const chai = require('chai');
const config = require('config');
const checkConfig = require('../controllers/checkConfig');
const sinon = require('sinon');

const sandbox = sinon.sandbox.create();

chai.should();

describe('Check configuration', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('should throw when no loading method is allowed', () => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('ImageSource.LoadExternalData.Enabled').returns(false);
    stub.withArgs('ImageSource.LoadById.Enabled').returns(false);
    stub.callThrough();
    checkConfig.should.throw('Invalid configuration.' +
      'Set either ImageSource.LoadExternalData.Enabled or ImageSource.LoadById.Enabled to true.');
  });

  it('should throw when loading external data and no protocols allowed', () => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('ImageSource.LoadExternalData.Enabled').returns(true);
    stub.withArgs('ImageSource.LoadExternalData.ProtocolsAllowed').returns([]);
    stub.callThrough();
    checkConfig.should.throw('ImageSource.LoadExternalData.ProtocolsAllowed not defined.');
  });

  it('should throw when loading by id and no source path defined', () => {
    const stub = sandbox.stub(config, 'get');
    stub.withArgs('ImageSource.LoadById.Enabled').returns(true);
    stub.withArgs('ImageSource.LoadById.SourcePath').returns('');
    stub.callThrough();
    checkConfig.should.throw('ImageSource.LoadById.SourcePath is undefined.');
  });
});

