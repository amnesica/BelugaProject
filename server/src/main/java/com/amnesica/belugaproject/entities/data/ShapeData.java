package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import org.hibernate.annotations.Type;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShapeData {

  @Id
  private String designator;

  // Width, height, strokeScale, accentMult, viewbox, path, accentPath
  @Type(JsonBinaryType.class)
  @Column(columnDefinition = "jsonb")
  private Object shapeData;

  // Original width / span in meters
  private Double origWidht;

  // Original length in meters
  private Double origLength;

  // Description of shape
  private String description;

  // Ersteller des shape
  private String creator;

  // Version of shape
  private String version;

  // Id für WebGL
  private Integer pngId;

  // Shape-Scale für WebGL
  private Double pngScale;

  public ShapeData() {
    // Benötigter, leerer Konstruktor
  }
}
