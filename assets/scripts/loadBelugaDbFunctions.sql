\echo -----------------------------------------------------
\echo Running this sql script creates the stored 
\echo procedures and functions for the BelugaProject
\echo -----------------------------------------------------

\echo -----------------------------------------------------
\echo helper function to count rows for a
\echo dynamicly submitted tablename
\echo -----------------------------------------------------
CREATE OR REPLACE FUNCTION 
count_rows(schema text, tablename text) returns integer
as
$body$
declare
  result integer;
  query varchar;
begin
  query := 'SELECT count(1) FROM ' || schema || '.' || tablename;
  execute query into result;
  return result;
end;
$body$
language plpgsql;

\echo -----------------------------------------------------
\echo get BelugaDb Statistics
\echo -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.getbelugaDbstatistics()
returns text AS $$

declare 
	 stat text default '';
	 i int default 0;
	 size_sum bigint default 0;
	 size_sum_output text default '';
	 csv_created_txt text default '';
	 csv_imported_txt text default '';
	 last_updated_txt text default '';
	 local_tz text default '';
	 schema_name text default 'public';
	 rec_table_list record;
	 cur_table_list cursor 
		 for
	 		SELECT relname, 
			count_rows(schema_name, relname) as table_rows
			FROM pg_stat_user_tables;

   -- two records because two sources
	 rec_table_stat1  record;
	 rec_table_stat2  record;

begin
   -- open the cursor
   OPEN cur_table_list;
	
   LOOP
    -- fetch row into the tablelist
      FETCH cur_table_list INTO rec_table_list;
    -- exit when no more row to fetch
      EXIT when not found;

    -- build the output
	
	-- header
	IF i = 0 THEN
      stat := 	RPAD('tablename', 25) || '  ' ||
	  			LPAD('rows', 8) || '  ' ||
				LPAD('size on disk', 20) || '  '  ||
				RPAD('last change (disk)', 20) || ' ' ||
				RPAD('csv created', 20)  || ' ' ||
				RPAD('csv imported', 20)  || ' ' ||
				RPAD('last updated', 20) || E'\n';
	i := 1;
	END IF;

	-- prepare rows with table info
	
	-- read table information from postgres dbms
	SELECT 	size, 
			change::timestamp
	INTO rec_table_stat1
	FROM pg_stat_file( pg_relation_filepath( CAST(rec_table_list.relname As text) ) );
	
	-- read standing data information from version_info (BelugaProject)
	SELECT  csv_created::timestamp,
			csv_imported::timestamp,
			last_updated::timestamp
	INTO rec_table_stat2
	FROM version_info
	WHERE table_name = rec_table_list.relname;

	-- we have to avoid concatination with NULL, because then result will become NULL
	IF rec_table_stat2.csv_created is null
		THEN
			csv_created_txt := '        n/a        ';
		ELSE
			csv_created_txt := date_trunc('second', rec_table_stat2.csv_created);
	END IF;

	IF rec_table_stat2.csv_imported is null
		THEN
			csv_imported_txt := '        n/a        ';
		ELSE
			csv_imported_txt := date_trunc('second', rec_table_stat2.csv_imported);
	END IF;
	
	IF rec_table_stat2.last_updated is null
		THEN
			last_updated_txt := '        n/a        ';
		ELSE
			last_updated_txt := date_trunc('second', rec_table_stat2.last_updated);
	END IF;
	
	-- print row
	stat := stat || 
			RPAD(rec_table_list.relname, 25) || '  ' ||
			LPAD(CAST(rec_table_list.table_rows as text),8) || '  ' ||
			LPAD(CAST(rec_table_stat1.size as text),20) || '  ' ||
			rec_table_stat1.change || '  ' ||
			csv_created_txt  || '  ' ||
			csv_imported_txt  || '  ' ||
			last_updated_txt ||
			E'\n';

	size_sum := size_sum + rec_table_stat1.size;
	
   END LOOP;
   
   SELECT current_setting('TIMEZONE')
   INTO local_tz;
   
	size_sum_output := to_char(size_sum, '999G999G999G999');
	stat := stat || 
				RPAD('Sum', 25) || '  ' ||
	  			LPAD('', 8) || '  ' ||
				LPAD(size_sum_output, 20) ||
				LPAD('(timezone is ' || local_tz || ')', 19) ||
				E'\n';

   -- close the cursor
   close cur_table_list;

   return stat;
end; $$

language plpgsql;
