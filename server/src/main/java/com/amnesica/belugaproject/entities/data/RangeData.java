package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import org.hibernate.annotations.Type;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class RangeData {

    @Id
    @GeneratedValue
    private long id;
    private String hex;
    private Double latitude;
    private Double longitude;
    private Double distance;
    private Integer altitude;
    private String type;
    private String category;
    private String registration;
    private String flightId;
    private Long timestamp;

    // Liste mit Feeder, welches Flugzeug zur Zeit empfangen
    @Type(type = "list-array")
    @Column(name = "feeder_list", columnDefinition = "text[]")
    private List<String> feederList;

    // Quelle (ADS-B oder MLAT)
    @Type(type = "list-array")
    @Column(name = "source_list", columnDefinition = "text[]")
    private List<String> sourceList;

    public RangeData(String hex, Double latitude, Double longitude, Double distance, Integer altitude, String type, String category, String registration, String flightId, Long timestamp, List<String> feederList, List<String> sourceList) {
        this.hex = hex;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distance = distance;
        this.altitude = altitude;
        this.type = type;
        this.category = category;
        this.registration = registration;
        this.flightId = flightId;
        this.timestamp = timestamp;
        this.feederList = feederList;
        this.sourceList = sourceList;
    }

    public RangeData() {
        // Benötigter, leerer Konstruktor
    }
}
