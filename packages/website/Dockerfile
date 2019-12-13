FROM node:12.13.1-alpine

ENV HOME=/website

RUN apk --no-cache add curl

RUN addgroup -S website && \
    adduser -h $HOME/ -S -G website website

COPY package*.json $HOME/
RUN chown -R website:website $HOME/*

USER website
WORKDIR $HOME/

RUN npm install
RUN npm cache clean --force

USER root
COPY . $HOME/
RUN chown -R website:website $HOME/*

USER website

CMD [ "npm", "start" ]
