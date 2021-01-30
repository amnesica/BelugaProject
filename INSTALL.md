## Install

### 1. Download and install requirements

In order to run the beluga project git, angular, postgres and java 11 have to be installed. To manage the database pgAdmin is highly recommended. Following instructions were tested on manjaro linux.

0. Update package database.
   First of all update the package database of pacman package manager with the following command

```
$ sudo pacman -Sy
```

1. Install Git

```
$ sudo pacman -S git
```

2. Install Java
   (at least Java 11 is required)

```
$ sudo pacman -S jdk11-openjdk
```

3. Install Maven

```
$ sudo pacman -S maven
```

4. Install PostgreSQL.
   To install and setup PostgreSQL use [this](https://linuxhint.com/install-postgresql-10-arch-linux/) excellent tutorial

5. Install pgAdmin

```
$ sudo pacman -S pgadmin4
```

6. Install a Java IDE like Eclipse. See [this](https://www.eclipse.org/downloads/packages/release/2020-12/r/eclipse-ide-java-developers) link for further instructions

7. Install Angular: To install and setup Angular use [this](https://angular.io/guide/setup-local) tutorial

### 2. Create new postgres user and database

Postgres uses the user `postgres` as a default user. However, it is recommended to create a new user for further operations. We will create a new user `beluga` who is the owner of the database used by the beluga project application.

1. Create postgres user `beluga`: Login as the unix user `postgres`

```
$ sudo -i -u postgres
```

2. Go into postgres

```
$ psql
```

3. Create postgres user `beluga`

```
$ CREATE ROLE beluga WITH LOGIN SUPERUSER CREATEDB CREATEROLE INHERIT REPLICATION CONNECTION LIMIT -1;
```

3. Create user default database of user `beluga`

```
$ CREATE DATABASE beluga WITH OWNER = beluga ENCODING = 'UTF8' TABLESPACE = pg_default CONNECTION LIMIT = -1;
```

4. Set a password for postgres user `beluga`

```
$  \password beluga
```

5. Log out of postgres

```
$  exit
```

6. Login to psql as the postgres user `beluga`

```
$  psql -U beluga
```

7. Create new database for application beluga project as user `beluga` whereas `belugaDb` is the chosen name for the database of the application

```
$  createDb belugaDb
```

### 3. Setup and run beluga project for first time

On first startup of the spring boot application the tables in the database are being created. To be able to run the spring boot application you have to provide some information in the configuration file `app.config` in `/Server/src/main/resources/` which is used when you run the application from Eclipse. The `app.config` in the root directory of the project is used in production mode when you are running the application as a jar file. For a first startup inside Eclipse this file is not needed.

To configure the `app.config` file in `/Server/src/main/resources/` use following instructions. If you missed to provide some information the application will not start.

You can easily add multiple feeder. Just go through the instructions and add an entry with an increasing number for the feeder. A feeder consists of `ipFeeder`, `typeFeeder`, `nameFeeder` and `colorFeeder` (e.g. a third feeder would consist of an `ipFeeder3`, `typeFeeder3`, `nameFeeder3` and `colorFeeder3`). Make sure you enter the right amount of feeders to `amountFeeder`.

1. Open the `app.config` in `/Server/src/main/resources/` with your favourite text editor
2. Enter your position. Later this will be the shown location on the map

```
latitudeLocation=54.1234
longitudeLocation=8.1234
```

3. Enter the ip addresses of your feeder with an json output. Currently the Flightradar24 feeder and the AirSquitter feeder are supported. Other feeder can be configured to work with this application as well

```
ipFeeder1=http://XXX.XXX.XXX.XX/aircraftlist.json
ipFeeder2=http://XXX.XXX.XXX.XX/dump1090/data/aircraft.json
```

4. Next specify the type of your feeders. This step is important as it assigns the mapping of the feeder to the aircraft entity used in the application. For example for the AirSquitter feeder the mapping will be listed in `airsquitter.config`. Other currently unsupported feeders do need to have a proper mapping configuration file

```
typeFeeder1=airsquitter
typeFeeder2=fr24feeder
```

5. Enter the names of your feeders which are later displayed in the aircraft information on the map

```
nameFeeder1=AirSquitterFeeder
nameFeeder2=Flightradar24Feeder
```

6. Specify a color for every feeder which is later used when the range data of this feeder is shown

```
colorFeeder1=red
colorFeeder2=blue
```

7. Enter the amount of your feeder

```
amountFeeder=2
```

8. Mention if the position of the International Space Station (ISS) should be displayed on your map. The position is feeded from the Open-Notify-API [here](http://open-notify.org/Open-Notify-API/ISS-Location-Now/)

```
showIss=true
```

9. Enter the amount and distances of range rings (in nautical miles) that should be displayed on the map

```
circleDistanceOfRing1=50
circleDistanceOfRing2=100
circleDistanceOfRing3=150
```

10. Enter the credentials and the name of the newly created database in the `application.properties` in `/Server/src/main/resources/`. The provided password "password" here is just an example

```
spring.datasource.url=jdbc:postgresql://localhost:5432/belugaDb
spring.datasource.username=beluga
spring.datasource.password=password
```

11. Start Eclipse and import the project with File -> Import -> Existing Maven Projects and locate the beluga project `/Server` folder

12. Run the application for the first time with a right click on `Application.java` -> Run As -> Java Application. The application should start for the first time and the tables should be created in the database `belugaDb`. If you missed to provide some information the application will not start. In this case check if you have filled all entries

### 4. Import database contents

Your application will start now but currently there is no information in the database to provide some additional information about the aircraft or its operator.

To fill the database tables `aircraftData`, `airportData`, `country_data`, `regcode_data` and `operator_data` use the following instructions. The provided csv file `operator_data.csv` is based on [this](https://en.wikipedia.org/wiki/List_of_airline_codes).

1. For the table `aircraft_data` download the file `aircraftDatabase.csv` from Opensky-Network [here](https://opensky-network.org/datasets/metadata/)

2. For the table `airport_Data` download the file `airports.csv` from OurAirports [here](https://ourairports.com/data/)

3. For the tables `country_data`, `regcode_data` and `operator_data` use the provided csv files in `/DbContent`

4. Unfortunately, if you want to fill the table `flightroute_data` you have to provide the data yourself

5. Copy the csv-files to a directory like `/var/lib/postgresql`

6. In the script `loadBelugaDb.sh` specify the path `pathToDirectoryWithCsv` to the directory with the csv-files (e.g. `/var/lib/postgresql/DbContent`)

7. Make the script `loadBelugaDb.sh` executable

```
$ chmod +x loadBelugaDb.sh
```

8. Execute the script to import the data from the csv files into the database tables (this might take some time)

```
$ ./loadBelugaDb.sh
```

## Run

### Build and run beluga project in Eclipse

1. Make sure you configured the configuration file `app.config` in `/Server/src/main/resources/`

2. Start the spring boot application with right click on `Application.java` -> Run As -> Java Application

3. Build and open the angular application in a browser with. If you are opening the angular application for the first time, run `npm install` first. Make sure the url of the server (here: `baseUrl`) in `/src/environments/environment.ts` fits.

```
$ ng serve --open
```

4. If your browser is not open yet, go to `http://localhost:4200/`

### Build and run beluga project as a jar file (production mode)

1. Make sure you configured the configuration file `app.config` in the projects root folder to be identical with the configuration file `app.config` in `/Server/src/main/resources/`

2. Build the angular application in production mode. If you are opening the angular application for the first time, run `npm install` first. Make sure the url of the server (here: `baseUrl`) in `/src/environments/environment.prod.ts` fits.

```
$ ng build --prod
```

3. Go into the `/Server` folder. Build the spring boot application with the command below. Afterwards, the jar file should be placed inside the `/Server/target` folder

```
$ mvn clean install
```

3. Execute the jar file (make sure to replace the given filename)

```
$ java -jar BelugaProject-X-X-X.jar
```

4. Open your browser and go to `http://*yourIpAddress*:8080/`

### Execute the application on startup

To start the program on startup use the following instructions. We will create a cronjob to start the application on startup as the process of a user.

1. Check if the script `beluga_start_script` has unix file format (lf) (very important step!)

2. Enter the path to the jar file and the filename of the beluga jar to 'pathBelugaJarWithFilename' (the filepath below is an example)

```
# path to beluga jar file with filename
pathBelugaJarWithFilename="/home/beluga/BelugaProject/BelugaProject-X-X-X.jar"
```

3. Make the script `beluga_start_script` executable

```
$ chmod +x beluga_start_script.sh
```

4. Open crontab as the current user with `crontab -e`. If you want to use another user as the current one use `sudo crontab -u *yourUsername* -e`

5. Add the following line at the very bottom of the opened file

```
@reboot sh *pathToBelugaStartScript*/beluga_start_script.sh
```

6. Save the file and reboot your computer

## Additional information

### How to add additional feeder?

For additional Flightradar24 or AirSquitter feeder refer to the section "3. Setup and run beluga project for first time".

If you want to add a feeder which is not yet supported you need to do more changes. In addition to the changes in the config files you have to add a proper mapping file and change corresponding methods in `AircraftService.java`. One method is `getAircraftsFromFeeder()` which must be adapted so that the values are read out correctly.

### Why are there no aircraft images displayed?

Unfortunately, the photo API we use is not open source and therefore it cannot be displayed in this repository. To display photos you have to modify the `getAircraftPhoto()` method in the `AircraftService.java` to return a photo-url using the hex or registration of the given aircraft.
