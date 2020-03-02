FROM node:10

ADD app/ /opt/ft/web
WORKDIR /opt/ft/web
RUN npm install && npm install -g @angular/cli && ng build

EXPOSE 80

FROM nginx:1.16.1-alpine
COPY --from=0 /opt/ft/web/dist /usr/share/nginx/html
