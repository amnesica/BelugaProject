package com.amnesica.belugaproject.entities.trails;

import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@EqualsAndHashCode(callSuper = true)
@Table(indexes = {@Index(name = "idx_ac_trail_hex_timestampAsc", columnList = "hex, timestamp ASC"),
    @Index(name = "idx_ac_trail_timestamp", columnList = "timestamp"),
    @Index(name = "idx_ac_trail_hex", columnList = "hex"),
    @Index(name = "idx_ac_trail_hex_feeder_timestampAsc", columnList = "hex, feeder, timestamp ASC")})
public class AircraftTrail extends TrailSuperclass {

  private String category;
  private String registration;
  private String flightId;
  private String type;

  public AircraftTrail() {
    // Benötiger, leerer Konstruktor
  }

  public AircraftTrail(String hex, Double longitude, Double latitude, Integer altitude, Boolean reenteredAircraft,
                       Long timestamp, String feeder, String source, Integer track, Double roll) {
    super(hex, longitude, latitude, altitude, reenteredAircraft, timestamp, feeder, source, track, roll);
  }
}
