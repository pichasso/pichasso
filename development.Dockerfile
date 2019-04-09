FROM schulcloud/pichasso:builder

VOLUME /tmp/pichasso

RUN mv /usr/src/app/node_modules /usr/src/node_modules

WORKDIR /usr/src/app   
