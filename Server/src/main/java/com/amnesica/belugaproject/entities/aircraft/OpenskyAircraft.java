package com.amnesica.belugaproject.entities.aircraft;

import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.Table;

@Entity
@Table(indexes = {@Index(name = "idx_opensky_ac_lastUpdate", columnList = "lastUpdate"),
        @Index(name = "idx_opensky_ac_latitude", columnList = "latitude"),
        @Index(name = "idx_opensky_ac_longitude", columnList = "longitude")})
public class OpenskyAircraft extends AircraftSuperclass {
    public OpenskyAircraft() {
        // Benötiger, leerer Konstruktor
    }

    public OpenskyAircraft(String hex, Double latitude, Double longitude) {
        super(hex, latitude, longitude);
    }

}
