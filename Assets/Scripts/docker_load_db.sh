#!/bin/bash
# A Bash script to populate the database in the postgresql docker container

function main() {
  local container_name_db=postgresdb
  local aircraft_database_url=https://opensky-network.org/datasets/metadata/aircraftDatabase.csv
  local airport_database_url=https://davidmegginson.github.io/ourairports-data/airports.csv

  # copy content from DbContent to container
  docker cp Assets/DbContent $container_name_db:/var/lib/postgresql

  # download files in postgres container
  docker exec -ti $container_name_db bash -c "wget $aircraft_database_url -O aircraftDatabase.csv"
  docker exec -ti $container_name_db bash -c "cp aircraftDatabase.csv /var/lib/postgresql/DbContent"

  docker exec -ti $container_name_db bash -c "wget $airport_database_url -O airports.csv"
  docker exec -ti $container_name_db bash -c "cp airports.csv /var/lib/postgresql/DbContent"

  # copy load database script to container
  docker cp Assets/Scripts/loadBelugaDb.sh $container_name_db:loadBelugaDb.sh

  # execute load beluga db script on db container
  docker exec $container_name_db bash -c ". loadBelugaDb.sh" >loadBelugaDb_output.txt
}

main
