package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
@TypeDefs({@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)})
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShapeData {

    @Id
    private String designator;

    // Width, height, strokeScale, accentMult, viewbox, path, accentPath
    @Type(type = "jsonb")
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
