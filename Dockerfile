FROM artifactory.momenta.works/docker/node:14-buster

USER node

COPY --chown=node:node package.json yarn.lock /home/node/app/

WORKDIR /home/node/app
RUN yarn install --frozen-lockfile

COPY --chown=node:node src public tsconfig.json /home/node/app
RUN yarn build

########################

FROM nginx:1.19-alpine AS app

COPY conf/nginx/ /etc/nginx/

COPY --from=0 /home/node/app/build /usr/share/nginx/html

EXPOSE 80
