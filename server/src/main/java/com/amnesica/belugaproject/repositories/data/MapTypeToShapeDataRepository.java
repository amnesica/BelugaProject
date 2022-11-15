package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.MapTypeToShapeData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MapTypeToShapeDataRepository extends CrudRepository<MapTypeToShapeData, String> {
    MapTypeToShapeData findByTypeDesignator(String typeDesignator);
}
