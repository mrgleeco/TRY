
FROM ubuntu:12.04

MAINTAINER Greg Lee Coleman <gleeco@jut.io>

#RUN apt-get update
#RUN apt-get upgrade -y

ADD http://s3.amazonaws.com/influxdb/influxdb_latest_amd64.deb /influxdb_latest_amd64.deb
RUN dpkg -i /influxdb_latest_amd64.deb && rm /influxdb_latest_amd64.deb 

EXPOSE 8083 8096

CMD ["/etc/init.d/influxdb", "start" ]



