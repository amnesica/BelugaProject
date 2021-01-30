package com.amnesica.belugaproject.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.amnesica.belugaproject.entities.CountryData;

@Repository
public interface CountryDataRepository extends CrudRepository<CountryData, String> {
	CountryData findByCountryIso2letter(String countryIso2letter);
}
