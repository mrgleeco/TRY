FROM ubuntu
MANTAINER Greg Lee Coleman "gleeco@gmail.com"
RUN apt-get -y install perl git-core curl
RUN curl -L http://cpanmin.us | perl - App::cpanminus
RUN git clone https://github.com/mrallen1/perl-UA-Bench
RUN cpanm -installdeps /perl-UA-Bench
CMD /perl-UA-Bench/starman app.hello-world.psgi
EXPOSE 5000
