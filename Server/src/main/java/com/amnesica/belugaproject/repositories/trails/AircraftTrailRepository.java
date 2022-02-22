package com.amnesica.belugaproject.repositories.trails;

import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AircraftTrailRepository extends CrudRepository<AircraftTrail, String> {
    List<AircraftTrail> findAllByHexOrderByTimestampAsc(String hex);

    List<AircraftTrail> findAllByTimestampLessThanEqual(long time);

    List<AircraftTrail> findAllByHexAndFeederOrderByTimestampAsc(String hex, String feeder);

    AircraftTrail findFirstByHexAndFeederOrderByTimestampDesc(String hex, String feeder);
}
