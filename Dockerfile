FROM node:latest

RUN apt update
RUN apt upgrade -y

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

ADD . /usr/src/app/

RUN npm install -g typescript
RUN npm run dockerprodbuild

CMD ["npm", "start"]