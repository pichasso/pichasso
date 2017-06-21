# pichasso [![Build Status](https://travis-ci.org/pichasso/pichasso.svg?branch=master)](https://travis-ci.org/pichasso/pichasso)[![Code Coverage](https://codecov.io/github/pichasso/pichasso/coverage.svg?branch=master)](https://codecov.io/github/pichasso/pichasso)![Github All Releases](https://img.shields.io/github/downloads/pichasso/pichasso/total.svg)

Smart image cropping and compression service

1. `docker-compose build`
2. `docker-compose up`

The web service runs on port `3000`. Debugging is available on port `9229`.

### Binding ports locally

To set up your personal port mapping, you can create a file named `docker-compose.override.yml` in the root directory:

```yaml
version: '3'
services:
  web:
    ports:
      - 3000:3000
      # Port of node debugger
      - 9229:9229
```

## Service Test

Open route `/image/test`, page will show all options available on this service.

## Test

`npm test`
or `npm run mocha` (will only run mocha)
or `npm run lint` (will only lint)

## API

| Parameter | Values | Description |
| --- | --- | --- |
| image | url | Image which will be processed and returned |
| width | number | A number greater than zero which defines the width |
| height | number | A number greater than zero which defines the height |
| *crop* | fill | uses one `gravity` effect to fill the whole size |
|  | fit | The image is fit inside the width and height attributes |
|  | scale | The image is scaled into both width and height attributes |
| *gravity* | entropy | Returns the image according to Shannon entropy |
|  | faces | Centers the image around the faces in the image |
|  | center | Returns the center part of the image |
|  | north, east, south, west | Returns the image aligned to the given direction |
| *format* | best accepted (default) | If the browser supports webp this type will be returned otherwise depending if there is transparency there will be either png or jpeg |
|  | webp | Returns the image in the webp format |
|  | jpeg | Returns the image in the jpeg format. If there is transparency the background color will be white |
|  | png | Returns the image in the png format |
| *quality* | quality | Adjust the quality between 0 and 100. Higher means better quality |



