package com.amnesica.belugaproject.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.amnesica.belugaproject.entities.AirportData;

@Repository
public interface AirportDataRepository extends CrudRepository<AirportData, String> {
	AirportData findByIdent(String ident);
}
