# pichasso [![Build Status](https://travis-ci.org/pichasso/pichasso.svg?branch=master)](https://travis-ci.org/pichasso/pichasso)[![Code Coverage](https://codecov.io/github/pichasso/pichasso/coverage.svg?branch=master)](https://codecov.io/github/pichasso/pichasso)![Github All Releases](https://img.shields.io/github/downloads/pichasso/pichasso/total.svg)

Smart image cropping and compression service

1. `docker-compose build`
2. `docker-compose up`

The web service runs on port `3000`. Debugging is available on port `9229`.

## Service Test

Open route `/image/test`, page will show all options available on this service.

## Test

`npm test`
or `npm run mocha` (will only run mocha)
or `npm run lint` (will only lint)
