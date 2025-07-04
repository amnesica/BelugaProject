#!/bin/bash
# library for building and running the Beluga Project

set -euo pipefail

# Global variables
container_name_db=postgres
container_name_webapp=belugaproject-webapp
container_name_server=belugaproject-server
image_name_db=postgres
image_name_webapp=belugaproject/belugaproject-webapp
image_name_server=belugaproject/belugaproject-server
path_postgresql=/var/lib/postgresql
path_db_content=$path_postgresql/dbContent

aircraft_database_zipfilename=aircraftDatabase.zip
aircraft_database_filename=aircraftDatabase.csv
airport_database_filename=airports.csv
flightroute_database_filename=flightrouteData.csv
aircraft_database_url=https://s3.opensky-network.org/data-samples/metadata/$aircraft_database_zipfilename
airport_database_url=https://davidmegginson.github.io/ourairports-data/$airport_database_filename
flightroute_database_zipfilename="vrs_standing_data.zip"
flightroute_database_url=https://github.com/vradarserver/standing-data/archive/refs/heads/main.zip
flightroute_database_folder="standing-data-main/routes"
flightroute_create_csv_script_filename="flightroute_create_csv.py"
path_flightroute_create_csv_script="assets/scripts/$flightroute_create_csv_script_filename"

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

load_belugadb_func=loadBelugaDbFunctions
load_belugadb_func_filename_sh=$load_belugadb_func.sh
load_belugadb_func_filename_sql=$load_belugadb_func.sql
path_load_belugadb_func_sh=assets/scripts/$load_belugadb_func_filename_sh
path_load_belugadb_func_sql=assets/scripts/$load_belugadb_func_filename_sql
load_belugadb_func_output_file=$load_belugadb_func-output.txt

load_beluga_db=loadBelugaDb
load_beluga_db_filename_sh=$load_beluga_db.sh
load_beluga_db_filename_sql=$load_beluga_db.sql
path_load_beluga_db_sh=assets/scripts/$load_beluga_db_filename_sh
path_load_beluga_db_sql=assets/scripts/$load_beluga_db_filename_sql
load_beluga_db_output_file=$load_beluga_db-output.txt

load_aircraftdata=loadAircraftData
load_aircraftdata_filename_sh=$load_aircraftdata.sh
load_aircraftdata_filename_sql=$load_aircraftdata.sql
path_load_aircraftdata_sh=assets/scripts/$load_aircraftdata_filename_sh
path_load_aircraftdata_sql=assets/scripts/$load_aircraftdata_filename_sql
load_aircraftdata_output_file=$load_aircraftdata-output.txt

path_db_content_host=assets/dbContent
path_db_content_container=/assets/dbContent/.

export_belugadbdata=exportBelugaDbData
export_belugadbdata_filename_sh=$export_belugadbdata.sh
export_belugadbdata_filename_sql=$export_belugadbdata.sql
path_export_belugadbdata_sh=assets/scripts/$export_belugadbdata_filename_sh
export_belugadbdata_output_file=$export_belugadbdata-output.txt

import_belugadbdata=importBelugaDbData
import_belugadbdata_filename_sh=$import_belugadbdata.sh
import_belugadbdata_filename_sql=$import_belugadbdata.sql
path_import_belugadbdata_sh=assets/scripts/$import_belugadbdata_filename_sh
import_belugadbdata_output_file=$import_belugadbdata-output.txt

dbfunction_get_stat_belugaDb="getBelugaDbStatistics()"

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
    echo "-> Okay, we skip that step."
    ;;
  *)
    echo "-> Invalid answer."
    ;;
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

    if [[ $1 = 'server' ]] || [[ $1 = $container_name_server ]]; then
      echo "Build container $container_name_server ..."
      docker compose build --progress=plain --no-cache $container_name_server
      echo "-> Build container $container_name_server. Done."
    else
      echo "-> No container $1 to build. Done."
    fi

    if [[ $1 = 'webapp' ]] || [[ $1 = $container_name_webapp ]]; then
      echo "Build container $container_name_webapp ..."
      docker compose build --progress=plain --no-cache $container_name_webapp
      echo "-> Build container $container_name_webapp. Done."
    else
      echo "-> No container $1 to build. Done."
    fi
    
    if [[ $1 = 'postgres' ]] || [[ $1 = $container_name_db ]]; then
      echo "Build container $container_name_db ..."
      docker compose build --progress=plain --no-cache $container_name_db
      echo "-> Build container $container_name_db. Done."
    else
        echo "-> No container $1 to build. Done."
    fi
    
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
    if [[ $1 = 'server' ]] || [[ $1 = $image_name_server ]]; then
      echo "Remove image $image_name_server ..."
      local image_id=$(docker images -q $image_name_server)
      if [[ $image_id ]]; then
        docker image rm -f $image_id
        echo "-> Removed image for $image_name_server. Done."
      else
        echo "-> No image $1 to remove. Done."
      fi
    fi

    if [[ $1 = 'webapp' ]] || [[ $1 = $image_name_webapp ]]; then
      echo "Remove image $image_name_webapp ..."
      local image_id=$(docker images -q $image_name_webapp)
      if [[ $image_id ]]; then
        docker image rm -f $image_id
        echo "-> Removed image for $image_name_webapp. Done."
      else
        echo "-> No image $1 to remove. Done."
      fi
    fi

    if [[ $1 = 'postgres' ]] || [[ $1 = $image_name_db ]]; then
      echo "Remove image $image_name_db ..."
      local image_id=$(docker images -q $image_name_db)
      if [[ $image_id ]]; then
        docker image rm -f $image_id
        echo "-> Removed image for $image_name_db. Done."
      else
        echo "-> No image $1 to remove. Done."
      fi
    fi

  fi
}

_docker_rm_all_images() {
  echo "Remove all images for Beluga Project ..."
  _docker_rm_image $image_name_webapp
  _docker_rm_image $image_name_server
  _docker_rm_image $image_name_db
  echo "-> Removed all images for Beluga Project. Done."
}

_docker_rm_project() {
  if [[ $# -eq 0 ]]; then
    _ask_user_with_message "Do you really want to remove all containers and images for the Beluga Project (y/n)?"
  fi

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

_download_flightroute_database() {
  echo "Download $flightroute_database_filename from Github repository VRS standing-data ..."
  docker exec -ti $container_name_db bash -c "wget $flightroute_database_url -O $flightroute_database_zipfilename"
  docker exec -ti $container_name_db bash -c "unzip $flightroute_database_zipfilename -o -q"
  echo "-> Download $flightroute_database_zipfilename from Github repository VRS standing-data. Done."

  _copy_flightroute_create_csv_script_to_container
  _convert_flightroute_database_to_csv

  echo "Copy $flightroute_database_filename to $path_db_content ..."
  docker exec -ti $container_name_db bash -c "cp $flightroute_database_filename $path_db_content"
  echo "-> Copy $flightroute_database_filename to $path_db_content. Done."
}

_convert_mictronics_database_to_csv() {
  _install_python_on_postgres_container

  echo "Converting JSON files of $aircraft_mictronics_database_filename to csv files ..."
  docker exec -ti $container_name_db bash -c "python3 $json_to_csv_script_filename $aircraft_mictronics_database_aircrafts_json"
  docker exec -ti $container_name_db bash -c "python3 $json_to_csv_script_filename $aircraft_mictronics_database_operators_json"
  docker exec -ti $container_name_db bash -c "python3 $json_to_csv_script_filename $aircraft_mictronics_database_types_json"
  echo "-> Converting JSON files of $aircraft_mictronics_database_filename to csv files. Done."
}

_convert_flightroute_database_to_csv() {
  _install_python_on_postgres_container

  echo "Combine all csv files in $flightroute_database_folder to one csv file ..."
  docker exec -ti $container_name_db bash -c "python3 $flightroute_create_csv_script_filename $flightroute_database_folder"
  echo "-> Combine all csv files in $flightroute_database_folder to one csv file. Done."
}

_install_python_on_postgres_container() {
  echo "Installing python3 on $container_name_db container to execute $json_to_csv_script_filename ..."
  docker exec -ti $container_name_db bash -c "apk add --no-cache python3 py3-pip"
  docker exec -ti $container_name_db bash -c "apk add py3-pandas"
  echo "-> Installing python3 on $container_name_db container to execute $json_to_csv_script_filename. Done."
}

_copy_load_db_func_script_to_container() {
  echo "Copy $load_belugadb_func_filename_sh to container ..."
  docker cp $path_load_belugadb_func_sh $container_name_db:$load_belugadb_func_filename_sh
  echo "-> Copy $load_belugadb_func_filename_sh to container. Done."
  echo "Copy $load_belugadb_func_filename_sql to container ..."
  docker cp $path_load_belugadb_func_sql $container_name_db:$load_belugadb_func_filename_sql
  echo "-> Copy $load_belugadb_func_filename_sql to container. Done."
}

_copy_load_db_script_to_container() {
  echo "Copy $load_beluga_db_filename_sh to container ..."
  docker cp $path_load_beluga_db_sh $container_name_db:$load_beluga_db_filename_sh
  echo "-> Copy $load_beluga_db_filename_sh to container. Done."
  echo "Copy $load_beluga_db_filename_sql to container ..."
  docker cp $path_load_beluga_db_sql $container_name_db:$load_beluga_db_filename_sql
  echo "-> Copy $load_beluga_db_filename_sql to container. Done."
}

_copy_load_aircraftdata_script_to_container() {
  echo "Copy $load_aircraftdata_filename_sh to container ..."
  docker cp $path_load_aircraftdata_sh $container_name_db:$load_aircraftdata_filename_sh
  echo "-> Copy $load_aircraftdata_filename_sh to container. Done."
  echo "Copy $load_aircraftdata_filename_sql to container ..."
  docker cp $path_load_aircraftdata_sql $container_name_db:$load_aircraftdata_filename_sql
  echo "-> Copy $load_aircraftdata_filename_sql to container. Done."
}

_copy_convert_mictronics_jsons_to_csv_script_to_container() {
  echo "Copy $json_to_csv_script_filename to container ..."
  docker cp $path_json_to_csv_script $container_name_db:$json_to_csv_script_filename
  echo "-> Copy $json_to_csv_script_filename to container. Done."
}

_copy_flightroute_create_csv_script_to_container() {
  echo "Copy $flightroute_create_csv_script_filename to container ..."
  docker cp $path_flightroute_create_csv_script $container_name_db:$flightroute_create_csv_script_filename
  echo "-> Copy $flightroute_create_csv_script_filename to container. Done."
}

_copy_export_belugadbdata_script_to_container() {
  echo "Copy $export_belugadbdata_filename_sh to container ..."
  docker cp $path_export_belugadbdata_sh $container_name_db:$export_belugadbdata_filename_sh
  echo "-> Copy $export_belugadbdata_filename_sh to container. Done."
}

_copy_exported_csv_files_from_container() {
  echo "Copy exported csv-files from container to $path_db_content_host ..."
  docker cp $container_name_db:$path_db_content_container $path_db_content_host
  echo "Copy exported csv-files from container to $path_db_content_host ... done"
}

_copy_import_belugadbdata_script_to_container() {
  echo "Copy $import_belugadbdata_filename_sh to container ..."
  docker cp $path_import_belugadbdata_sh $container_name_db:$import_belugadbdata_filename_sh
  echo "-> Copy $import_belugadbdata_filename_sh to container. Done."
}

_exec_load_db_func_script() {
  echo "Execute $load_belugadb_func_filename_sh on container to populate database with content ..."
  docker exec $container_name_db bash -c ". $load_belugadb_func_filename_sh" | tee $load_belugadb_func_output_file
  echo "-> Execute $load_belugadb_func_filename_sh on container to populate database with content. Done."
}

_exec_load_db_script() {
  echo "Execute $load_beluga_db_filename_sh on container to populate database with content ..."
  docker exec $container_name_db bash -c ". $load_beluga_db_filename_sh" | tee $load_beluga_db_output_file
  echo "-> Execute $load_beluga_db_filename_sh on container to populate database with content. Done."
}

_exec_load_aircraftdata_script() {
  echo "Execute $load_aircraftdata_filename_sh on container to populate database with aircraftdata ..."
  docker exec $container_name_db bash -c ". $load_aircraftdata_filename_sh" | tee $load_aircraftdata_output_file
  echo "-> Execute $load_aircraftdata_filename_sh on container to populate database with aircraftdata. Done."
}

_exec_export_belugadbdata_script() {
  echo "Execute $export_belugadbdata_filename_sh on container to export standing data ..."
  docker exec $container_name_db bash -c ". $export_belugadbdata_filename_sh" | tee $export_belugadbdata_output_file
  echo "-> Execute $export_belugadbdata_filename_sh on container to export standing data. Done."
}

_exec_import_belugadbdata_script() {
  echo "Execute $import_belugadbdata_filename_sh on container to populate database with standing data ..."
  docker exec $container_name_db bash -c ". $import_belugadbdata_filename_sh" | tee $import_belugadbdata_output_file
  echo "-> Execute $import_belugadbdata_filename_sh on container to populate database with standing data. Done."
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
    _copy_db_content_to_container
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

  if [[ -z $(docker exec -ti $container_name_db bash -c "if test -f $flightroute_database_filename; then echo exists; fi") ]]; then
    _download_flightroute_database
  else
    echo "-> File $flightroute_database_filename already exists. Done."
  fi

  _copy_load_aircraftdata_script_to_container
  _copy_load_db_script_to_container
  _copy_load_db_func_script_to_container

  _exec_load_db_func_script
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
      if [ "$choice" != "${choice#[Yy]}" ]; then
        echo "$aircraft_database_filename exists. Download for update requested."
        _download_aircraft_database
        _download_mictronics_aircraft_database
      else
        if [ "$choice" != "${choice#[Nn]}" ]; then
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
    echo "-> file $airport_database_filename does not exist, download required."
    _download_airport_database
  else
    if [[ $# -eq 0 ]]; then
      _ask_user_for_decision "Do you want to download current version of $airport_database_filename (y/n)?"
      if [ "$choice" != "${choice#[Yy]}" ]; then
        echo "$airport_database_filename exists. Download for update requested."
        _download_airport_database
      else
        if [ "$choice" != "${choice#[Nn]}" ]; then
          echo "-> $airport_database_filename exists. Download for update not requested."
        else
          echo "-> Invalid answer: $choice. Operation cancelled. Try again."
          exit
        fi
      fi
    fi
  fi

  echo "Download $flightroute_database_filename ... "

  if [[ -z $(docker exec -ti $container_name_db bash -c "if test -f $flightroute_database_filename; then echo exists; fi") ]]; then
    echo "-> file $flightroute_database_filename does not exist, download required."
    _download_flightroute_database
  else
    if [[ $# -eq 0 ]]; then
      _ask_user_for_decision "Do you want to download current version of $flightroute_database_filename (y/n)?"
      if [ "$choice" != "${choice#[Yy]}" ]; then
        echo "$flightroute_database_filename exists. Download for update requested."
        _download_flightroute_database
      else
        if [ "$choice" != "${choice#[Nn]}" ]; then
          echo "-> $flightroute_database_filename exists. Download for update not requested."
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
  _copy_load_db_func_script_to_container

  _exec_load_db_func_script
  _exec_load_aircraftdata_script
  _exec_load_db_script
}

_export_db_content() {
  echo "Export standing data ..."
  _copy_export_belugadbdata_script_to_container
  _exec_export_belugadbdata_script
  _copy_exported_csv_files_from_container
}

_import_db_content() {
  echo "Import standing data ..."

  if _check_tables_exist -eq 0; then
    exit
  fi

  echo "Create dbContent directory in $path_db_content ..."
  if [[ -z $(docker exec -ti $container_name_db bash -c "if [ -d $path_db_content ]; then echo does exist; fi") ]]; then
    _copy_db_content_to_container
  else
    echo "-> Directory $path_db_content already exists. Done."
    _copy_db_content_to_container
  fi

  _copy_import_belugadbdata_script_to_container
  _exec_import_belugadbdata_script
  _copy_load_db_func_script_to_container
  _exec_load_db_func_script

}

_env() {
  echo "Content of .env file:"
  cat .env
}

_check_tables_exist() {
  local table_does_not_exist=true
  local table_to_check=remote_aircraft
  local postgres_db=$(docker exec $container_name_db bash -c "echo \$POSTGRES_DB")
  local postgres_user=$(docker exec $container_name_db bash -c "echo \$POSTGRES_USER")

  echo "Check if tables in postgres database were created by spring ..."
  while $table_does_not_exist; do
    if [[ -n $(docker exec $container_name_db psql $postgres_db $postgres_user -c "\dt" | grep $table_to_check) ]]; then
      echo "-> Check if tables in postgres database were created by spring. Done."
      table_does_not_exist=false
      return 1
    else
      echo "-> Tables in postgres database were not created by spring yet ... waiting ..."
      sleep 1
    fi
  done
}

_get_stat_belugaDb() {
  local postgres_db=$(docker exec $container_name_db bash -c "echo \$POSTGRES_DB")
  local postgres_user=$(docker exec $container_name_db bash -c "echo \$POSTGRES_USER")
  echo "-> Retrieving data from Postgres database ..."
  docker exec $container_name_db psql $postgres_db $postgres_user -c "select $dbfunction_get_stat_belugaDb;"
}

_install() {
  echo "Installing the Beluga Project ..."

  # only ask user if install is not started from ui installer
  if [ $# -eq 0 ]; then
    _ask_user_with_message "Gentle reminder: Have you configured the values in the .env file (y/n)?"
  fi

  _docker_run_background

  _import_db_content
  
  echo "-> The Beluga Project is running. Done."
}
