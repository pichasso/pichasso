FROM node:8

ENV NODE_ENV production

EXPOSE 3000

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD ./package.json /usr/src/app/
RUN npm install --quiet

ADD ./ /usr/src/app

CMD npm start