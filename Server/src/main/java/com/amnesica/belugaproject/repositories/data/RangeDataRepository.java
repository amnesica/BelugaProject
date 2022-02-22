package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.RangeData;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RangeDataRepository extends CrudRepository<RangeData, String> {

    List<RangeData> findAllByTimestampBetween(long startTime, long endTime);

    @Transactional
    @Modifying
    @Query(value = "delete from range_data rd where rd.timestamp <= (extract('epoch' from (current_timestamp  - interval '?1 days')) * 1000)", nativeQuery = true)
    void deleteAllByTimestampLessThanEqual(long time);
}
