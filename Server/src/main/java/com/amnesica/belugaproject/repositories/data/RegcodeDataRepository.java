package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.RegcodeData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegcodeDataRepository extends CrudRepository<RegcodeData, String> {
    RegcodeData findByRegcodePrefix(String regcodePrefix);
}
