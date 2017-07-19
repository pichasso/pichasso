# pichasso [![Build Status](https://travis-ci.org/pichasso/pichasso.svg?branch=master)](https://travis-ci.org/pichasso/pichasso)[![Code Coverage](https://codecov.io/github/pichasso/pichasso/coverage.svg?branch=master)](https://codecov.io/github/pichasso/pichasso)![Github All Releases](https://img.shields.io/github/downloads/pichasso/pichasso/total.svg)


### Introduction

pichasso is an image service which helps to deliver optimal performance and to reduce the data transmitted. 
By adjusting the delivered images to given parameters it allows developers to focus only on the creation of their webpage while pichasso is handling the images. 
Since not every time the sizes are fitting to the image pichasso offers intelligent ways to crop the image fitting to the needs with features like a face detection
to avoid cutting people in half. 

Often websites are facing difficulties at providing the right images for the user, one the one hand those images are 
often not compressed which is a waste of bandwidth and performance. On the other hand since there are many different
devices on the market the image needs to be available in different resolutions to be fitting on each of them. 
On mobile devices a lower resolution increases the performance drastically while on the desktop if the resolution is 
too low it does not look professional at all. pichasso also handles all of these problems and provides the image with the ideal compression for every use case
while also using modern image formats like WebP. pichasso automatically detects alpha channels and chooses the format on behalf of 
the given client side supported fortmats. Depending on the given size pichasso automatically adjust the picture and
returns the perfect compressed image. 

We recommend to combine pichasso with a CDN to allow faster response times around the globe. 
This feature can be easily integrated by using image source sets: 

```html
    <picture>
      <source
      media="(min-width: 768_px_)" 
      srcset="imageservice.url.jpg imageservice.url2x.jpg, 2x">
      <!--Fallback-->
      <img src="imageservice.url.jpg" alt="Description">
    </picture>
   ```

### Setup

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
Start pichassso with `npm start`.

## Test

`npm test`
or `npm run mocha` (will only run mocha)
or `npm run lint` (will only lint)

## Production
To adjust the configuration to own wishes add next to the `/config/default.json`  a *production.json* 
with own parameters. To start pichasso for production use `npm production` which not only 
starts the service without test environment and debugging but as well sets the 
`NODE_ENV=production`. 

## API

| Parameter | Values | Description |
| --- | --- | --- |
| **image** | url | Image which will be processed and returned |
| **width** | number | A number greater than zero which defines the width |
| **height** | number | A number greater than zero which defines the height |
| **crop** | fill | uses one `gravity` effect to fill the whole size |
|  | fit | The image is fit inside the width and height attributes |
|  | scale | The image is scaled into both width and height attributes |
| **gravity** | entropy | Returns the image according to Shannon entropy |
|  | faces | Centers the image around the faces in the image |
|  | center | Returns the center part of the image |
|  | north, east, south, west | Returns the image aligned to the given direction |
| **format** | best accepted (default) | If the browser supports webp this type will be returned otherwise depending if there is transparency there will be either png or jpeg |
|  | webp | Returns the image in the webp format |
|  | jpeg | Returns the image in the jpeg format. If there is transparency the background color will be white |
|  | png | Returns the image in the png format |
| **quality** | quality | Adjust the quality between 0 and 100. Higher means better quality |


## PDF Compression Service
Instead of entering an image URL it is also possible to add a PDF url which then will be adjusted according to the following 
parameter. 
| Parameter | Values | Description |
| --- | --- | --- |
| **pdf** | url | PDF which will be processed and returned |
| **quality** | printer, screen | Defines the quality whether it is for screen or for printing |
| **download** | 1 or 0 | If 1 is selected the files will be downloaded when the process is finished |






