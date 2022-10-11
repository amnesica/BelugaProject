## Temp docker install manual (Ubuntu and Windows)

With this manual you can install the Beluga Project in a docker container on your system. Only docker is required on your machine. Everything else will be taken care of in the container. Run the following instructions on your productive system, e.g. a Raspberry Pi 4B or on your local machine if you just want to test the project. Instructions are mainly for Debian based systems.

If you don't have a ADS-B receiver you can use the [Opensky-Network](https://opensky-network.org/). Create an account there first.

0. Install docker and docker compose with [docker desktop](https://docs.docker.com/) and make it run (do the tutorial if necessary). Use [this](https://docs.docker.com/engine/install/debian/#install-using-the-convenience-script) tutorial for installing docker on a Raspberry Pi 

1. Download the Beluga Project from [Github](https://github.com/amnesica/BelugaProject) as ZIP and extract it (TODO: Change 'dev' to 'master' in url)
    ```
    $ wget https://github.com/amnesica/BelugaProject/archive/refs/heads/dev.zip -O BelugaProject.zip
    $ unzip BelugaProject.zip
    ```

2. Configure the application properties. Rename `application.properties.template` file to `application.properties` in `/Server/src/main/resources/config` and replace the TODO's. Here we use `nano` for editing the config file
    ```
    $ cd Server/src/main/resources/config
    $ cp application.properties.template application.properties
    $ nano application.properties
    ```
    For furher information on how to configure the `application.properties` expand the following secion
    <details>
    <summary>Click to expand</summary>

    To be able to run the spring boot application you have to provide some information in the configuration file `application.properties` in `/Server/src/main/resources/config` which is used when you run the application.

    First duplicate template file `application.properties.template` and name it `application.properties`. To configure the file use following instructions to replace the `TODO`s. If you missed to provide some information or forgot to replace some `TODO`s the application start may fail or some features will not work properly.

    When configuring multiple feeders the order of the entries in the following instructions are important. The first entries in `ipFeeder`, `typeFeeder`, `nameFeeder` and `colorFeeder` belong to the same feeder as well as the second and so on.

    - Set your feeder location. Replace the values with your antenna position coordinates. Later this will be the shown on the map with an antenna icon.

    ```
    latitudeLocation=54.1234
    longitudeLocation=8.1234
    ```

    - Enter the URLs of your feeders with an json output seperated by comma.

    - for AirSquitter use the URL `http://XXX.XXX.XXX.XX/aircraftlist.json`
    - for tar1090 use the URL `http://XXX.XXX.XXX.XX/tar1090/data/aircraft.json`
    - for adsbx use the URL `http://XXX.XXX.XXX.XX/adsbx/data/aircraft.json`
    - for fr24feeder (dump1090) use the URL `http://XXX.XXX.XXX.XX/dump1090/data/aircraft.json`
    - for dump1090-fa use the URL `http://XXX.XXX.XXX.XX/dump1090-fa/data/aircraft.json`

    ```
    ipFeeder=URL1, URL2
    ```

    If you do not have a local feeder, set `ipFeeder=NONE`.

    - Enter the type of your feeders (currently supported: adsbx, airsquitter, dump1090-fa, fr24feeder)

    ```
    typeFeeder=typeoffeeder1, typeoffeeder2
    ```

    If you do not have a local feeder, set `typeFeeder=NONE`.

    - Enter the name of your feeders seperated by comma. Name should be not too long to fit well in control elements.

    ```
    nameFeeder=Name1, Name2
    ```

    If you do not have a local feeder, set `nameFeeder=NONE`.

    - Enter the color of your feeders seperated by comma. This color is used later in statistical views

    ```
    colorFeeder=red, blue
    ```

    If you do not have a local feeder, set `colorFeeder=NONE`.

    - Enter the amount of your feeders

    ```
    amountFeeder=2
    ```

    If you do not have a local feeder, set `amountFeeder=1` (this value must match with the amount of feeder configuration entries).

    - Database properties: Set password for the database `belugaDb`

    - Opensky-Credentials: (Optional) Replace `TODO`s with your opensky network credentials. If you do not provide credentials this function will be disabled.

    - Search engine url to search for aircraft pictures when planespotters.net does not find results (default is startpage): (Optional) Replace given url with a new one. Important: `<PLACEHOLDER>` is required, because it will be replaced with registration or hex
           
    </details>


3. Change prod url in `/Webapp/src/environments` to your productive systems ip address (for a simple test you can use `localhost`)

4. Build the docker image and execute the containers (1x postgresql, 1x server incl. webapp) in the base path of Beluga Project. Note: If you installed docker only for root user, you need to execute `docker compose up` with sudo privilege

    ```
    $ docker compose up
    ```

5. When Beluga Project is running (if you see the BelugaProject-Font in the terminal window) go to `<system-prod-ip>:8080` in your browser. There are no aircraft and airport icons yet, let's import them into the database. If you're on a linux system such as the Raspberry Pi you can use linux variant. If you're currently on windows and just want to try things out you can use the windows variant

    1. Instructions on **linux**
        <details>
        <summary>Click to expand</summary>

        Open a new terminal window and run the following commands to populate the database in the docker container. Check the file `loadBelugaDb_output.txt` to see the output of the `loadBelugaDb.sh` script. Note: If you installed docker only for root user, you need to execute the following command: `chmod +x Assets/Scripts/docker_load_db.sh && sudo ./Assets/Scripts/docker_load_db.sh` (note the sudo before `./Assets/Scripts/docker_load_db.sh`)

        ```
        $ chmod +x Assets/Scripts/docker_load_db.sh && ./Assets/Scripts/docker_load_db.sh
        ```
        </details>

    2. Instructions on **windows**
        <details>
        <summary>Click to expand</summary>
        
        For testing purposes you can also use the following commands to populate the database in the docker container `postgresdb`.

        1. Copy content from DbContent directory to container
        ```
        $ docker cp Assets/DbContent postgresdb:/var/lib/postgresql
        ```

        2. Download files in postgres container and copy them to other files in `/DbContent` directory
        ```
        $ docker exec -ti postgresdb bash -c "wget https://opensky-network.org/datasets/metadata/aircraftDatabase.csv -O aircraftDatabase.csv"

        $ docker exec -ti postgresdb bash -c "cp aircraftDatabase.csv /var/lib/postgresql/DbContent"

        $ docker exec -ti postgresdb bash -c "wget https://davidmegginson.github.io/ourairports-data/airports.csv -O airports.csv"

        $ docker exec -ti postgresdb bash -c "cp airports.csv /var/lib/postgresql/DbContent"
        ```

        3. Copy load script for database `loadBelugaDb` to container
        ```
        $ docker cp Assets/Scripts/loadBelugaDb.sh postgresdb:loadBelugaDb.sh
        ```

        4. Execute `loadBelugaDb` script on database container. Check the file `loadBelugaDb_output.txt` to see the output of the `loadBelugaDb.sh` script
        ```
        $ docker exec postgresdb bash -c ". loadBelugaDb.sh" >loadBelugaDb_output.txt
        ```
        </details>

    Possible errors:

    The following error might appear after you run the command above:
    
    > psql: error: FATAL:  the database system is in recovery mode

    
    In this case try the command above again after some time.

    The following error might appear if you don't specify a flightroute.csv file:
    
    > ERROR: missing data for column "flight_route"
    >
    > CONTEXT: COPY flightroute_data, line 2: ""SAMPLE,EDDH-EDDF,1257415993"")

    You can ignore the error if you don't have a flightroute.csv file.

6. Reload the configuration in the browser with a reload of `<system-prod-ip>:8080`. Aircraft and airport icons should be visible now (if you're not sure about the aircraft icons you can test it with the Opensky-Network functionality)

9. TODO: Run docker container at startup of productive system!