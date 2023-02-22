#!/bin/bash

# Define path to directory with databases
# e.g. '/var/lib/postgres'
pathToDirectoryWithCsv="/var/lib/postgresql/dbContent"

echo -----------------------------------------
echo load aircraft data from opensky-network
echo   filtering out duplicate records
echo   filtering out duplicate hex codes
echo   in upper case notation
echo -----------------------------------------

echo -----------------------------------------
echo import csv-file to temp-file 1 ...
echo -----------------------------------------

psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA;" -U beluga -d belugaDb

psql -c "CREATE TABLE TMP_AIRCRAFT_DATA AS
SELECT * FROM AIRCRAFT_DATA WITH NO DATA;" -U beluga -d belugaDb

psql -c "COPY TMP_AIRCRAFT_DATA (HEX,
							REGISTRATION,
							MANUFACTURER_ICAO,
							MANUFACTURER_NAME,
							MODEL,
							TYPECODE,
							SERIAL_NUMBER,
							LINE_NUMBER,
							ICAO_AIRCRAFT_TYPE,
							OPERATOR_NAME,
							OPERATOR_CALLSIGN,
							OPERATOR_ICAO,
							OPERATOR_IATA,
							OWNER_NAME,
							TEST_REG,
							REGISTERED,
							REG_UNTIL,
							STATUS,
							BUILT,
							FIRST_FLIGHT_DATE,
							SEAT_CONFIGURATION,
							ENGINES,
							MODES,
							ADSB,
							ACARS,
							NOTES,
							CATEGORY_DESCRIPTION)
FROM '$pathToDirectoryWithCsv/aircraftDatabase.csv' WITH
DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb

psql -c "\echo number of imported records in temp-file 1:" -U beluga -d belugaDb
psql -c "SELECT COUNT(*) FROM TMP_AIRCRAFT_DATA;" -U beluga -d belugaDb

echo ------------------------------------------------------------
echo copy to temp-file 2 with additional column hex_low
echo ------------------------------------------------------------

psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA2;" -U beluga -d belugaDb

psql -c "CREATE TABLE TMP_AIRCRAFT_DATA2 (HEX CHARACTER VARYING(255) NOT NULL,
													HEX_LOW CHARACTER VARYING(255) NOT NULL,
													ACARS CHARACTER VARYING(255),
													ADSB CHARACTER VARYING(255),
													BUILT CHARACTER VARYING(255),
													CATEGORY_DESCRIPTION CHARACTER VARYING(255),
													ENGINES CHARACTER VARYING(255),
													FIRST_FLIGHT_DATE CHARACTER VARYING(255),
													ICAO_AIRCRAFT_TYPE CHARACTER VARYING(255),
													LINE_NUMBER CHARACTER VARYING(255),
													MANUFACTURER_ICAO CHARACTER VARYING(255),
													MANUFACTURER_NAME CHARACTER VARYING(255),
													MODEL CHARACTER VARYING(255),
													MODES CHARACTER VARYING(255),
													NOTES CHARACTER VARYING(255),
													OPERATOR_CALLSIGN CHARACTER VARYING(255),
													OPERATOR_IATA CHARACTER VARYING(255),
													OPERATOR_ICAO CHARACTER VARYING(255),
													OPERATOR_NAME CHARACTER VARYING(255),
													OWNER_NAME CHARACTER VARYING(255),
													REG_UNTIL CHARACTER VARYING(255),
													REGISTERED CHARACTER VARYING(255),
													REGISTRATION CHARACTER VARYING(255),
													SEAT_CONFIGURATION CHARACTER VARYING(255),
													SERIAL_NUMBER CHARACTER VARYING(255),
													STATUS CHARACTER VARYING(255),
													TEST_REG CHARACTER VARYING(255),
													TYPECODE CHARACTER VARYING(255));" -U beluga -d belugaDb

psql -c "INSERT INTO TMP_AIRCRAFT_DATA2
SELECT HEX,
	lower(HEX),
	ACARS,
	ADSB,
	BUILT,
	CATEGORY_DESCRIPTION,
	ENGINES,
	FIRST_FLIGHT_DATE,
	ICAO_AIRCRAFT_TYPE,
	LINE_NUMBER,
	MANUFACTURER_ICAO,
	MANUFACTURER_NAME,
	MODEL,
	MODES,
	NOTES,
	OPERATOR_CALLSIGN,
	OPERATOR_IATA,
	OPERATOR_ICAO,
	OPERATOR_NAME,
	OWNER_NAME,
	REG_UNTIL,
	REGISTERED,
	REGISTRATION,
	SEAT_CONFIGURATION,
	SERIAL_NUMBER,
	STATUS,
	TEST_REG,
	TYPECODE
FROM TMP_AIRCRAFT_DATA;" -U beluga -d belugaDb

psql -c "\echo number of imported records in temp-file 2:" -U beluga -d belugaDb

psql -c "SELECT COUNT(*) FROM TMP_AIRCRAFT_DATA2;" -U beluga -d belugaDb

echo ------------------------------------------------------------
echo copy to destination table aircraft_data
echo   with distinct on hex_low 
echo   combined with order by hex_low, hex DESC
echo   result: for all duplicates we get the first record
echo      with original lower case hex code
echo ------------------------------------------------------------
psql -c "TRUNCATE AIRCRAFT_DATA;" -U beluga -d belugaDb

psql -c "INSERT INTO AIRCRAFT_DATA
SELECT DISTINCT ON (HEX_LOW) 
HEX_LOW,
	ACARS,
	ADSB,
	BUILT,
	CATEGORY_DESCRIPTION,
	ENGINES,
	FIRST_FLIGHT_DATE,
	ICAO_AIRCRAFT_TYPE,
	LINE_NUMBER,
	MANUFACTURER_ICAO,
	MANUFACTURER_NAME,
	MODEL,
	MODES,
	NOTES,
	OPERATOR_CALLSIGN,
	OPERATOR_IATA,
	OPERATOR_ICAO,
	OPERATOR_NAME,
	OWNER_NAME,
	REG_UNTIL,
	REGISTERED,
	REGISTRATION,
	SEAT_CONFIGURATION,
	SERIAL_NUMBER,
	STATUS,
	TEST_REG,
	TYPECODE
FROM TMP_AIRCRAFT_DATA2
ORDER BY HEX_LOW, HEX DESC;" -U beluga -d belugaDb

psql -c "SELECT COUNT(*) FROM AIRCRAFT_DATA;" -U beluga -d belugaDb

psql -c "\echo number of distinct records in table aircraft_data:" -U beluga -d belugaDb


echo -----------------------------------------
echo cleanup ... drop temp tables
echo -----------------------------------------
psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA;" -U beluga -d belugaDb
psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA2;" -U beluga -d belugaDb

echo -----------------------------------------
echo Done. Yippie!
echo -----------------------------------------
