package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.CountryData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CountryDataRepository extends CrudRepository<CountryData, String> {
    CountryData findByCountryIso2letter(String countryIso2letter);
}
