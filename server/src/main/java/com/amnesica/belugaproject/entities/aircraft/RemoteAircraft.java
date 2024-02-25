package com.amnesica.belugaproject.entities.aircraft;

import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(indexes = {@Index(name = "idx_remote_ac_lastUpdate", columnList = "lastUpdate"),
    @Index(name = "idx_remote_ac_latitude", columnList = "latitude"),
    @Index(name = "idx_remote_ac_longitude", columnList = "longitude")})
public class RemoteAircraft extends AircraftSuperclass {
  public RemoteAircraft() {
    // Benötiger, leerer Konstruktor
  }

  public RemoteAircraft(String hex, Double latitude, Double longitude) {
    super(hex, latitude, longitude);
  }

}
