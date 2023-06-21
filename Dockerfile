FROM node:lts-alpine3.18
ARG PORT=3001
WORKDIR /home/node/app
COPY . /home/node/app/
RUN npm install
RUN npx webpack
EXPOSE ${PORT}
ENV CMD_PORT ${PORT}
CMD npm start ${CMD_PORT}