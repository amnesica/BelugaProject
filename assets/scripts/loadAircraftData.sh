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

psql -c "INSERT INTO AIRCRAFT_DATA(
			HEX,
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
			)
SELECT DISTINCT ON (HEX_LOW) 
HEX,
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
ORDER BY HEX_LOW, HEX;" -U beluga -d belugaDb

echo -----------------------------------------
echo update data source in aircraft_data
echo -----------------------------------------
psql -c "UPDATE AIRCRAFT_DATA
			SET data_source = 'OpenSkyNetwork';" -U beluga -d belugaDb

psql -c "\echo number of distinct records in table aircraft_data:" -U beluga -d belugaDb
psql -c "SELECT COUNT(*) FROM AIRCRAFT_DATA;" -U beluga -d belugaDb

echo -----------------------------------------
echo cleanup ... drop temp tables
echo -----------------------------------------
psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA;" -U beluga -d belugaDb
psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA2;" -U beluga -d belugaDb

echo -----------------------------------------
echo load aircraft data from mictronics
echo -----------------------------------------
psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA_MICTRONICS;" -U beluga -d belugaDb

psql -c "CREATE TABLE IF NOT EXISTS TMP_AIRCRAFT_DATA_MICTRONICS(
			hex character varying(255) COLLATE pg_catalog."default" NOT NULL,
			registration character varying(255) COLLATE pg_catalog."default",
			typecode character varying(255) COLLATE pg_catalog."default",
			special_tag character varying(255) COLLATE pg_catalog."default",
			CONSTRAINT TMP_AIRCRAFT_DATA_MICTRONICS_pkey PRIMARY KEY (hex)
			);" -U beluga -d belugaDb

psql -c "COPY tmp_aircraft_data_mictronics (
			hex,
			registration,
			typecode,
			special_tag)
		FROM '$pathToDirectoryWithCsv/aircrafts.csv'
		WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb

psql -c "\echo number of imported records in TMP_AIRCRAFT_DATA_MICTRONICS:" -U beluga -d belugaDb
psql -c "SELECT COUNT(*) FROM TMP_AIRCRAFT_DATA_MICTRONICS;" -U beluga -d belugaDb

echo -----------------------------------------
echo load types data from mictronics
echo -----------------------------------------
psql -c "DROP TABLE IF EXISTS TMP_TYPES_DATA_MICTRONICS;" -U beluga -d belugaDb

psql -c "CREATE TABLE IF NOT EXISTS public.tmp_types_data_mictronics(
			typecode character varying(255) COLLATE pg_catalog."default",
			aircraft_description character varying(255) COLLATE pg_catalog."default",
			icao_aircraft_type character varying(255) COLLATE pg_catalog."default",
			wtc character varying(255) COLLATE pg_catalog."default",
			CONSTRAINT tmp_types_data_mictronics_pkey PRIMARY KEY (typecode)
			);" -U beluga -d belugaDb

psql -c "COPY tmp_types_data_mictronics (
			typecode,
			aircraft_description,
			icao_aircraft_type,
			wtc)
		FROM '$pathToDirectoryWithCsv/types.csv'
		WITH DELIMITER ',' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo loading table typecode_tags ...
echo -----------------------------------------
psql -c "CREATE TABLE IF NOT EXISTS public.typecode_tags(
    		typecode character varying(255) COLLATE pg_catalog."default" NOT NULL,
    		aircraft_description character varying(255) COLLATE pg_catalog."default",
    		is_military character varying(255) COLLATE pg_catalog."default",
    		is_historic character varying(255) COLLATE pg_catalog."default",
    		is_government character varying(255) COLLATE pg_catalog."default",
    		is_special character varying(255) COLLATE pg_catalog."default",
    		is_interesting character varying(255) COLLATE pg_catalog."default",
    		CONSTRAINT typecode_tags_pkey PRIMARY KEY (typecode)
			);" -U beluga -d belugaDb			

psql -c "TRUNCATE TABLE typecode_tags;" -U beluga -d belugaDb
psql -c "COPY TYPECODE_TAGS (TYPECODE,
							AIRCRAFT_DESCRIPTION,
							IS_MILITARY,
							IS_HISTORIC,
							IS_GOVERNMENT,
							IS_SPECIAL,
							IS_INTERESTING)
FROM '$pathToDirectoryWithCsv/typecode_tags.csv' WITH DELIMITER E'\t' CSV HEADER;" -U beluga -d belugaDb

echo -----------------------------------------
echo add missing aircraft from mictronics
echo -----------------------------------------
psql -c "insert into aircraft_data
		(hex, registration, typecode, is_military, model, icao_aircraft_type, wtc, data_source)
		SELECT 
			ADM.HEX,
			ADM.REGISTRATION,
			ADM.TYPECODE,
			ADM.SPECIAL_TAG,
			TDM.AIRCRAFT_DESCRIPTION,
			TDM.ICAO_AIRCRAFT_TYPE,
			TDM.WTC,
			'Mictronics'
		FROM 
			TMP_TYPES_DATA_MICTRONICS AS TDM,
			TMP_AIRCRAFT_DATA_MICTRONICS AS ADM
			left outer join AIRCRAFT_DATA AS AD ON ADM.HEX = UPPER(AD.HEX)
			WHERE TDM.TYPECODE = ADM.TYPECODE
			AND AD.HEX IS NULL;" -U beluga -d belugaDb

echo -----------------------------------------
echo add wtc from types mictronics
echo -----------------------------------------
psql -c "UPDATE AIRCRAFT_DATA
			SET WTC =
				(SELECT WTC
					FROM TMP_TYPES_DATA_MICTRONICS
					WHERE AIRCRAFT_DATA.TYPECODE = TMP_TYPES_DATA_MICTRONICS.TYPECODE);" -U beluga -d belugaDb

echo -----------------------------------------
echo decode "is_military" and "is_interesting"
echo from aircraft mictronics and copy to 
echo aircraft_data
echo -----------------------------------------
psql -c "UPDATE AIRCRAFT_DATA
			SET is_military =
				(SELECT special_tag
					FROM TMP_AIRCRAFT_DATA_MICTRONICS
					WHERE UPPER(AIRCRAFT_DATA.HEX) = TMP_AIRCRAFT_DATA_MICTRONICS.HEX);" -U beluga -d belugaDb

psql -c "UPDATE AIRCRAFT_DATA
			SET is_military = 'Y'
					WHERE is_military in ('10', '110');" -U beluga -d belugaDb
	
psql -c "UPDATE AIRCRAFT_DATA
			SET is_interesting = 'Y'
					WHERE is_military in ('01', '11');" -U beluga -d belugaDb

psql -c "UPDATE AIRCRAFT_DATA
			SET is_military = NULL
					WHERE is_military in ('00', '01', '11', '110');" -U beluga -d belugaDb

echo -----------------------------------------
echo import tags to aircraft_data depending on
echo typecode from typecode_tags to 
echo aircraft_data 
echo manual maintenance required
echo -----------------------------------------
psql -c "UPDATE AIRCRAFT_DATA
			SET is_military = TCT.is_military
				FROM TYPECODE_TAGS AS TCT
				WHERE UPPER(AIRCRAFT_DATA.TYPECODE) = UPPER(TCT.TYPECODE)
				AND TCT.is_military = 'Y';" -U beluga -d belugaDb
		
psql -c "UPDATE AIRCRAFT_DATA
			SET is_historic = TCT.is_historic
				FROM TYPECODE_TAGS AS TCT
				WHERE UPPER(AIRCRAFT_DATA.TYPECODE) = UPPER(TCT.TYPECODE)
				AND TCT.is_historic = 'Y';" -U beluga -d belugaDb

psql -c "UPDATE AIRCRAFT_DATA
		SET is_government = TCT.is_government
				FROM TYPECODE_TAGS AS TCT
				WHERE UPPER(AIRCRAFT_DATA.TYPECODE) = UPPER(TCT.TYPECODE)
				AND TCT.is_government = 'Y';" -U beluga -d belugaDb
		
psql -c "UPDATE AIRCRAFT_DATA
		SET is_special = TCT.is_special
				FROM TYPECODE_TAGS AS TCT
				WHERE UPPER(AIRCRAFT_DATA.TYPECODE) = UPPER(TCT.TYPECODE)
				AND TCT.is_special = 'Y';" -U beluga -d belugaDb
		
psql -c "UPDATE AIRCRAFT_DATA
		SET is_interesting = TCT.is_interesting
				FROM TYPECODE_TAGS AS TCT
				WHERE UPPER(AIRCRAFT_DATA.TYPECODE) = UPPER(TCT.TYPECODE)
				AND TCT.is_interesting = 'Y';" -U beluga -d belugaDb

echo -----------------------------------------
echo cleanup ... drop temp tables
echo -----------------------------------------
psql -c "DROP TABLE IF EXISTS TMP_AIRCRAFT_DATA_MICTRONICS;" -U beluga -d belugaDb
psql -c "DROP TABLE IF EXISTS TMP_TYPES_DATA_MICTRONICS;" -U beluga -d belugaDb

echo -----------------------------------------
echo Done. Yippie!
echo -----------------------------------------
