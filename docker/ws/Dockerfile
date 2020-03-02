FROM python:3

ADD ws/ /opt/ft/ws
WORKDIR /opt/ft/ws

RUN pip3 install -r requirements.txt

EXPOSE 5000

CMD python3 imanno.py