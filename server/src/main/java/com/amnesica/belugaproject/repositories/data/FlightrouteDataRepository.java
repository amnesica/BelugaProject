package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.FlightrouteData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FlightrouteDataRepository extends CrudRepository<FlightrouteData, String> {
    FlightrouteData findByFlightId(String flightId);
}
