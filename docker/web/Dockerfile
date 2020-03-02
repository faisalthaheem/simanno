FROM node:10

ADD app/ /opt/ft/web
WORKDIR /opt/ft/web
RUN npm install && npm install -g @angular/cli && ng build

EXPOSE 4200

CMD ng serve --host 0.0.0.0