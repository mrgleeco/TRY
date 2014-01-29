# Dockerfile for openresty via https://github.com/torhve/openresty-docker
# VERSION   0.0.1

FROM ubuntu:12.04
MAINTAINER Greg Lee Coleman <gleeco@gmail.com>
ENV REFRESHED_AT 2014-01-27

RUN    echo "deb-src http://archive.ubuntu.com/ubuntu precise main" >> /etc/apt/sources.list
RUN    cat /etc/apt/sources.list
RUN    sed -i  's/main$/main universe/' /etc/apt/sources.list
RUN    apt-get update
RUN    apt-get -y upgrade
RUN    apt-get -y install wget vim git libpq-dev

# Openresty (Nginx)
RUN    apt-get -y build-dep nginx
RUN    wget http://openresty.org/download/ngx_openresty-1.4.3.6.tar.gz
RUN    tar xvfz ngx_openresty-1.4.3.6.tar.gz
RUN    cd ngx_openresty-1.4.3.6 && ./configure --with-luajit --with-http_addition_module --with-http_dav_module --with-http_geoip_module --with-http_gzip_static_module  --with-http_image_filter_module --with-http_realip_module --with-http_stub_status_module --with-http_ssl_module  --with-http_sub_module --with-http_xslt_module  --with-ipv6  --with-http_postgres_module --with-pcre-jit;  make; make install

EXPOSE 8080
CMD /usr/local/openresty/nginx/sbin/nginx -p `pwd` -c nginx.conf

