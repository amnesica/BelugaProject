package com.amnesica.belugaproject.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.amnesica.belugaproject.entities.FlightrouteData;

@Repository
public interface FlightrouteDataRepository extends CrudRepository<FlightrouteData, String> {
	FlightrouteData findByFlightId(String flightId);
}
