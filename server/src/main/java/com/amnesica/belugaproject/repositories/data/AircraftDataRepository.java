package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.AircraftData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AircraftDataRepository extends CrudRepository<AircraftData, String> {
    AircraftData findByHex(String hex);
}
