package com.amnesica.belugaproject.repositories.aircraft;

import com.amnesica.belugaproject.entities.aircraft.RemoteAircraft;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RemoteAircraftRepository extends CrudRepository<RemoteAircraft, String> {

  RemoteAircraft findByHex(String hex);

  List<RemoteAircraft> findAllByLastUpdateLessThanEqual(long startTime);

  @Query(value = "select * from remote_aircraft where longitude between ?1 and ?3 and latitude between ?2 and ?4 limit ?5", nativeQuery = true)
  List<RemoteAircraft> findAllWithinExtentWithLimit(double lomin, double lamin, double lomax, double lamax, int limit);

  @Query(value = "select * from remote_aircraft where longitude between ?1 and ?3 and latitude between ?2 and ?4 and is_from_remote = ?5", nativeQuery = true)
  List<RemoteAircraft> findAllWithinExtent(double lomin, double lamin, double lomax, double lamax, String isFromRemote);
}
