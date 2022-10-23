package com.amnesica.belugaproject.repositories.trails;

import com.amnesica.belugaproject.entities.trails.HistoryAircraftTrail;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface HistoryAircraftTrailRepository extends CrudRepository<HistoryAircraftTrail, String> {

    @Transactional
    @Modifying
    @Query(value = "delete from history_aircraft_trail hat where hat.timestamp <= cast((extract('epoch' from (current_timestamp  - ( ?1 )\\:\\:interval)) * 1000) as bigint)", nativeQuery = true)
    void deleteAllByTimestampLessThanEqual(String retention_days);
}
