FROM node:lts AS dist
COPY package.json yarn.lock ./

RUN yarn install

COPY . ./

EXPOSE $PORT

CMD [ "yarn", "start:dev" ]
