package com.amnesica.belugaproject.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.amnesica.belugaproject.entities.RegcodeData;

@Repository
public interface RegcodeDataRepository extends CrudRepository<RegcodeData, String> {
	RegcodeData findByRegcodePrefix(String regcodePrefix);
}
