FROM siomiz/node-opencv:2.4.x

ENV NODE_ENV production

RUN apt-get update -y
RUN apt-get clean
RUN apt-get install -fyqq ghostscript 

# See https://crbug.com/795759
RUN apt-get install -yq libgconf-2-4 

# Set the Chrome repo.
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb
    
EXPOSE 3000

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD ./ /usr/src/app/
RUN npm install 

RUN mkdir -p /tmp/pichasso

CMD npm run development 
