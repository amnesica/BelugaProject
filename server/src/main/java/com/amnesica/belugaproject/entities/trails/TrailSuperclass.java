package com.amnesica.belugaproject.entities.trails;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Objects;

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
  private Integer track;
  private Double roll;
  private Double distanceToSite;
  private Integer angleToSite;

  public TrailSuperclass(String hex, Double longitude, Double latitude, Integer altitude, Boolean reenteredAircraft,
                         Long timestamp, String feeder, String source, Integer track, Double roll) {
    this.longitude = longitude;
    this.latitude = latitude;
    this.altitude = altitude;
    this.timestamp = timestamp;
    this.reenteredAircraft = reenteredAircraft;
    this.hex = hex;
    this.feeder = feeder;
    this.source = source;
    this.track = track;
    this.roll = roll;
  }

  public TrailSuperclass() {
    // Benötiger, leerer Konstruktor
  }

  @Override
  public String toString() {
    return "TrailSuperclass{" +
        "id=" + id +
        ", hex='" + hex + '\'' +
        ", longitude=" + longitude +
        ", latitude=" + latitude +
        ", altitude=" + altitude +
        ", timestamp=" + new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(timestamp) +
        ", reenteredAircraft=" + reenteredAircraft +
        ", feeder='" + feeder + '\'' +
        ", source='" + source + '\'' +
        ", track=" + track +
        '}';
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    TrailSuperclass that = (TrailSuperclass) o;
    return Objects.equals(hex, that.hex) && Objects.equals(longitude, that.longitude) && Objects.equals(latitude, that.latitude) && Objects.equals(altitude, that.altitude) && Objects.equals(reenteredAircraft, that.reenteredAircraft) && Objects.equals(feeder, that.feeder) && Objects.equals(source, that.source);
  }

  @Override
  public int hashCode() {
    return Objects.hash(hex, longitude, latitude, altitude, reenteredAircraft, feeder, source);
  }
}
