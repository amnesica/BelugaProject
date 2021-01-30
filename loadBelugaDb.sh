#!/bin/bash

# Define path to directory with databases
# e.g. '/var/lib/postgres'
pathToDirectoryWithCsv="TODO"

echo -----------------------------------------
echo loading table aircraft_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE aircraft_data;" -U beluga -d belugaDb
psql -c "COPY aircraft_data (
	hex,
	registration,
	manufacturer_icao,
	manufacturer_name,
	model,
	typecode,
	serial_number,
	line_number,
	icao_aircraft_type,
	operator_name,
	operator_callsign,
	operator_icao,
	operator_iata,
	owner_name,
	test_reg,
	registered,
	reg_until,
	status,
	built,
	first_flight_date,
	seat_configuration,
	engines,
	modes,
	adsb,
	acars,
	notes,
	category_description)
FROM '$pathToDirectoryWithCsv/aircraftDatabase.csv' WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb
echo Done.

echo -----------------------------------------
echo loading table airport_Data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE airport_Data;" -U beluga -d belugaDb
psql -c "COPY airport_data (
	 number_airport,
	 ident,
	 type,
	 name,
	 latitude_deg,
	 longitude_deg,
	 elevation_ft,
	 continent,
	 iso_country,
	 iso_region,
	 municipality,
	 scheduled_service,
	 gps_code,
	 iata_code,
	 local_code,
	 home_link,
	 wikipedia_link,
	 keywords)
 FROM '$pathToDirectoryWithCsv/airports.csv' WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb
echo Done.

echo -----------------------------------------
echo loading table country_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE country_data;" -U beluga -d belugaDb
psql -c "COPY country_data (
	 country_iso2letter,
	 country_iso3letter,
	 country_name_en,
	 country_name_de,
	 country_flag_utf8code)
FROM '$pathToDirectoryWithCsv/country_data.csv' WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb
echo Done.

echo -----------------------------------------
echo loading table regcode_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE regcode_data;" -U beluga -d belugaDb
psql -c "COPY regcode_data (
regcode_prefix,
regcode_flag_utf8code,
regcode_name)
FROM '$pathToDirectoryWithCsv/regcode_data.csv' WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb
echo Done.

echo -----------------------------------------
echo loading table operator_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE operator_data;" -U beluga -d belugaDb
psql -c "COPY operator_data (
operator_id,
operator_callsign,
operator_comment,
operator_country,
operator_country_iso2letter,
operator_iata,
operator_icao,
operator_name)
FROM '$pathToDirectoryWithCsv/operator_data.csv' WITH DELIMITER E'\t' CSV HEADER;" -U beluga -d belugaDb
echo Done.

echo -----------------------------------------
echo loading table flightroute_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE flightroute_data;" -U beluga -d belugaDb
psql -c "COPY flightroute_data (
	flight_id,
	flight_route,
	flight_lastupdate)
FROM '$pathToDirectoryWithCsv/flightroute_data.csv' WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo Done. Yippie!
echo -----------------------------------------
