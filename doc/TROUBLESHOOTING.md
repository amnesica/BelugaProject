## Troubleshooting

### Installation

While running
   ```
   $ ./run.sh install
   ```
or
   ```
   $ sudo ./run.sh install
   ```
error messages might appear. Here are some hints to handle them. 

First hint: doublecheck your `.env` file. All entries with TODO have to be replaced with your values otherwise the build process may fail.

#### Build docker containers

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

#### Populationg database with data

   This will take some time. Be patient :-)

   On an RaspberryPi 4B

    - container build process takes about 14 minutes
    - load database process takes about 10 minutes

   Our shellscripts report all steps both to terminal and to file. See loadAircraftData-output.txt and loadBelugaDb-output.txt in the BelugaProject root folder.

   The following errors might appear after container build is finished and database is to be populated with data:

   > psql: error: FATAL: the database system is in recovery mode

   In this case try execute `./run.sh load-db`.

   The following error might appear if you don't specify a flightroute.csv file:

   > ERROR: missing data for column "flight_route"
   >
   > CONTEXT: COPY flightroute_data, line 2: ""SAMPLE,EDDH-EDDF,1257415993"")

   You can ignore this error if you don't have a flightroute.csv file.

### Running BelugaProject

   When Beluga Project is installed and is running go to `<system-prod-ip>:8090` in your browser.
   
   `<system-prod-ip>` must be configured in your `.env` file as `PROD_BASE_URL_WEBAPP`.

   On first run after installation it may take up to 3 minutes until all aircraft are visible due to database init processes.

   Some possible error messages:
   > Whitelabel Error Page - This application has no explicit mapping for /error, so you are seeing this as a fallback. Fri Dec 22 16:02:08 UTC 2023 - There was an unexpected error (type=Not Found, status=404).

   Do you use Port 8080 instead of 8090 in URL?

   > Configuration could not be loaded. Is the server online? Program will not be executed further.

   Have you set the right IP adress at PROD_BASE_URL_WEBAPP in your .env file? It must be the IP-adress of your server.


### Flightroute data

   Unfortunately we have not found an `open` source for flight route information. This is the reason why route information (callsign/flightid with origin and destination airport) cannot be shown in BelugaProject by default.

   If you know an open (!) source for flightroute data please contact us.

   If you want to fill the database table `flightroute_data` you have to provide the data yourself. The provided csv file is just a sample.

   You can create your own `flightroute_data.csv` file and put it into folder `assets/dbContent`. To load data from here into to the database use this command:
   ```
   $ ./run.sh update-db
   ```

### Opensky Network
BelugaProject can show aircraft from [Opensky network](https://opensky-network.org/) only when you set valid Opensky-Credentials in your .env file. Otherwise option "Fetch from Opensky-Network" is not availible in BelugaProject Map settings.

If you activated option "Fetch from Opensky-Network" but no aircraft are displayed, check if Opensky-Network is availible and active at all. Open [Opensky-Network Explorer](https://opensky-network.org/network/explorer) in another browser tab and check whether aircraft are displayed in your selected region.

If aircraft are displayed in [Opensky-Network Explorer](https://opensky-network.org/network/explorer) but not in BelugaProject, check if you still are inside your Opensky-network `user rate limit`. See chapter `Limitations` in the [Opensky-Network REST API documentation](https://openskynetwork.github.io/opensky-api/rest.html).

Also take a look into the BelugaProject server logfile, which can be displayed via Settings / About / Button "ShowLogs" - or at `<system-prod-ip>:8080/getLogs`. You may find error messages like this in logfile:

>    2023-12-21T19:42:47.227Z ERROR 7 --- [scheduling-1] c.a.b.services.aircraft.OpenskyService   : Server: Data from Opensky-Network could not get fetched or there are no planes in this area. Url: https://opensky-network.org/api/states/all?lamin=50.537986&lomin=-1.373059&lamax=57.246463&lomax=21.258777
