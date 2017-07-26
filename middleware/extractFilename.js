function extractFilename(response, fileParam) {
  const filenameRegExp = /filename=\"(.+)\"/ig;
  const contentDisposition = response.headers['content-disposition'];
  if (contentDisposition && contentDisposition.match(filenameRegExp)) {
    return filenameRegExp.exec(contentDisposition)[1];
  }

  while (fileParam.endsWith('/')) {
    fileParam = fileParam.substr(0, fileParam.length - 1);
  }

  let filename = '';
  const delimiterIndex = fileParam.lastIndexOf('/');
  if (delimiterIndex !== -1) {
    filename = fileParam.substr(delimiterIndex + 1);
  }

  return filename;
}

module.exports = extractFilename;
