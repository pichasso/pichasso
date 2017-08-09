FROM siomiz/node-opencv:2.4.x

ENV NODE_ENV production

RUN apt-get clean
RUN apt-get update -y
RUN apt-get install -fyqq ghostscript

EXPOSE 3000

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD ./package.json /usr/src/app/
RUN npm install 

RUN mkdir -p /tmp/pichasso

ADD ./ /usr/src/app

CMD npm start
