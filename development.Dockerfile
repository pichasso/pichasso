FROM schulcloud/pichasso:builder

WORKDIR /usr/src/app   

RUN mv /usr/src/app/node_modules /usr/src/node_modules
