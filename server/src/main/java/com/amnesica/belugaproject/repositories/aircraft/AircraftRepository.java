package com.amnesica.belugaproject.repositories.aircraft;

import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AircraftRepository extends CrudRepository<Aircraft, String> {
    Aircraft findByHex(String hex);

    List<Aircraft> findAllByLastUpdateLessThanEqual(long time);

    @Query(value = "select * from aircraft where last_update >= ?1 and longitude between ?2 and ?4 and latitude between ?3 and ?5", nativeQuery = true)
    List<Aircraft> findAllByLastUpdateAndWithinExtent(long timeStart, double lomin, double lamin, double lomax,
                                                      double lamax);

    @Query(value = "select * from aircraft where last_update >= ?1 and ?2 = ANY(feeder_list) and longitude between ?3 and ?5 and latitude between ?4 and ?6", nativeQuery = true)
    List<Aircraft> findAllByLastUpdateAndFeederAndWithinExtent(long startTime, String feeder, double lomin,
                                                               double lamin, double lomax, double lamax);
}
