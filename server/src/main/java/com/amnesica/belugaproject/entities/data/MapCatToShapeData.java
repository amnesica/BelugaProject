package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class MapCatToShapeData {

    // Kategorie vom Feeder
    @Id
    private String category;

    // Mapping shape designator
    private String shapeDesignator;

    // Scale factor für das shape
    private Double shapeScale;

    // Description / notes für mapping
    private String description;

    // Ersteller des mapping
    private String creator;

    // Version des mapping
    private String version;

    public MapCatToShapeData() {
        // Benötiger, leerer Konstruktor
    }
}
