package com.amnesica.belugaproject.repositories.trails;

import com.amnesica.belugaproject.entities.trails.SpacecraftTrail;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpacecraftTrailRepository extends CrudRepository<SpacecraftTrail, String> {

    List<SpacecraftTrail> findAllByTimestampLessThanEqual(long startTime);

    List<SpacecraftTrail> findAllByHexOrderByTimestampAsc(String hex);

}
