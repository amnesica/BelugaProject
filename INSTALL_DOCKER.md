## Temp docker install manual (Ubuntu and Windows)

With this manual you can install the Beluga Project in a docker container on your system. Only docker is required on your machine. Everything else will be taken care of in the  container. Run the following instructions on your productive system, e.g. a Raspberry Pi 4B or on your local machine if you just want to test the project.

0. Install docker and docker compose with [docker desktop](https://docs.docker.com/desktop/install/ubuntu/) and make it run (do the tutorial if necessary)

1. Download the Beluga Project from [Github](https://github.com/amnesica/BelugaProject) as ZIP and extract it

2. Config `application.properties.template` file in `/Server/src/main/resources/config` and rename to `application.properties`

3. Change prod url in `/Webapp/src/environments` to your productive systems ip address (for a simple test you can use `localhost`)

4. Build the docker image and execute the containers (1x postgresql, 1x server incl. webapp) in the base path of Beluga Project

```
$ docker compose up
```

5. When Beluga Project is running go to `<system-prod-ip>:8080` in your browser. There are no aircraft and airport icons yet, let's import them into the database. If you're on a linux system such as the Raspberry Pi you can use linux variant. If you're currently on windows and just want to try things out you can use the windows variant. 

    1. Instructions on **linux**
        <details>
        <summary>Click to expand</summary>

        Open a new terminal window and run the following commands to populate the database in the docker container. Check the file `loadBelugaDb_output.txt` to see the output of the `loadBelugaDb.sh` script

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

    The following error might appear if you don't specify a flightroute.csv file:
    
    > ERROR: missing data for column "flight_route"
    >
    > CONTEXT: COPY flightroute_data, line 2: ""SAMPLE,EDDH-EDDF,1257415993"")

    You can ignore the error if you don't have a flightroute.csv file.

6. Reload the configuration in the browser with a reload of `<system-prod-ip>:8080`. Aircraft and airport icons should be visible now (if you're not sure about the aircraft icons you can test it with the Opensky-Network functionality)

9. TODO: Run docker container at startup of productive system!