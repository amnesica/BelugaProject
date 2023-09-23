#!/bin/bash

# Define path to directory with databases
# e.g. '/var/lib/postgres'
pathToDirectoryWithCsv="/var/lib/postgresql/dbContent"

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
	flight_last_update)
FROM '$pathToDirectoryWithCsv/flightroute_data.csv' WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo loading table shape_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE shape_data;" -U beluga -d belugaDb
psql -c "COPY shape_data (
	designator,
	creator,
	description,
	orig_length,
	orig_widht,
	shape_data,
	version,
	png_id,
	png_scale)
FROM '$pathToDirectoryWithCsv/shape_data.csv' WITH DELIMITER E'\t' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo loading table map_cat_to_shape_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE map_cat_to_shape_data;" -U beluga -d belugaDb
psql -c "COPY map_cat_to_shape_data (
	category,
	creator,
	description,
	shape_designator,
	shape_scale,
	version)
FROM '$pathToDirectoryWithCsv/map_cat_to_shape.csv' WITH DELIMITER E'\t' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo loading table map_type_to_shape_data ...
echo -----------------------------------------
psql -c "TRUNCATE TABLE map_type_to_shape_data;" -U beluga -d belugaDb
psql -c "COPY map_type_to_shape_data (
	type_designator,
	creator,
	description,
	shape_designator,
	shape_scale,
	version)
FROM '$pathToDirectoryWithCsv/map_type_to_shape.csv' WITH DELIMITER E'\t' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo loading table map_operator_icao_to_iata ...
echo -----------------------------------------
psql -c "CREATE TABLE IF NOT EXISTS public.map_operator_icao_to_iata(
    		operator_name character varying(255) COLLATE pg_catalog."default",
    		operator_icao character varying(255) COLLATE pg_catalog."default" NOT NULL,
    		operator_iata character varying(255) COLLATE pg_catalog."default",
    		CONSTRAINT map_operator_icao_to_iata_pkey PRIMARY KEY (operator_icao)
			);" -U beluga -d belugaDb
psql -c "TRUNCATE TABLE map_operator_icao_to_iata;" -U beluga -d belugaDb
psql -c "COPY map_operator_icao_to_iata (
			operator_name,
			operator_icao,
			operator_iata)
FROM '$pathToDirectoryWithCsv/map_operator_icao_to_iata.csv' WITH DELIMITER E'\t' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo Done. Yippie!
echo -----------------------------------------
