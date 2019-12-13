FROM node:12.13.1-alpine

ENV HOME=/server

RUN apk --no-cache add curl

RUN addgroup -S server && \
    adduser -h $HOME/ -S -G server server

COPY package*.json $HOME/
RUN chown -R server:server $HOME/*

USER server
WORKDIR $HOME/

RUN npm install
RUN npm cache clean --force

USER root
COPY . $HOME/
RUN chown -R server:server $HOME/*

USER server

CMD [ "npm", "start" ]
