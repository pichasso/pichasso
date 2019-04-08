FROM schulcloud/pichasso:builder

WORKDIR /usr/src/app   

# create volume for chaching directory
VOLUME /tmp/pichasso

# replace node_modules from within of mounted volume
COPY . .

# should display everything has been already installed
RUN npm i

EXPOSE 3000 
EXPOSE 9229 

CMD npm start

# # ------------ main ------------
# # base image https://hub.docker.com/_/node/
# FROM node:8.15-alpine

# WORKDIR /usr/src/app

# COPY . .
# COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
# RUN ls -lah

# RUN echo "@testing https://alpine.global.ssl.fastly.net/alpine/edge/testing/" >> /etc/apk/repositories
# RUN echo "@community https://alpine.global.ssl.fastly.net/alpine/edge/community/" >> /etc/apk/repositories
# RUN echo "@edge https://alpine.global.ssl.fastly.net/alpine/edge/main/" >> /etc/apk/repositories

# RUN apk update && apk upgrade && \
#   apk add --no-cache \
#   chromium@edge \
#   nss@edge \
#   freetype@edge \
#   harfbuzz@edge \
#   ttf-freefont@edge

# # Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# RUN apk add vips-dev@testing fftw-dev@edge build-base@edge --update-cache 

# RUN npm i shape

# RUN npm install
