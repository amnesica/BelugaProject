#!/bin/bash
# A Bash script to build the Beluga Project within a docker container
echo -- Starting build process for the BelugaProject for docker --

# Install npm and dependencies
echo 1. Install npm and dependencies
cd Webapp && npm install
echo Done.

# Build angular in production mode
echo 2. Building angular application in production mode ...
ng build --prod
echo Done.

# Build maven project and generate jar (skip tests because postgres is not configured and build will fail otherwise)
echo 3. Building maven application and generating jar ...
cd ../Server && mvn clean install -DskipTests
echo Done. You can find the jar along with the config files in Server/prod/
