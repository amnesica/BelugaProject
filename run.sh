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
  run                           Run project with docker compose
  run-bg                        Run project with docker compose (in background)
  docker-build <image_name>     Build docker images (all or specific image)
  load-db                       Populates database on postgres container if tables were created
  tables-exist                  Check if tables in postgres container were created by spring
  env                           Show current environment variables in .env file
  install                       Install project (build docker images and populate database)
EOF
  exit 1
}

CMD=${1:-}
shift || true
case ${CMD} in
run) _docker_run ;;
run-bg) _docker_run_background ;;
docker-build) _docker_build $@ ;;
load-db) _load_db_content ;;
tables-exist) _check_tables_exist ;;
env) _env ;;
install) _install ;;
*) _usage ;;
esac
