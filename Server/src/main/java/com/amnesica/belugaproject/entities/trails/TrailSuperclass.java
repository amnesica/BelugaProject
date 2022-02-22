package com.amnesica.belugaproject.entities.trails;

import com.sun.istack.NotNull;
import lombok.Data;

import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.MappedSuperclass;

@Data
@MappedSuperclass
public class TrailSuperclass {
    @Id
    @GeneratedValue
    private long id;
    @NotNull
    private String hex;
    private Double longitude;
    private Double latitude;
    private Integer altitude;
    private Long timestamp;
    private Boolean reenteredAircraft = false;
    private String feeder;
    private String source;

    public TrailSuperclass(String hex, Double longitude, Double latitude, Integer altitude, Boolean reenteredAircraft,
                           Long timestamp, String feeder, String source) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.altitude = altitude;
        this.timestamp = timestamp;
        this.reenteredAircraft = reenteredAircraft;
        this.hex = hex;
        this.feeder = feeder;
        this.source = source;
    }

    public TrailSuperclass() {
        // Benötiger, leerer Konstruktor
    }

    @Override
    public String toString() {
        return "TrailSuperclass [id=" + id + ", hex=" + hex + ", longitude=" + longitude + ", latitude=" + latitude
                + ", altitude=" + altitude + ", timestamp="
                + new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(timestamp) + ", reenteredAircraft="
                + reenteredAircraft + ", feeder=" + feeder + ", source=" + source + "]";
    }
}
