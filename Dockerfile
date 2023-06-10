FROM node:lts-alpine3.18
WORKDIR /home/node/app
COPY . /home/node/app/
RUN npm install
RUN npx webpack
EXPOSE 3001
CMD npm start