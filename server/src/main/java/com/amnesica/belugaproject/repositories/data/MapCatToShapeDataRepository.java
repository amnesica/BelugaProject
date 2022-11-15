package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.MapCatToShapeData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MapCatToShapeDataRepository extends CrudRepository<MapCatToShapeData, String> {
    MapCatToShapeData findByCategory(String category);
}
