package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class MapTypeToShapeData {

  // Type designator des feeder
  @Id
  private String typeDesignator;

  // Mapping shape designator
  private String shapeDesignator;

  // Scale factor für shape
  private Double shapeScale;

  // Description / notes für mapping
  private String description;

  // Ersteller des mapping
  private String creator;

  // Version of mappings
  private String version;

  public MapTypeToShapeData() {
    // Benötiger, leerer Konstruktor
  }
}
