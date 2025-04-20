\echo ----------------------------------------------------------------------
\echo loadBelugaDb.sql Version 4-1-0 (11.01.2025 18:25)
\echo - this script is intended only for debug and tuning purposes
\echo - run script from psql with parameter timing to get duration of commands
\echo - normal installation process uses loadBelugaDb.sh instead
\echo ----------------------------------------------------------------------

\echo ----------------------------------------------------------------------
\echo loading table airport_Data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE airport_Data;
COPY airport_data (
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
			icao_code,
			iata_code,
			gps_code,
			local_code,
			home_link,
			wikipedia_link,
			keywords)
		FROM '/var/lib/postgresql/dbContent/airports.csv' WITH DELIMITER ',' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table country_data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE country_data;
COPY country_data (
	 		country_iso2letter,
	 		country_iso3letter,
	 		country_name_en,
	 		country_name_de,
			country_flag_utf8code)
		FROM '/var/lib/postgresql/dbContent/country_data.csv' WITH DELIMITER E'\t' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table regcode_data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE regcode_data;
COPY regcode_data (
			regcode_prefix,
			regcode_flag_utf8code,
			regcode_name)
		FROM '/var/lib/postgresql/dbContent/regcode_data.csv' WITH DELIMITER E'\t' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table map_operator_icao_to_iata ...
\echo ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS map_operator_icao_to_iata(
    		operator_name character varying(255) COLLATE pg_catalog."default",
    		operator_icao character varying(255) COLLATE pg_catalog."default" NOT NULL,
    		operator_iata character varying(255) COLLATE pg_catalog."default",
    		CONSTRAINT map_operator_icao_to_iata_pkey PRIMARY KEY (operator_icao)
			);
TRUNCATE TABLE map_operator_icao_to_iata;
COPY map_operator_icao_to_iata (
			operator_name,
			operator_icao,
			operator_iata)
FROM '/var/lib/postgresql/dbContent/map_operator_icao_to_iata.csv' WITH DELIMITER E'\t' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table operators.csv 
\echo ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tmp_operator_data_mictronics(
    		operator_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    		operator_icao character varying(255) COLLATE pg_catalog."default",
    		operator_name character varying(255) COLLATE pg_catalog."default",
    		operator_callsign character varying(255) COLLATE pg_catalog."default",
    		operator_country character varying(255) COLLATE pg_catalog."default",
    		operator_country_iso2letter character varying(255) COLLATE pg_catalog."default",
    		operator_iata character varying(255) COLLATE pg_catalog."default",
    		CONSTRAINT tmp_operator_data_mictronics_pkey PRIMARY KEY (operator_id)
			);

TRUNCATE TABLE tmp_operator_data_mictronics;
COPY tmp_operator_data_mictronics (
			operator_icao,
			operator_name,
			operator_country,
			operator_callsign
			)
		FROM '/var/lib/postgresql/dbContent/operators.csv' WITH DELIMITER ',' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo change coutry_name to ISO-Standard
\echo ----------------------------------------------------------------------
UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Korea (Democratic People''s Republic of)'
			WHERE OPERATOR_COUNTRY = 'North Korea';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Congo, Democratic Republic of the'
			WHERE OPERATOR_COUNTRY = 'Congo (Kinshasa)';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Lao People''s Democratic Republic'
			WHERE OPERATOR_COUNTRY = 'Laos';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Jersey';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Guernsey';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Bermuda';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Côte d''Ivoire'
			WHERE OPERATOR_COUNTRY = 'Cote d''Ivoire';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Brunei Darussalam'
			WHERE OPERATOR_COUNTRY = 'Brunei';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'Cayman Islands';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Congo'
			WHERE OPERATOR_COUNTRY = 'Congo (Brazzaville)';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Syrian Arab Republic'
			WHERE OPERATOR_COUNTRY = 'Syria';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'North Macedonia'
			WHERE OPERATOR_COUNTRY = 'Macedonia';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Moldova, Republic of'
			WHERE OPERATOR_COUNTRY = 'Moldova';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Korea, Republic of'
			WHERE OPERATOR_COUNTRY = 'South Korea';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Iran (Islamic Republic of)'
			WHERE OPERATOR_COUNTRY = 'Iran';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Czechia'
			WHERE OPERATOR_COUNTRY = 'Czech Republic';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Bolivia (Plurinational State of)'
			WHERE OPERATOR_COUNTRY = 'Bolivia';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Tanzania, United Republic of'
			WHERE OPERATOR_COUNTRY = 'Tanzania';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Venezuela (Bolivarian Republic of)'
			WHERE OPERATOR_COUNTRY = 'Venezuela';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'Russian Federation'
			WHERE OPERATOR_COUNTRY = 'Russia';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United Kingdom of Great Britain and Northern Ireland'
			WHERE OPERATOR_COUNTRY = 'United Kingdom';

UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY = 'United States of America'
			WHERE OPERATOR_COUNTRY = 'United States';
\echo Done.

\echo ----------------------------------------------------------------------
\echo set country_iso2letter
\echo ----------------------------------------------------------------------
UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_COUNTRY_ISO2LETTER =
			(SELECT COUNTRY_ISO2LETTER
			FROM COUNTRY_DATA
			WHERE OPERATOR_COUNTRY = RTRIM(COUNTRY_NAME_EN));
\echo Done.

\echo ----------------------------------------------------------------------
\echo set iata code
\echo ----------------------------------------------------------------------
UPDATE PUBLIC.TMP_OPERATOR_DATA_MICTRONICS
			SET OPERATOR_IATA =
			(SELECT OPERATOR_IATA
			FROM map_OPERATOR_icao_to_iata
				WHERE tmp_OPERATOR_DATA_MICTRONICS.OPERATOR_ICAO = map_OPERATOR_icao_to_iata.OPERATOR_ICAO);
\echo Done.

\echo ----------------------------------------------------------------------
\echo copy to table operator_data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE operator_data;

INSERT INTO OPERATOR_DATA(
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
		FROM TMP_OPERATOR_DATA_MICTRONICS;

DROP TABLE IF EXISTS TMP_OPERATOR_DATA_MICTRONICS;

\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table flightroute_data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE flightroute_data;
COPY flightroute_data (
			flight_id,
			flight_last_update,
			flight_route)
		FROM '/var/lib/postgresql/dbContent/flightrouteData.csv' WITH DELIMITER E'\t' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table shape_data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE shape_data;
COPY shape_data (
			designator,
			creator,
			description,
			orig_length,
			orig_widht,
			shape_data,
			version,
			png_id,
			png_scale)
		FROM '/var/lib/postgresql/dbContent/shape_data.csv' WITH DELIMITER E'\t' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table map_cat_to_shape_data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE map_cat_to_shape_data;
COPY map_cat_to_shape_data (
			category,
			creator,
			description,
			shape_designator,
			shape_scale,
			version)
		FROM '/var/lib/postgresql/dbContent/map_cat_to_shape.csv' WITH DELIMITER E'\t' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loading table map_type_to_shape_data ...
\echo ----------------------------------------------------------------------
TRUNCATE TABLE map_type_to_shape_data;
COPY map_type_to_shape_data (
			type_designator,
			creator,
			description,
			shape_designator,
			shape_scale,
			version)
		FROM '/var/lib/postgresql/dbContent/map_type_to_shape.csv' WITH DELIMITER E'\t' CSV HEADER;
\echo Done.

\echo ----------------------------------------------------------------------
\echo loadBelugaDb.sql finished.
\echo Done. Yippie!
\echo ----------------------------------------------------------------------
