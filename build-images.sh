#!/bin/sh

docker build -t simanno/ws:2.0 -f ./docker/ws/Dockerfile ./code/
docker build -t simanno/app:2.0 -f ./docker/web/Dockerfile ./code/