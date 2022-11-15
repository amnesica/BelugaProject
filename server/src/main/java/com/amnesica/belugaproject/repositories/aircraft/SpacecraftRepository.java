package com.amnesica.belugaproject.repositories.aircraft;

import com.amnesica.belugaproject.entities.aircraft.Spacecraft;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpacecraftRepository extends CrudRepository<Spacecraft, String> {
    @Query(value = "select * from spacecraft where longitude between ?1 and ?3 and latitude between ?2 and ?4", nativeQuery = true)
    Spacecraft findFirstWithinExtent(double lomin, double lamin, double lomax, double lamax);

    Spacecraft findByHex(String string);
}
