FROM ubuntu:22.04

# update the package list and clean up after
RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update \
  && apt-get install -y wget \
  && rm -rf /var/lib/apt/lists/*

# init BelugaProject directory with all content
RUN mkdir -p /BelugaProject
ADD . / /BelugaProject
WORKDIR BelugaProject

# install dependencies
RUN chmod +x Assets/Scripts/install_dependencies_docker.sh 
RUN ./Assets/Scripts/install_dependencies_docker.sh 

# build project
RUN chmod +x Assets/Scripts/build_docker.sh
RUN ./Assets/Scripts/build_docker.sh

# clean up
RUN cd ../ 
RUN rm nodesource_setup.sh jdk17.tar.gz apache-maven-*.tar.gz

# start BelugaProject
CMD java -jar Server/prod/BelugaProject-*.jar