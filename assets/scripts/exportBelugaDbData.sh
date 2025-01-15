#!/bin/bash

# Define path to directory with databases
# e.g. '/var/lib/postgres'
pathToDirectoryWithCsv=/assets/dbContent

# Define timestamp function
timestamp() {
  date +%Y-%m-%d_%H:%M:%S
}

start_time=$(timestamp)

SECONDS=0
SECONDS_AT_START=$SECONDS

echo ----------------------------------------------------------------------
echo $(timestamp) exportBelugaDbData.sh Version 4-1-0
echo ----------------------------------------------------------------------

echo ----------------------------------------------------------------------
echo $(timestamp) create export directory assets/dbContent
echo ----------------------------------------------------------------------
if [[ -z $(if [ -d $pathToDirectoryWithCsv ]; then echo does exist; fi) ]]; then
    mkdir assets
    cd assets
    mkdir dbContent
    cd ..
    chmod 777 -R assets
    echo "$pathToDirectoryWithCsv created."
else
    echo "-> Directory $pathToDirectoryWithCsv already exists. Done."
fi

echo ----------------------------------------------------------------------
echo $(timestamp) create table version_Info
echo ----------------------------------------------------------------------
psql -c "DROP TABLE IF EXISTS Version_info;" -U beluga -d belugaDb

psql -c "CREATE TABLE IF NOT EXISTS Version_info
        (
        table_name character varying(255) NOT NULL,
        version character varying(255),
        rows bigint,
	    csv_created	timestamp with time zone,					  
	    csv_imported timestamp with time zone,
        last_updated timestamp with time zone,					  
        CONSTRAINT Version_info_pkey PRIMARY KEY (table_name)
        ) 
        TABLESPACE pg_default;" -U beluga -d belugaDb

psql -c "ALTER TABLE IF EXISTS Version_info
            OWNER to beluga;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table aircraft_data
echo ----------------------------------------------------------------------
psql -c "COPY aircraft_data (hex,
							acars,
							adsb,
							built,
							category_description,
							data_source,
							engines,
							first_flight_date,
							icao_aircraft_type,
							is_government,
							is_historic,
							is_interesting,
							is_military,
							is_special,
							line_number,
							manufacturer_icao,
							manufacturer_name,
							model,
							modes,
							notes,
							operator_callsign,
							operator_iata,
							operator_icao,
							operator_name,
							owner_name,
							reg_until,
							registered,
							registration,
							seat_configuration,
							serial_number,
							status,
							test_reg,
							typecode,
							wtc)
        TO '$pathToDirectoryWithCsv/aircraft_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table aircraft_data
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
	        table_name, 
	        version,
	        rows,
	        csv_created,
	        csv_imported,
            last_updated)
	        VALUES (
	        'aircraft_data',
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'aircraft_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table airport_data
echo ----------------------------------------------------------------------
psql -c "COPY airport_data (ident,
							continent,
							elevation_ft,
							gps_code,
							home_link,
							iata_code,
							iso_country,
							iso_region,
							keywords,
							latitude_deg,
							local_code,
							longitude_deg,
							municipality,
							name,
							number_airport,
							scheduled_service,
							type,
							wikipedia_link)
        TO '$pathToDirectoryWithCsv/airport_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'airport_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table country_data
echo ----------------------------------------------------------------------
psql -c "COPY country_data (country_iso2letter,
    						country_flag_utf8code,
							country_iso3letter,
							country_name_de,
							country_name_en)
        TO '$pathToDirectoryWithCsv/country_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'country_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table flightroute_data
echo ----------------------------------------------------------------------
psql -c "COPY flightroute_data (flight_id,
								flight_last_update,
								flight_route)
        TO '$pathToDirectoryWithCsv/flightroute_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'flightroute_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table map_cat_to_shape_data
echo ----------------------------------------------------------------------
psql -c "COPY map_cat_to_shape_data (category,
									creator,
									description,
									shape_designator,
									shape_scale,
									version)
        TO '$pathToDirectoryWithCsv/map_cat_to_shape_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'map_cat_to_shape_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table map_operator_icao_to_iata
echo ----------------------------------------------------------------------
psql -c "COPY map_operator_icao_to_iata (operator_name,
										operator_icao,
										operator_iata)
        TO '$pathToDirectoryWithCsv/map_operator_icao_to_iata.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'map_operator_icao_to_iata'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table map_type_to_shape_data
echo ----------------------------------------------------------------------
psql -c "COPY map_type_to_shape_data (type_designator,
									creator,
									description,
									shape_designator,
									shape_scale,
									version)
        TO '$pathToDirectoryWithCsv/map_type_to_shape_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'map_type_to_shape_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table operator_data
echo ----------------------------------------------------------------------
psql -c "COPY operator_data (operator_id,
							operator_callsign,
							operator_comment,
							operator_country,
							operator_country_iso2letter,
							operator_iata,
							operator_icao,
							operator_name)
        TO '$pathToDirectoryWithCsv/operator_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'operator_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table regcode_data
echo ----------------------------------------------------------------------
psql -c "COPY regcode_data (regcode_prefix,
							regcode_flag_utf8code,
							regcode_name)
        TO '$pathToDirectoryWithCsv/regcode_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'regcode_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table shape_data
echo ----------------------------------------------------------------------
psql -c "COPY shape_data (designator,
						creator,
						description,
						orig_length,
						orig_widht,
						shape_data,
						version,
						png_id,
						png_scale)
        TO '$pathToDirectoryWithCsv/shape_data.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

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
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'shape_data'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table typecode_tags
echo ----------------------------------------------------------------------
psql -c "COPY typecode_tags (typecode,
							aircraft_description,
							is_military,
							is_historic,
							is_government,
							is_special,
							is_interesting)
        TO '$pathToDirectoryWithCsv/typecode_tags.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table typecode_tags
echo ----------------------------------------------------------------------
psql -c "INSERT INTO public.version_info(
	        table_name, 
	        version,
	        rows,
	        csv_created,
	        csv_imported,
            last_updated)
	        VALUES (
	        'typecode_tags',
	        '4.1.0',
	        (SELECT n_live_tup
		        FROM pg_stat_user_tables
		        where relname = 'typecode_tags'), 
	        current_timestamp, 
	        null,
            null);" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) export table version_info
echo ----------------------------------------------------------------------
psql -c "COPY version_info (table_name,
    						version,
							rows,
							csv_created,
							csv_imported,
                            last_updated)
        TO '$pathToDirectoryWithCsv/version_info.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo Start time was: $start_time
echo End time is...: $(timestamp)
SECONDS_ELAPSED=$(( SECONDS - a ))
echo Script runtime in Min:Sec
echo $((SECONDS_ELAPSED-SECONDS_AT_START)) | awk '{print int($1/60)":"int($1%60)}'
echo Done. Yippie!
echo ----------------------------------------------------------------------
