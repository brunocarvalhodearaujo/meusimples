FROM node:12.13.1-alpine

ENV HOME=/client

RUN apk --no-cache add curl

RUN addgroup -S client && \
    adduser -h $HOME/ -S -G client client

COPY package*.json $HOME/
RUN chown -R client:client $HOME/*

USER client
WORKDIR $HOME/

RUN npm install
RUN npm cache clean --force

USER root
COPY . $HOME/
RUN chown -R client:client $HOME/*

USER client

CMD [ "npm", "start" ]
