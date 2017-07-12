FROM node:8

ENV NODE_ENV production

RUN apt-get clean
RUN apt-get update -y
RUN apt-get install -fyqq ghostscript

EXPOSE 3000

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD ./package.json /usr/src/app/
RUN npm install 

RUN mkdir -p /tmp/imagecache

ADD ./ /usr/src/app

CMD npm start
