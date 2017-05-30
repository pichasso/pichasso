FROM node:7.10

EXPOSE 3000 9229

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD ./package.json /usr/src/app/
RUN npm install --quiet

ADD ./ /usr/src/app

CMD npm run development