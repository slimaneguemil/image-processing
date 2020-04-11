FROM node:8.12.0

ENV PORT 4005
RUN apt-get update \
  && apt-get install -y --no-install-recommends graphicsmagick \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install --no-optional && npm cache clean --force
COPY --chown=node:node . .
ENV DEBUG=app
HEALTHCHECK CMD curl --fail http://localhost:${PORT}/health || exit 1
CMD [ "node", "app.js" ]