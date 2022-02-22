package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.OperatorData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OperatorDataRepository extends CrudRepository<OperatorData, String> {
    OperatorData findByOperatorIcao(String operatorIcao);
}
