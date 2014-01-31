# Dockerfile for openresty via https://github.com/torhve/openresty-docker
# VERSION   0.0.1

# FROM ubuntu
FROM gleeco/raring-base

MAINTAINER Greg Lee Coleman <gleeco@gmail.com>
ENV REFRESHED_AT 2014-01-29


RUN    echo "deb-src http://archive.ubuntu.com/ubuntu precise main" >> /etc/apt/sources.list
RUN    sed -i  's/main$/main universe/' /etc/apt/sources.list
RUN    apt-get update
RUN    apt-get -y upgrade
RUN    apt-get -y install curl git libpq-dev

# Openresty (Nginx)
RUN    apt-get -y build-dep nginx
RUN    curl -s -O http://openresty.org/download/ngx_openresty-1.4.3.6.tar.gz
RUN    tar xfz ngx_openresty-1.4.3.6.tar.gz
RUN    cd ngx_openresty-1.4.3.6 && ./configure --with-luajit --with-http_addition_module --with-http_dav_module --with-http_geoip_module --with-http_gzip_static_module  --with-http_image_filter_module --with-http_realip_module --with-http_stub_status_module --with-http_ssl_module  --with-http_sub_module --with-http_xslt_module  --with-ipv6  --with-http_postgres_module --with-pcre-jit;  make; make install

RUN    apt-get purge -y build-dep

EXPOSE 8080
CMD /usr/local/openresty/nginx/sbin/nginx -p `pwd` -c nginx.conf

