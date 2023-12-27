\echo -----------------------------------------------------
\echo Running this sql script creates the stored 
\echo procedures and functions for the BelugaProject
\echo -----------------------------------------------------

\echo -----------------------------------------------------
\echo get BelugaDb Statistics
\echo -----------------------------------------------------
create or replace function getBelugaDbStatistics()
   returns text as $$

declare 
	 stat text default '';
	 i int default 0;
	 size_sum bigint default 0;
	 size_sum_output text default '';
	 rec_table_list record;
	 cur_table_list cursor 
		 for
	 		SELECT relname, n_live_tup
			FROM pg_stat_user_tables;

	 rec_table_stat  record;

begin
   -- open the cursor
   open cur_table_list;
	
   loop
    -- fetch row into the tablelist
      fetch cur_table_list into rec_table_list;
    -- exit when no more row to fetch
      exit when not found;

    -- build the output
	if i = 0 then
      stat := 	RPAD('tablename', 25) || '  ' ||
	  			LPAD('rows', 8) || '  ' ||
				LPAD('size on disk', 20) || '  '  ||
				RPAD('access', 23) || ' ' ||
				RPAD('modification', 23)  || ' ' ||
				RPAD('change', 23) || E'\n';
				
	  i = i  + 1;
	  end if;
    
	select size, access, modification, change into rec_table_stat from pg_stat_file( pg_relation_filepath( CAST(rec_table_list.relname As text) ) );

	stat := stat || 
				RPAD(rec_table_list.relname, 25) || '  ' ||
	  			LPAD(CAST(rec_table_list.n_live_tup as text),8) || '  ' ||
				LPAD(CAST(rec_table_stat.size as text),20) || '  ' ||
				rec_table_stat.access || '  ' ||
				rec_table_stat.modification  || '  ' ||
				rec_table_stat.change || E'\n';
	
	size_sum := size_sum + rec_table_stat.size;
	
   end loop;
	size_sum_output := to_char(size_sum, '999G999G999G999');
	stat := stat || 
				RPAD('Sum', 25) || '  ' ||
	  			LPAD('', 8) || '  ' ||
				LPAD(size_sum_output, 20) || E'\n';

   -- close the cursor
   close cur_table_list;

   return stat;
end; $$

language plpgsql;