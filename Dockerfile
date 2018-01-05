FROM siomiz/node-opencv:2.4.x

RUN apt-get update -y
RUN apt-get clean
RUN apt-get install -fyqq ghostscript 

# Set the Chrome repo.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
# Install Chrome to provide shared libraries for internal chromium.
RUN apt-get update && apt-get -y install google-chrome-stable

EXPOSE 3000

RUN mkdir -p /usr/src/app

ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src/app/

RUN mkdir -p /tmp/pichasso

ADD ./ /usr/src/app
WORKDIR /usr/src/app
