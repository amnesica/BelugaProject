#!/bin/bash
# library for building and running the Beluga Project

set -euo pipefail

# Global variables
container_name_db=postgres
container_name_webapp=webapp
container_name_server=server
path_postgresql=/var/lib/postgresql
path_db_content=$path_postgresql/dbContent

aircraft_database_zipfilename=aircraftDatabase.zip
aircraft_database_filename=aircraftDatabase.csv
airport_database_filename=airports.csv
aircraft_database_url=https://opensky-network.org/datasets/metadata/$aircraft_database_zipfilename
airport_database_url=https://davidmegginson.github.io/ourairports-data/$airport_database_filename

aircraft_mictronics_database_zipfilename="indexedDB.zip"
aircraft_mictronics_database_filename="indexedDB"
aircraft_mictronics_database_url="https://www.mictronics.de/aircraft-database/$aircraft_mictronics_database_filename.php"
json_to_csv_script_filename="json_to_csv.py"
path_json_to_csv_script="assets/scripts/$json_to_csv_script_filename"
aircraft_mictronics_database_aircrafts_json="aircrafts.json"
aircraft_mictronics_database_operators_json="operators.json"
aircraft_mictronics_database_types_json="types.json"
aircraft_mictronics_database_aircrafts_csv="aircrafts.csv"
aircraft_mictronics_database_operators_csv="operators.csv"
aircraft_mictronics_database_types_csv="types.csv"

load_beluga_db=loadBelugaDb
load_beluga_db_filename=$load_beluga_db.sh
path_load_beluga_db=assets/scripts/$load_beluga_db_filename
load_beluga_db_output_file=$load_beluga_db-output.txt

load_aircraftdata=loadAircraftData
load_aircraftdata_filename=$load_aircraftdata.sh
path_load_aircraftdata=assets/scripts/$load_aircraftdata_filename
load_aircraftdata_output_file=$load_aircraftdata-output.txt

_ask_user_with_message() {
  read -p "$1" choice
  case "$choice" in
  y | Y) echo "-> Yes, let's continue ..." ;;
  n | N)
    echo "-> No, let's stop here."
    exit
    ;;
  *)
    echo "-> Invalid, let's stop here."
    exit
    ;;
  esac
}

_ask_user_for_decision() {
  read -p "$1" choice
  case "$choice" in
  y | Y) echo "-> Okay, let's do it ..." ;;
  n | N)
    echo "-> Okay, we skip that step."  ;;
  *)
    echo "-> Invalid answer." ;;
  esac
}

_docker_run() {
  echo "Run the containers ..."
  docker compose up
}

_docker_run_background() {
  echo "Run the containers in the background ..."
  docker compose up -d
}

_docker_build() {
  if [[ $# -eq 0 ]]; then
    echo "Build all images (force rebuild of existing images) ..."
    docker compose build --progress=plain --no-cache
  else
    echo "Build the image for $1 (force rebuild of existing image) ..."
    docker compose build --progress=plain --no-cache $1
  fi
}

_docker_start_container() {
  if [[ $# -eq 0 ]]; then
    _ask_user_with_message "Do you really want to start all containers for the Beluga Project (y/n)?"
    _docker_start_all_containers
  else
    echo "Start container $1 ..."
    local container_id=$(docker ps -aqf "name=$1")
    if [[ $container_id ]]; then
      docker start $container_id
      echo "-> Started container for $1. Done."
    else
      echo "-> No container $1 to start. Done."
    fi
  fi
}

_docker_start_all_containers() {
  echo "Start all containers for Beluga Project ..."
  _docker_start_container $container_name_webapp
  _docker_start_container $container_name_server
  _docker_start_container $container_name_db
  echo "-> Started all containers for Beluga Project. Done."
}

_docker_stop_container() {
  if [[ $# -eq 0 ]]; then
    _ask_user_with_message "Do you really want to stop all containers for the Beluga Project (y/n)?"
    _docker_stop_all_containers
  else
    echo "Stop container $1 ..."
    local container_id=$(docker ps -aqf "name=$1")
    if [[ $container_id ]]; then
      docker stop $container_id
      echo "-> Stopped container for $1. Done."
    else
      echo "-> No container $1 to stop. Done."
    fi
  fi
}

_docker_stop_all_containers() {
  echo "Stop all containers for Beluga Project ..."
  _docker_stop_container $container_name_webapp
  _docker_stop_container $container_name_server
  _docker_stop_container $container_name_db
  echo "-> Stopped all containers for Beluga Project. Done."
}

_docker_rm_container() {
  if [[ $# -eq 0 ]]; then
    _ask_user_with_message "Do you really want to remove all containers for the Beluga Project (y/n)?"
    _docker_rm_all_containers
  else
    echo "Remove container $1 ..."
    local container_id=$(docker ps -aqf "name=$1")
    if [[ $container_id ]]; then
      docker rm $container_id
      echo "-> Removed container for $1. Done."
    else
      echo "-> No container $1 to remove. Done."
    fi
  fi
}

_docker_rm_all_containers() {
  echo "Remove all containers for Beluga Project ..."
  _docker_rm_container $container_name_webapp
  _docker_rm_container $container_name_server
  _docker_rm_container $container_name_db
  echo "-> All containers for Beluga Project removed. Done."
}

_docker_rm_image() {
  if [[ $# -eq 0 ]]; then
    _ask_user_with_message "Do you really want to remove all images for the Beluga Project (y/n)?"
    _docker_rm_all_images
  else
    echo "Remove image $1 ..."
    local image_id=$(docker images -q $1)
    if [[ $image_id ]]; then
      docker image rm -f $image_id
      echo "-> Removed image for $1. Done."
    else
      echo "-> No image $1 to remove. Done."
    fi
  fi
}

_docker_rm_all_images() {
  echo "Remove all images for Beluga Project ..."
  _docker_rm_image $container_name_webapp
  _docker_rm_image $container_name_server
  _docker_rm_image $container_name_db
  echo "-> Removed all images for Beluga Project. Done."
}

_docker_rm_project() {
  _ask_user_with_message "Do you really want to remove all containers and images for the Beluga Project (y/n)?"
  _docker_stop_all_containers
  _docker_rm_all_containers
  _docker_rm_all_images
}

_copy_db_content_to_container() {
  if [[ -z $(docker exec -ti $container_name_db bash -c "if [ -d $path_db_content ]; then echo does exist; fi") ]]; then
    echo "-> Directory $path_db_content does not exist."
    docker exec -ti $container_name_db bash -c "mkdir $path_db_content"
    echo "-> Create dbContent directory in $path_db_content. Done."
  else
    echo "-> Directory $path_db_content already exists. Skipped."
  fi

  echo "Copy content from assets/dbContent to $path_db_content ..."
  docker cp assets/dbContent $container_name_db:$path_postgresql
  echo "-> Copy content from assets/dbContent to $path_db_content. Done."
}

_download_aircraft_database() {
  echo "Download $aircraft_database_filename from Opensky-Network ..."
  docker exec -ti $container_name_db bash -c "wget $aircraft_database_url -O $aircraft_database_zipfilename"
  docker exec -ti $container_name_db bash -c "unzip $aircraft_database_zipfilename -o -j"
  echo "-> Download $aircraft_database_filename from Opensky-Network. Done."

  echo "Copy $aircraft_database_filename to $path_db_content ..."
  docker exec -ti $container_name_db bash -c "cp $aircraft_database_filename $path_db_content"
  echo "-> Copy $aircraft_database_filename to $path_db_content. Done."
}

_download_airport_database() {
  echo "Download $airport_database_filename from OurAirports ..."
  docker exec -ti $container_name_db bash -c "wget $airport_database_url -O $airport_database_filename"
  echo "-> Download $airport_database_filename from OurAirports. Done."

  echo "Copy $airport_database_filename to $path_db_content ..."
  docker exec -ti $container_name_db bash -c "cp $airport_database_filename $path_db_content"
  echo "-> Copy $airport_database_filename to $path_db_content. Done."
}

_download_mictronics_aircraft_database() {
  echo "Download $aircraft_mictronics_database_filename from Mictronics ..."
  docker exec -ti $container_name_db bash -c "wget $aircraft_mictronics_database_url -O $aircraft_mictronics_database_zipfilename"
  docker exec -ti $container_name_db bash -c "unzip $aircraft_mictronics_database_zipfilename -o -j"
  echo "-> Download $aircraft_mictronics_database_filename from Mictronics. Done."

  _copy_convert_mictronics_jsons_to_csv_script_to_container
  _convert_mictronics_database_to_csv

  echo "Copy $aircraft_mictronics_database_aircrafts_csv, $aircraft_mictronics_database_operators_csv, $aircraft_mictronics_database_types_csv to $path_db_content ..."
  docker exec -ti $container_name_db bash -c "cp $aircraft_mictronics_database_aircrafts_csv $path_db_content"
  docker exec -ti $container_name_db bash -c "cp $aircraft_mictronics_database_operators_csv $path_db_content"
  docker exec -ti $container_name_db bash -c "cp $aircraft_mictronics_database_types_csv $path_db_content"
  echo "-> Copy $aircraft_mictronics_database_aircrafts_csv, $aircraft_mictronics_database_operators_csv, $aircraft_mictronics_database_types_csv to $path_db_content. Done."
}

_convert_mictronics_database_to_csv() {
  _install_python_on_postgres_container

  echo "Converting JSON files of $aircraft_mictronics_database_filename to csv files ..."
  docker exec -ti $container_name_db bash -c "python3 $json_to_csv_script_filename $aircraft_mictronics_database_aircrafts_json"
  docker exec -ti $container_name_db bash -c "python3 $json_to_csv_script_filename $aircraft_mictronics_database_operators_json"
  docker exec -ti $container_name_db bash -c "python3 $json_to_csv_script_filename $aircraft_mictronics_database_types_json"
  echo "-> Converting JSON files of $aircraft_mictronics_database_filename to csv files. Done."
}

_install_python_on_postgres_container() {
  echo "Installing python3 on $container_name_db container to execute $json_to_csv_script_filename ..."
  docker exec -ti $container_name_db bash -c "apk add --no-cache python3 py3-pip"
  echo "-> Installing python3 on $container_name_db container to execute $json_to_csv_script_filename. Done."
}

_copy_load_db_script_to_container() {
  echo "Copy $load_beluga_db_filename to container ..."
  docker cp $path_load_beluga_db $container_name_db:$load_beluga_db_filename
  echo "-> Copy $load_beluga_db_filename to container. Done."
}

_copy_load_aircraftdata_script_to_container() {
  echo "Copy $load_aircraftdata_filename to container ..."
  docker cp $path_load_aircraftdata $container_name_db:$load_aircraftdata_filename
  echo "-> Copy $load_aircraftdata_filename to container. Done."
}

_copy_convert_mictronics_jsons_to_csv_script_to_container() {
  echo "Copy $json_to_csv_script_filename to container ..."
  docker cp $path_json_to_csv_script $container_name_db:$json_to_csv_script_filename
  echo "-> Copy $json_to_csv_script_filename to container. Done."
}

_exec_load_db_script() {
  echo "Execute $load_beluga_db_filename on container to populate database with content ..."
  docker exec $container_name_db bash -c ". $load_beluga_db_filename" | tee $load_beluga_db_output_file
  echo "-> Execute $load_beluga_db_filename on container to populate database with content. Done."
}

_exec_load_aircraftdata_script() {
  echo "Execute $load_aircraftdata_filename on container to populate database with aircraftdata ..."
  docker exec $container_name_db bash -c ". $load_aircraftdata_filename" | tee $load_aircraftdata_output_file
  echo "-> Execute $load_aircraftdata_filename on container to populate database with aircraftdata. Done."
}

_load_db_content() {
  echo "Load csv files into postgres database ..."
  if _check_tables_exist -eq 0; then
    exit
  fi

  echo "Create dbContent directory in $path_db_content ..."
  if [[ -z $(docker exec -ti $container_name_db bash -c "if [ -d $path_db_content ]; then echo does exist; fi") ]]; then
    _copy_db_content_to_container
  else
    echo "-> Directory $path_db_content already exists. Done."
    echo "-> Use command option -update-db to update database with content from assets/dbContent."
  fi

  echo "Download $aircraft_database_filename and $airport_database_filename ... "
  if [[ -z $(docker exec -ti $container_name_db bash -c "if test -f $aircraft_database_filename; then echo exists; fi") ]]; then
    _download_aircraft_database
  else
    echo "-> File $aircraft_database_filename already exists. Done."
  fi

  if [[ -z $(docker exec -ti $container_name_db bash -c "if test -f $airport_database_filename; then echo exists; fi") ]]; then
    _download_airport_database
  else
    echo "-> File $airport_database_filename already exists. Done."
  fi

  if [[ -z $(docker exec -ti $container_name_db bash -c "if test -f $aircraft_mictronics_database_zipfilename; then echo exists; fi") ]]; then
    _download_mictronics_aircraft_database
  else
    echo "-> File $aircraft_mictronics_database_zipfilename already exists. Done."
  fi

  _copy_load_aircraftdata_script_to_container
  _copy_load_db_script_to_container

  _exec_load_aircraftdata_script
  _exec_load_db_script
}

_update_db_content() {
  echo "update ... ask user for download of current version ..."
  
  echo "Download $aircraft_database_filename ... "

  if [[ -z $(docker exec -ti $container_name_db bash -c "if test -f $aircraft_database_filename; then echo exists; fi") ]]; then
    echo "-> file $aircraft_database_filename does not exist, download required."
    _download_aircraft_database
    _download_mictronics_aircraft_database
  else
    if [[ $# -eq 0 ]]; then
        _ask_user_for_decision "Do you want to download current version of $aircraft_database_filename (y/n)?"
        if [ "$choice" != "${choice#[Yy]}" ] ; then
          echo "$aircraft_database_filename exists. Download for update requested."
          _download_aircraft_database
          _download_mictronics_aircraft_database
        else
          if [ "$choice" != "${choice#[Nn]}" ] ;then
            echo "-> $aircraft_database_filename exists. Download for update not requested."
          else
            echo "-> Invalid answer: $choice. Operation cancelled. Try again."
            exit
          fi
        fi
    fi
  fi

echo "Download $airport_database_filename ... "

  if [[ -z $(docker exec -ti $container_name_db bash -c "if test -f $airport_database_filename; then echo exists; fi") ]]; then
    echo "-> file $aircraft_database_filename does not exist, download required."
    _download_airport_database
  else
    if [[ $# -eq 0 ]]; then
        _ask_user_for_decision "Do you want to download current version of $airport_database_filename (y/n)?"
        if [ "$choice" != "${choice#[Yy]}" ] ; then
          echo "$airport_database_filename exists. Download for update requested."
          _download_airport_database
        else
          if [ "$choice" != "${choice#[Nn]}" ] ;then
            echo "-> $airport_database_filename exists. Download for update not requested."
          else
            echo "-> Invalid answer: $choice. Operation cancelled. Try again."
            exit
          fi
        fi
    fi
  fi

  echo "update ... Loading csv files into postgres database ..."
  
  _copy_db_content_to_container
  _copy_load_aircraftdata_script_to_container
  _copy_load_db_script_to_container

  _exec_load_aircraftdata_script
  _exec_load_db_script
}

_env() {
  echo "Content of .env file:"
  cat .env
}

_check_tables_exist() {
  local table_does_not_exist=true
  local table_to_check=opensky_aircraft
  local postgres_db=$(docker exec $container_name_db bash -c "echo \$POSTGRES_DB")
  local postgres_user=$(docker exec $container_name_db bash -c "echo \$POSTGRES_USER")

  echo "Check if tables in postgres database were created by spring ..."
  while $table_does_not_exist; do
    if [[ -n $(docker exec -it $container_name_db psql $postgres_db $postgres_user -c "\c $postgres_db" -c "\dt" | grep $table_to_check ) ]]; then
      echo "-> Check if tables in postgres database were created by spring. Done."
      table_does_not_exist=false
      return 1
    else
      echo "-> Tables in postgres database were not created by spring yet ... waiting ..."
      sleep 1
    fi
  done
}

_install() {
  echo "Install the Beluga Project ..."

  _ask_user_with_message "Gentle reminder: Have you configured the values in the .env file (y/n)?"

  _docker_run_background

  _load_db_content

  echo "-> The Beluga Project is running. Done."
}
