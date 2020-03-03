#!/bin/sh

docker build -t faisalthaheem/simanno:ws-2.0 -f ./docker/ws/Dockerfile .
docker build -t faisalthaheem/simanno:web-2.0 -f ./docker/web/Dockerfile .