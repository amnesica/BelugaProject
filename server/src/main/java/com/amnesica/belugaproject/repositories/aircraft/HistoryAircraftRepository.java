package com.amnesica.belugaproject.repositories.aircraft;

import com.amnesica.belugaproject.entities.aircraft.HistoryAircraft;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface HistoryAircraftRepository extends CrudRepository<HistoryAircraft, String> {

    @Transactional
    @Modifying
    @Query(value = "delete from history_aircraft ha where ha.last_update <= extract('epoch' from (current_timestamp  - ( ?1 )\\:\\:interval)) * 1000", nativeQuery = true)
    void deleteAllByLastUpdateLessThanEqual(String retention_days);
}
