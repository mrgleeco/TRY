
FROM ubuntu:12.04

MAINTAINER Greg Lee Coleman <gleeco@jut.io>

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y wget

RUN wget --quiet -S http://s3.amazonaws.com/influxdb/influxdb_latest_amd64.deb

RUN dpkg -i influxdb_latest_amd64.deb

RUN apt-get autoremove -y wget

RUN influxdb -v
CMD ["/etc/init.d/influxdb", "start" ]

EXPOSE 8083 8096


