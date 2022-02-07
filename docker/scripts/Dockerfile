FROM python:3.8

ADD code/scripts/ /simanno/scripts
WORKDIR /simanno/scripts

RUN python3.8 -m pip install --upgrade pip && \
    python3.8 -m pip install pycocotools pyyaml pysqlite3

ENTRYPOINT [ "/bin/sh", "-c" ]