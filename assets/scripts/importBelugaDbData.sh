#!/bin/bash

# Define path to directory with csv-files
# e.g. '/var/lib/postgres'
pathToDirectoryWithCsv='/var/lib/postgresql/dbContent'

# Define timestamp function
timestamp() {
  date +%Y-%m-%d_%H:%M:%S
}

start_time=$(timestamp)

SECONDS=0
SECONDS_AT_START=$SECONDS

echo ----------------------------------------------------------------------
echo $(timestamp) importBelugaDbData.sh Version 4-0-1
echo ----------------------------------------------------------------------

echo ----------------------------------------------------------------------
echo $(timestamp) import table version_Info
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE Version_info;" -U beluga -d belugaDb

psql -c "COPY version_info (table_name,
    						version,
							rows,
							csv_created,
							csv_imported,
							last_updated)
        FROM '$pathToDirectoryWithCsv/version_info.csv'
        WITH DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table aircraft_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE aircraft_data;" -U beluga -d belugaDb
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
        FROM '$pathToDirectoryWithCsv/aircraft_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table aircraft_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'aircraft_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) imxport table airport_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE airport_data;" -U beluga -d belugaDb
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
        FROM '$pathToDirectoryWithCsv/airport_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table airport_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'airport_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table country_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE country_data;" -U beluga -d belugaDb
psql -c "COPY country_data (country_iso2letter,
    						country_flag_utf8code,
							country_iso3letter,
							country_name_de,
							country_name_en)
        FROM '$pathToDirectoryWithCsv/country_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table country_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'country_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table flightroute_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE flightroute_data;" -U beluga -d belugaDb
psql -c "COPY flightroute_data (flight_id,
								flight_last_update,
								flight_route)
        FROM '$pathToDirectoryWithCsv/flightroute_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table flightroute_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'flightroute_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table map_cat_to_shape_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE map_cat_to_shape_data;" -U beluga -d belugaDb
psql -c "COPY map_cat_to_shape_data (category,
									creator,
									description,
									shape_designator,
									shape_scale,
									version)
        FROM '$pathToDirectoryWithCsv/map_cat_to_shape_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table map_cat_to_shape_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'map_cat_to_shape_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table map_operator_icao_to_iata
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE map_operator_icao_to_iata;" -U beluga -d belugaDb
psql -c "COPY map_operator_icao_to_iata (operator_name,
										operator_icao,
										operator_iata)
        FROM '$pathToDirectoryWithCsv/map_operator_icao_to_iata.csv'
        DELIMITER E'\\t' CSV HEADER ENCODING 'UTF8' QUOTE '\"' ESCAPE '\"';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table map_operator_icao_to_iata
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'map_operator_icao_to_iata';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table map_type_to_shape_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE map_type_to_shape_data;" -U beluga -d belugaDb
psql -c "COPY map_type_to_shape_data (type_designator,
									creator,
									description,
									shape_designator,
									shape_scale,
									version)
        FROM '$pathToDirectoryWithCsv/map_type_to_shape_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table map_type_to_shape_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'map_type_to_shape_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table operator_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE operator_data;" -U beluga -d belugaDb
psql -c "COPY operator_data (operator_id,
							operator_callsign,
							operator_comment,
							operator_country,
							operator_country_iso2letter,
							operator_iata,
							operator_icao,
							operator_name)
        FROM '$pathToDirectoryWithCsv/operator_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table operator_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'operator_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table regcode_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE regcode_data;" -U beluga -d belugaDb
psql -c "COPY regcode_data (regcode_prefix,
							regcode_flag_utf8code,
							regcode_name)
        FROM '$pathToDirectoryWithCsv/regcode_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table regcode_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'regcode_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table shape_data
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE shape_data;" -U beluga -d belugaDb
psql -c "COPY shape_data (designator,
						creator,
						description,
						orig_length,
						orig_widht,
						shape_data,
						version,
						png_id,
						png_scale)
        FROM '$pathToDirectoryWithCsv/shape_data.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table shape_data
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'shape_data';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) import table typecode_tags
echo ----------------------------------------------------------------------
psql -c "TRUNCATE TABLE typecode_tags;" -U beluga -d belugaDb
psql -c "COPY typecode_tags (typecode,
							aircraft_description,
							is_military,
							is_historic,
							is_government,
							is_special,
							is_interesting)
        FROM '$pathToDirectoryWithCsv/typecode_tags.csv'
        DELIMITER E'\\t' CSV HEADER;" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo $(timestamp) update version_info for table typecode_tags
echo ----------------------------------------------------------------------
psql -c "UPDATE version_info
            SET csv_imported = current_timestamp
	        where table_name = 'typecode_tags';" -U beluga -d belugaDb

echo ----------------------------------------------------------------------
echo Start time was: $start_time
echo End time is...: $(timestamp)
SECONDS_ELAPSED=$(( SECONDS - a ))
echo Script runtime in Min:Sec
echo $((SECONDS_ELAPSED-SECONDS_AT_START)) | awk '{print int($1/60)":"int($1%60)}'
echo Done. Yippie!
echo ----------------------------------------------------------------------
