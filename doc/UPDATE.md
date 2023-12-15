## Update (Docker version)

This is a description of the **update** process for the Beluga Project running in a docker container on your system. If you do not have BelugaProject installed before, please use instructions in [INSTALL.md](./INSTALL.md) instead of this manual.

For `RaspberryPi 4B` it is recommended to use a `64 bit OS` version, because BelugaProject is running significantly faster than on 32 bit OS version.

1. Backup your `.env` file from your existing BelugaProject before proceeding.

   (here for example to folder ~/Documents)
   ```
   $ cd BelugaProject/
   $ cp .env ~/Documents/mybackup.env
   ```

2. Stop and remove all containers and images
   ```
   $ cd BelugaProject/
   $ sudo ./run.sh docker-stop
   $ sudo ./run.sh docker-rm
   ```

3. Remove existing BelugaProject directory

   (here assuming it is in your home directory)
   ```
   $ cd ~
   $ sudo rm -r BelugaProject
   ```

4. Download the latest version of the Beluga Project from [GitHub](https://github.com/amnesica/BelugaProject) as ZIP and extract it

   ```
   $ wget https://github.com/amnesica/BelugaProject/archive/refs/heads/master.zip -O BelugaProject.zip
   $ unzip BelugaProject.zip
   ```

5. Compare your backup `.env` file with the current template file `.env.template`

   `.env.template` may have been changed since last version. If there are no changes, you can restore your backup file with
   ```
   $ cd BelugaProject/
   $ cp ~/Documents/mybackup.env .env
	```

	If there are changes, you have to copy the new template and replace the TODO-Entries with the values of your backup file using an editor like nano.
   ```
   $ cp .env.template .env
   $ nano .env
	```
	Important: doublecheck your IP-adress!!!

   For further information on how to configure the `.env` file expand the following section
   <details>
   <summary>Click to expand</summary>

   To be able to run the spring boot application you have to provide some information in the configuration file `.env` which is used when you run the application with docker.

   To configure the file use following instructions to replace the `TODO`s.

   When configuring multiple feeders the order of the entries in the following instructions is important. The first entries in `ipFeeder`, `typeFeeder`, `nameFeeder` and `colorFeeder` belong to the same feeder as well as the second and so on.

   ***

   **Please note**:
   If you miss to provide some information or forgot to replace some `TODO`s the application start may fail or some features will not work properly.

   When you have multiple entries seperated by a comma **do not use blank spaces** like "entry,␣entry".

   ***

   1. Set your **feeder location**. Replace the values with your antenna position coordinates. Later this will be the shown on the map with an antenna icon.

      ```
      latitudeLocation=54.1234
      longitudeLocation=8.1234
      ```

   2. Enter the **URLs** of your feeders with an json output seperated by comma (If you do not have a local feeder, just leave the value empty)

    - for AirSquitter use the URL `http://XXX.XXX.XXX.XX/aircraftlist.json`
    - for tar1090 use the URL `http://XXX.XXX.XXX.XX/tar1090/data/aircraft.json`
    - for adsbx use the URL `http://XXX.XXX.XXX.XX/adsbx/data/aircraft.json`
    - for fr24feeder (dump1090) use the URL `http://XXX.XXX.XXX.XX/dump1090/data/aircraft.json`
    - for dump1090-fa use the URL `http://XXX.XXX.XXX.XX/dump1090-fa/data/aircraft.json`

      ```
      ipFeeder=URL1,URL2
      ```

   3. Enter the **type** of your feeders. Currently supported: adsbx, airsquitter, dump1090-fa, fr24feeder (If you do not have a local feeder, just leave the value empty)

      ```
      typeFeeder=typeoffeeder1,typeoffeeder2
      ```

   4. Enter the **name** of your feeders seperated by comma. Name should be not too long to fit well in control elements (If you do not have a local feeder, just leave the value empty)

      ```
      nameFeeder=Name1,Name2
      ```

   5. Enter the **color** of your feeders seperated by comma. This color is used later in statistical views (if you do not have a local feeder, set `colorFeeder=red` (valid color is needed here!)

      ```
      colorFeeder=red, blue
      ```

   6. Enter the **amount** of your feeders. This value must match with the amount of feeder configuration entries (If you do not have a local feeder set `amountFeeder=1`)

      ```
      amountFeeder=2
      ```

   7. Production URL for the frontend (`PROD_BASE_URL_WEBAPP`): Enter the URL of your productive systems ip address (for a simple test you can use `localhost`)

   8. Database password (`SPRING_DATASOURCE_PASSWORD`): Set password for the database `belugaDb`

   9. Opensky-Credentials: (**Optional**) Replace `TODO`s with your opensky network credentials. If you do not provide credentials this function will be disabled

   10. Search engine URL to search for aircraft pictures when planespotters.net does not find results (default is startpage): (**Optional**) Replace given URL with a new one. Important: `<PLACEHOLDER>` is required, because it will be replaced with registration or hex

   11. Add your API-Keys for additional maps (**Optional**)
      ```
      GEOAPIFY_API_KEY=
      CESIUM_ION_DEFAULTACCESSTOKEN=
      CESIUM_GOOGLEMAPS_API_KEY=
      ```
      (without these API-Keys you cannot see all availible maps in settings)
    </details>


6. Build the docker images and execute the containers (webapp, server, postgres) in the base path of Beluga Project.

   `Important:` If you installed docker only for root user, you need to execute the command below with `sudo` privilege

   ```
   $ ./run.sh install
   ```

   This will take some time. On an RaspberryPi 4B

    - container build takes about 14 minutes
    - load database takes about 10 minutes
    - first start in browser takes about 3 minutes until all aircrafts are visible

   Possible errors:

   Sometimes we got error messages like this in the container build process:

   > - Error response from daemon: Head "https://registry-1.docker.io/v2/library/postgres/manifests/13.1-alpine": net/http: TLS handshake timeout
   > - ERROR [webapp internal] load metadata for docker.io/library/node:20-alpine                                     0.2s
   > - Error [server internal] load metadata for docker.io/library/gradle:8.1.1-jdk17-focal:
   > - failed to solve: rpc error: code = Unknown desc = failed to solve with frontend dockerfile.v0: failed to create LLB definition: failed to authorize: rpc error: code = Unknown desc = failed to fetch anonymous token: Get "https://...: read tcp ... -> ... read: connection reset by peer

   In all this cases we simply repeated 
   ```
   $ ./run.sh install
   ```
   until container build was finished. We guess that timeouts occured while downloading objects from repositories. 

   The following error might appear after you run the command above:

   > psql: error: FATAL: the database system is in recovery mode

   In this case try execute `./run.sh load-db`.

   The following error might appear if you don't specify a flightroute.csv file:

   > ERROR: missing data for column "flight_route"
   >
   > CONTEXT: COPY flightroute_data, line 2: ""SAMPLE,EDDH-EDDF,1257415993"")

   You can ignore this error if you don't have a flightroute.csv file.

7. When Beluga Project is installed and is running go to `<system-prod-ip>:8090` in your browser. If you just want to test the project, enable the Opensky-Network functionality in the settings menu (an Opensky-Network account is needed).

8. Check Version of BelugaProject in browser

	If you don't see the expected (new) version, clean browser cache and try again.

   If you have not stopped and removed existing docker-images and containers before, do it now:

	Stop running containers
   ```
   $ ./run.sh docker-stop server
   $ ./run.sh docker-stop webapp
   ```
	
	Rebuild images and containers
   ```
   $ ./run.sh docker-build server
   $ ./run.sh docker-build webapp
   ```

	Restart with
   ```
   $ ./run.sh install
   ```
	
	Check version in browser again. 
   
9. Operation and Maintenance

   Executing 
   ```
   $ ./run.sh
   ```
   will show some options for troubleshooting, operation and database maintanance. `Important:` If you installed docker only for root user, you need to execute the command with `sudo` privilege.
   ```
   Usage: ./run.sh command
   commands:
      run                                   Run project with docker compose
      run-bg                                Run project with docker compose (in background)
      docker-build <image_name>             Build docker images (all when empty or specific image)
      docker-start <container_name>         Start container (all when empty or specific container)
      docker-stop <container_name>          Stop container (all when empty or specific container)
      docker-rm-container <container_name>  Remove container (all when empty or specific container)
      docker-rm-image <image_name>          Remove image (all when empty or specific container)
      docker-rm                             Remove all containers and images of Beluga Project
      download-mictronics                   Download mictronics db and convert jsons to csv files
      load-db                               Fill database in postgres container if tables were created
      update-db                             Update database in postgres container (db maintenance)
      tables-exist                          Check if tables in postgres container were created by spring
      env                                   Show current environment variables in .env file
      install                               Install project (build docker images and populate database)
   ```

10. Update database

      To update aircraft and airport data use this command:
      ```
      $ ./run.sh update-db
      ```
      It may take some time to prepare and upload the data to the postgres database. Be patient.

   

