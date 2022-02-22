package com.amnesica.belugaproject.repositories.data;

import com.amnesica.belugaproject.entities.data.ShapeData;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShapeDataRepository extends CrudRepository<ShapeData, String> {
    ShapeData findByDesignator(String designator);
}
