function extractFilename(response, fileParam) {
  const filenameRegExp = /filename=\"(.+)\"/ig;
  const contentDisposition = response.headers['content-disposition'];
  let fileName;
  if (contentDisposition && contentDisposition.match(filenameRegExp)) {
    fileName = filenameRegExp.exec(contentDisposition)[1];
  } else {
    fileName = fileParam;
  }

  while (fileName.endsWith('/')) {
    fileName = fileName.substr(0, fileName.length - 1);
  }

  let extensionMatch = /\.[A-Za-z]{2,5}$/;
  while (fileName.match((extensionMatch))) {
    fileName = fileName.replace(extensionMatch, '');
  }

  const delimiterIndex = fileName.lastIndexOf('/');
  if (delimiterIndex !== -1) {
    fileName = fileName.substr(delimiterIndex + 1);
  }

  return fileName;
}

module.exports = extractFilename;
