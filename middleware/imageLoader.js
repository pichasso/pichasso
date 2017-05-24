const http = require('http');
const https = require('https');
const probe = require('probe-image-size');

function imageLoader(req, res, next) {
    let protocol = http;
    if (/^https/.test(req.query.url)) {
        protocol = https;
    }
    protocol.get(req.query.url, (response) => {
        const {statusCode} = response;
        const contentLength = Number(response.headers['content-length']);
        const contentType = response.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error(`Request failed.\nStatus Code: ${statusCode}`);
        } else if (!/^image\//.test(contentType)) {
            error = new Error(`Invalid content-type. Expected image, but received ${contentType}.`);
        }

        if (error) {
            res.status(500).render('error', {error: error});
            return;
        }

        const imageBuffer = Buffer.alloc(contentLength);
        let bufPosition = 0;
        response.on('data', (chunk) => {
            chunk.copy(imageBuffer, bufPosition);
            bufPosition += chunk.length;
        });
        response.on('end', () => {
            req.image = imageBuffer;
            req.imageProperties = probe.sync(req.image);
            next();
        });
        response.on('error', (error) => {
            res.status(500).render('error', {error: error});
        });
    });
}

module.exports = imageLoader;
