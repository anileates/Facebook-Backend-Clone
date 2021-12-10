FROM node
WORKDIR /opt/node-server
COPY . .
RUN npm install
CMD [ "node", "server.js" ]