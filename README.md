# pichasso [![Build Status](https://travis-ci.org/pichasso/pichasso.svg?branch=master)](https://travis-ci.org/pichasso/pichasso)[![Code Coverage](https://codecov.io/github/pichasso/pichasso/coverage.svg?branch=master)](https://codecov.io/github/pichasso/pichasso)![Github All Releases](https://img.shields.io/github/downloads/pichasso/pichasso/total.svg)


### Introduction

Pichasso is an image service which helps to deliver optimal performance and to reduce the data transmitted. 
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
  <source media="(max-width: 767px)" 
          srcset="compressed_image_mobile_tablet.jpg, 
                  compressed_image_mobile_tablet_double_size.jpg 2x">
  <source media="(min-width: 768px)" 
          srcset="default_image.jpg, 
                  default_image_double_size.jpg 2x">
  <!-- Fallback for IE -->
  <img src="default_image.jpg" alt="Description">
</picture>
   ```

### Setup

Smart image cropping and compression service can run using docker-compose after cloning.

1. `docker-compose build`
2. `docker-compose up`

The web service runs on port `3000`. Debugging is available on port `9229` by default.

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

Open route `/image/test`, page will show all options available on this service. The pdf test interface is available on route `/pdf/test`.
Start pichassso with second step of setup or locally using `npm start`.

## Test

Locally use `npm test` or for docker try `docker-compose exec web npm test` instead.
or `npm run mocha` (will only run mocha)
or `npm run lint` (will only lint)

## Production

To adjust the configuration to own wishes create `/config/production.json` and 
overwrite the parameters you want to change. To start pichasso for production 
use `npm run production` which not only starts the service without test environment 
and debugging but as well sets the `NODE_ENV=production`. The test pages mentioned above are disabled in production mode.

## Clear Cache

Call a get request to route `/clear/{hash}` while `{hash}` has to be defined in the config file as `Caching.ClearHash`. The page should return OK and status 200 for valid hash. All cached files will get removed.

## API

### /image route

Sample url: http://url.tld/image?file=IMAGE_URL&width=180

| Parameter | Values | Description |
| --- | --- | --- |
| **file** | url | Image which will be processed and returned |
| **width** | number | A number greater than zero which defines the width |
| **height** | number | A number greater than zero which defines the height |
| **crop** | fill | uses one `gravity` effect to fill the whole size |
|  | fit | The image is fitted inside the width and height attributes |
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

### /pdf route

Instead of entering an image URL it is also possible to add a PDF url which then will be adjusted according to the following 
parameter. Sample url: http://url.tld/pdf?file=PDF_URL&quality=printer&download=1

| Parameter | Values | Description |
| --- | --- | --- |
| **pdf** | url | PDF which will be processed and returned |
| **quality** | printer, screen | Defines the quality whether it is for screen or for printing which scales images to 72 or 300 dpi |
| **download** | 1 or 0 | If 1 is selected the files will be downloaded when the process is finished |


## Thumbnail Service

### `/thumbnail` route

For creation of webpage thumbnails there is an GET-API using [puppeteer](https://github.com/GoogleChrome/puppeteer) behind the `/thumbnail` route.

| Parameter | Values | Description |
| --- | --- | --- |
| **file** | url | url pointing to a webpage |
| **device** | [Device](https://github.com/GoogleChrome/puppeteer/blob/master/DeviceDescriptors.js) | puppeteer device descriptor name like `iPhone%206` or `iPad` (url encoded slash), alternatively use: |
| **browserwidth** | number | viewport width, default `1000` |
| **browserheight** | number | viewport height, default `800`  |
| **browserscale** | number | viewport scaling factor, default `2` |
| **auth** | string | authentication token to prevent free usage |

The parameters above are used to take screenshots with defined size. All image conversion/cropping options of the `/image` route are supported and can be added to finally resize the taken screenshot.

### Thumbnail authentication

To prevent free access to thumbnail creation, authentication can be enabled in configuration setting `Thumbnail.Verification.Enabled` to be equal `true`. Based on the url given in the file parameter and a secret there will be a hash generated that must be added as get parameter `auth`. The secrets have to be set in configuration under the `Thumbnail.Verification.Accounts` path as list of objects containing the following properties:
```
{
    "Description": "sampledescription",
    "Enabled": true,
    "Token": "sampletoken"
}            
```
The required auth parameter can be requested from the server using the route `/thumbnail/verify/{sampletoken}/{url}` while url has to be transfered in url encoded format. The response text can be added as GET parameter `auth`.

If there are many screenshots requested from one site but different pages, it is possible to create an `auth` that tests only the hostname of the given domain name. To do so, add an Account of type hostname as follows:
```
{
    "Description": "sampledescription_host",
    "Enabled": true,
    "Type": "hostname"
    "Token": "sampletoken2"
}            
```
The generated `auth` using the route `/thumbnail/verify/sampletoken2/{url}` would be reusable for all pages with the same hostname.
