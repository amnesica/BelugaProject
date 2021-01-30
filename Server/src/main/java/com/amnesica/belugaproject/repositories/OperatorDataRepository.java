package com.amnesica.belugaproject.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.amnesica.belugaproject.entities.OperatorData;

@Repository
public interface OperatorDataRepository extends CrudRepository<OperatorData, String> {
	OperatorData findByOperatorIcao(String operatorIcao);
}
