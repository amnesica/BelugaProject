package com.amnesica.belugaproject.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.amnesica.belugaproject.entities.AircraftData;

@Repository
public interface AircraftDataRepository extends CrudRepository<AircraftData, String> {
	AircraftData findByHex(String hex);
}
