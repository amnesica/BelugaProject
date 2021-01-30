package com.amnesica.belugaproject.repositories;

import java.util.List;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.amnesica.belugaproject.entities.RangeData;

@Repository
public interface RangeDataRepository extends CrudRepository<RangeData, Integer> {
	RangeData findById(int id);

	List<RangeData> findAllByTimestampBetween(long timeStart, long timeEnd);
}
