package com.amnesica.belugaproject.repositories.trails;

import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AircraftTrailRepository extends CrudRepository<AircraftTrail, String> {
  List<AircraftTrail> findAllByHexAndTimestampGreaterThanEqualOrderByTimestampAsc(String hex, long timestamp);

  List<AircraftTrail> findAllByTimestampLessThanEqual(long time);

  List<AircraftTrail> findAllByHexAndFeederAndTimestampGreaterThanEqualOrderByTimestampAsc(String hex, String feeder, long timestamp);

  AircraftTrail findFirstByHexAndFeederOrderByTimestampDesc(String hex, String feeder);

  @Query(value = "select * from aircraft_trail at where at.timestamp >= (extract('epoch' from (current_timestamp  - interval '1 days')) * 1000) order by at.angle_to_site", nativeQuery = true)
  List<AircraftTrail> findAllFromLast24Hours();

  List<AircraftTrail> findAllByTimestampGreaterThanEqualOrderByAngleToSite(long time);

  @Query(value = "select distinct hex from aircraft_trail at where at.timestamp >= (extract('epoch' from (current_timestamp  - interval '1 hour')) * 1000)", nativeQuery = true)
  List<String> findAllHexUpdatedInLastHour();
}
