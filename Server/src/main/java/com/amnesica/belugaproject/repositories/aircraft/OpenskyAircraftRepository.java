package com.amnesica.belugaproject.repositories.aircraft;

import com.amnesica.belugaproject.entities.aircraft.OpenskyAircraft;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpenskyAircraftRepository extends CrudRepository<OpenskyAircraft, String> {

    OpenskyAircraft findByHex(String hex);

    List<OpenskyAircraft> findAllByLastUpdateLessThanEqual(long startTime);

    @Query(value = "select * from opensky_aircraft where longitude between ?1 and ?3 and latitude between ?2 and ?4 limit ?5", nativeQuery = true)
    List<OpenskyAircraft> findAllWithinExtentWithLimit(double lomin, double lamin, double lomax, double lamax, int limit);

    @Query(value = "select * from opensky_aircraft where longitude between ?1 and ?3 and latitude between ?2 and ?4", nativeQuery = true)
    List<OpenskyAircraft> findAllWithinExtent(double lomin, double lamin, double lomax, double lamax);
}
