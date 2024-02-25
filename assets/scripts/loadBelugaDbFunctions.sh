#!/bin/bash

# Define path to directory with databases
# e.g. '/var/lib/postgres'
pathToDirectoryWithCsv="/var/lib/postgresql/dbContent"

# Define timestamp function
timestamp() {
  date +%Y-%m-%d_%H:%M:%S
}

start_time=$(timestamp)

SECONDS=0
SECONDS_AT_START=$SECONDS

echo ----------------------------------------------------------------------
echo $(timestamp) loadBelugaDbFunctions.sh Version 4-0-0
echo ----------------------------------------------------------------------

echo ----------------------------------------------------------------------
echo $(timestamp) running loadBelugaDbFunctions.SQL ...
echo ----------------------------------------------------------------------
psql -f loadBelugaDbFunctions.sql -U beluga -d belugaDb

echo $(timestamp) Done.


echo ----------------------------------------------------------------------
echo Start time was: $start_time
echo End time is...: $(timestamp)
SECONDS_ELAPSED=$(( SECONDS - a ))
echo Script runtime in Min:Sec
echo $((SECONDS_ELAPSED-SECONDS_AT_START)) | awk '{print int($1/60)":"int($1%60)}'
echo Done. Yippie!
echo ----------------------------------------------------------------------
