#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "$0")"
  pwd -P
)"

# Source global lib
. "${SCRIPT_DIR}/lib.sh"

_usage() {
  cat <<EOF
Usage: $0 command
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
  update-db                             Update standing data in postgres container (db maintenance)
  export-db                             Export standing data to csv-files
  import-db                             import standing data from csv-files
  tables-exist                          Check if tables in postgres container were created by spring
  stat-db                               Show BelugaDB statistics
  env                                   Show current environment variables in .env file
  install                               Install project (build docker images and populate database)
EOF
  exit 1
}

CMD=${1:-}
shift || true
case ${CMD} in
run) _docker_run ;;
run-bg) _docker_run_background ;;
docker-build) _docker_build $@ ;;
docker-start) _docker_start_container $@ ;;
docker-stop) _docker_stop_container $@ ;;
docker-rm-container) _docker_rm_container $@ ;;
docker-rm-image) _docker_rm_image $@ ;;
docker-rm) _docker_rm_project $@ ;;
download-mictronics) _download_mictronics_aircraft_database ;;
load-db) _load_db_content ;;
update-db) _update_db_content ;;
export-db) _export_db_content ;;
import-db) _import_db_content ;;
tables-exist) _check_tables_exist ;;
stat-db) _get_stat_belugaDb ;;
env) _env ;;
install) _install $@ ;;
*) _usage ;;
esac
