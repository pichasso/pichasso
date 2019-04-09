FROM schulcloud/pichasso:builder

WORKDIR /usr/src/app   

VOLUME /tmp/pichasso

RUN mv /usr/src/app/node_modules /usr/src/node_modules
