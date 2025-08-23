#!/bin/sh

docker build -t faisalthaheem/simanno-be:latest -f ./be/Dockerfile ./be
docker build -t faisalthaheem/simanno-fe:latest -f ./fe/Dockerfile ./fe
