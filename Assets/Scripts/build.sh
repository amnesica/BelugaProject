#!/bin/bash
# A Bash script to build the Beluga Project 
echo -- Starting build process for the BelugaProject --

# Remind user to check prod url in angular
read -p "Gentle reminder: Have you checked for the correct prod baseurl in the Webapp (y/n)?" choice
case "$choice" in 
  y|Y ) echo "Yes, let's continue...";;
  n|N ) echo "No, let's stop here."; exit;;
  * ) echo "Invalid, let's stop here."; exit;;
esac

# Remind user to check if version should be updated
read -p "Gentle reminder: Have you updated the version (if necessary) (y/n)?" choice
case "$choice" in 
  y|Y ) echo "Yes, let's continue...";;
  n|N ) echo "No, let's stop here."; exit;;
  * ) echo "Invalid, let's stop here."; exit;;
esac

# Install npm and dependencies
echo 1. Install npm and dependencies
cd ../../Webapp && npm install
echo Done.

# Build angular in production mode
echo 2. Building angular application in production mode ...
ng build --prod
echo Done.

# Build maven project and generate jar
echo 3. Building maven application and generating jar ...
cd ../server && mvn clean install -DskipTests
echo Done. You can find the jar along with the config files in server/prod/
