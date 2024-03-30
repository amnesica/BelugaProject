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
echo $(timestamp) loadBelugaDb.sh Version 4-0-1
echo ----------------------------------------------------------------------

echo ----------------------------------------------------------------------
echo $(timestamp) loading table airport_Data ...
echo ----------------------------------------------------------------------
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
		FROM '$pathToDirectoryWithCsv/airports.csv'
		WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table airport_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'airport_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'airport_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) loading table country_data ...
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE country_data;" -U beluga -d belugaDb
psql -c "COPY country_data (country_iso2letter,
    						country_flag_utf8code,
							country_iso3letter,
							country_name_de,
							country_name_en)
		FROM '$pathToDirectoryWithCsv/country_data.csv'
		WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table country_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'country_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'country_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) loading table regcode_data ...
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE regcode_data;" -U beluga -d belugaDb
psql -c "COPY regcode_data (
			regcode_prefix,
			regcode_flag_utf8code,
			regcode_name)
		FROM '$pathToDirectoryWithCsv/regcode_data.csv' 
		WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table regcode_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'regcode_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'regcode_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) loading table map_operator_icao_to_iata ...
echo ----------------------------------------------------------------------
psql -c "CREATE TABLE IF NOT EXISTS map_operator_icao_to_iata(
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
		FROM '$pathToDirectoryWithCsv/map_operator_icao_to_iata.csv'
		WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table map_operator_icao_to_iata
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'map_operator_icao_to_iata',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'map_operator_icao_to_iata'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) loading table operators.csv 
echo ----------------------------------------------------------------------
psql -c "CREATE TABLE IF NOT EXISTS tmp_operator_data_mictronics(
    		operator_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    		operator_icao character varying(255) COLLATE pg_catalog."default",
    		operator_name character varying(255) COLLATE pg_catalog."default",
    		operator_callsign character varying(255) COLLATE pg_catalog."default",
    		operator_country character varying(255) COLLATE pg_catalog."default",
    		operator_country_iso2letter character varying(255) COLLATE pg_catalog."default",
    		operator_iata character varying(255) COLLATE pg_catalog."default",
    		CONSTRAINT tmp_operator_data_mictronics_pkey PRIMARY KEY (operator_id)
			);" -U beluga -d belugaDb

psql -c "TRUNCATE TABLE tmp_operator_data_mictronics;" -U beluga -d belugaDb
psql -c "COPY tmp_operator_data_mictronics (
			operator_icao,
			operator_name,
			operator_country,
			operator_callsign
			)
		FROM '$pathToDirectoryWithCsv/operators.csv'
		WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) change coutry_name to ISO-Standard
echo ----------------------------------------------------------------------
psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Korea (Democratic People''s Republic of)'
			WHERE OPERATOR_COUNTRY = 'North Korea';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Congo, Democratic Republic of the'
			WHERE OPERATOR_COUNTRY = 'Congo (Kinshasa)';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Lao People''s Democratic Republic'
			WHERE OPERATOR_COUNTRY = 'Laos';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Jersey';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Guernsey';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Bermuda';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Côte d''Ivoire'
			WHERE OPERATOR_COUNTRY = 'Cote d''Ivoire';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Brunei Darussalam'
			WHERE OPERATOR_COUNTRY = 'Brunei';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Cayman Islands';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Congo'
			WHERE OPERATOR_COUNTRY = 'Congo (Brazzaville)';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Syrian Arab Republic'
			WHERE OPERATOR_COUNTRY = 'Syria';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'North Macedonia'
			WHERE OPERATOR_COUNTRY = 'Macedonia';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Moldova, Republic of'
			WHERE OPERATOR_COUNTRY = 'Moldova';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Korea, Republic of'
			WHERE OPERATOR_COUNTRY = 'South Korea';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Iran (Islamic Republic of)'
			WHERE OPERATOR_COUNTRY = 'Iran';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Czechia'
			WHERE OPERATOR_COUNTRY = 'Czech Republic';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Bolivia (Plurinational State of)'
			WHERE OPERATOR_COUNTRY = 'Bolivia';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Tanzania, United Republic of'
			WHERE OPERATOR_COUNTRY = 'Tanzania';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Venezuela (Bolivarian Republic of)'
			WHERE OPERATOR_COUNTRY = 'Venezuela';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Russian Federation'
			WHERE OPERATOR_COUNTRY = 'Russia';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'United Kingdom';" -U beluga -d belugaDb

psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United States of America'
			WHERE OPERATOR_COUNTRY = 'United States';" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) set country_iso2letter
echo ----------------------------------------------------------------------
psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY_ISO2LETTER =
			(SELECT COUNTRY_ISO2LETTER
			FROM COUNTRY_DATA
			WHERE OPERATOR_COUNTRY = RTRIM(COUNTRY_NAME_EN));" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) set iata code
echo ----------------------------------------------------------------------
psql -c "UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_IATA =
			(SELECT OPERATOR_IATA
			FROM map_OPERATOR_icao_to_iata
				WHERE tmp_OPERATOR_DATA_MICTRONICS.OPERATOR_ICAO = map_OPERATOR_icao_to_iata.OPERATOR_ICAO);" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) copy to table operator_data ...
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE operator_data;" -U beluga -d belugaDb

psql -c "INSERT INTO OPERATOR_DATA(
			OPERATOR_ID,
			OPERATOR_NAME,
			OPERATOR_CALLSIGN,
			OPERATOR_COUNTRY,
			OPERATOR_COUNTRY_ISO2LETTER,
			OPERATOR_IATA,
			OPERATOR_ICAO)
		SELECT OPERATOR_ID,
			OPERATOR_NAME,
			OPERATOR_CALLSIGN,
			OPERATOR_COUNTRY,
			OPERATOR_COUNTRY_ISO2LETTER,
			OPERATOR_IATA,
			OPERATOR_ICAO
		FROM TMP_OPERATOR_DATA_MICTRONICS;" -U beluga -d belugaDb

psql -c "DROP TABLE IF EXISTS TMP_OPERATOR_DATA_MICTRONICS;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table operator_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'operator_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'operator_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) loading table flightroute_data ...
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE flightroute_data;" -U beluga -d belugaDb
psql -c "COPY flightroute_data (flight_id,
								flight_last_update,
								flight_route)
		FROM '$pathToDirectoryWithCsv/flightroute_data.csv'
		WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table flightroute_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'flightroute_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'flightroute_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) loading table shape_data ...
echo ----------------------------------------------------------------------
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
		FROM '$pathToDirectoryWithCsv/shape_data.csv'
		WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table shape_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'shape_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'shape_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) loading table map_cat_to_shape_data ...
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE map_cat_to_shape_data;" -U beluga -d belugaDb
psql -c "COPY map_cat_to_shape_data (
			category,
			creator,
			description,
			shape_designator,
			shape_scale,
			version)
		FROM '$pathToDirectoryWithCsv/map_cat_to_shape_data.csv'
		WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table map_cat_to_shape_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'map_cat_to_shape_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'map_cat_to_shape_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) loading table map_type_to_shape_data ...
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE map_type_to_shape_data;" -U beluga -d belugaDb
psql -c "COPY map_type_to_shape_data (
			type_designator,
			creator,
			description,
			shape_designator,
			shape_scale,
			version)
		FROM '$pathToDirectoryWithCsv/map_type_to_shape_data.csv'
		WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb
echo $(timestamp) Done.

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table map_type_to_shape_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
			table_name,
			version,
			rows,
			csv_created,
			csv_imported,
			last_updated)
		VALUES (
			'map_type_to_shape_data',
			'4.0.1',
			(SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'map_type_to_shape_data'),
			null,
			null,
			current_timestamp)
		ON CONFLICT ON CONSTRAINT version_info_pkey DO
		UPDATE 
		SET last_updated = current_timestamp;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo Start time was: $start_time
echo End time is...: $(timestamp)
SECONDS_ELAPSED=$(( SECONDS - a ))
echo Script runtime in Min:Sec
echo $((SECONDS_ELAPSED-SECONDS_AT_START)) | awk '{print int($1/60)":"int($1%60)}'
echo Done. Yippie!
echo ----------------------------------------------------------------------
