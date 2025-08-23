FROM python:3.8

RUN python3.8 -m pip install --upgrade pip && \
    python3.8 -m pip install pycocotools pyyaml pysqlite3

ADD code/ /simanno/scripts
WORKDIR /simanno/scripts

ENTRYPOINT [ "/bin/sh", "-c" ]