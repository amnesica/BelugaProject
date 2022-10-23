package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.AirportData;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AirportDataRepository extends CrudRepository<AirportData, String> {
    AirportData findByIdent(String ident);

    @Query(value = "select * from airport_data where longitude_deg between ?1 and ?3 and latitude_deg between ?2 and ?4", nativeQuery = true)
    List<AirportData> findAllWithinExtent(double lomin, double lamin, double lomax, double lamax);

    @Query(value = "select * from airport_data where type = 'large_airport' and longitude_deg between ?1 and ?3 and latitude_deg between ?2 and ?4", nativeQuery = true)
    List<AirportData> findAllLargeAirportsWithinExtent(double lomin, double lamin, double lomax, double lamax);

    @Query(value = "select * from airport_data where type = 'large_airport' or type = 'medium_airport' and longitude_deg between ?1 and ?3 and latitude_deg between ?2 and ?4", nativeQuery = true)
    List<AirportData> findAllMediumAndLargeAirportsWithinExtent(double lomin, double lamin, double lomax, double lamax);
}
