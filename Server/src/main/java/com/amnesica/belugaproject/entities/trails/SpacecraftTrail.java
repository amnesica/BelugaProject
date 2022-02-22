package com.amnesica.belugaproject.entities.trails;

import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.Table;

@Entity
@Table(indexes = {@Index(name = "idx_sc_trail_hex_timestampAsc", columnList = "hex, timestamp ASC"),
        @Index(name = "idx_sc_trail_timestamp", columnList = "timestamp"),
        @Index(name = "idx_sc_trail_hex", columnList = "hex"),
        @Index(name = "idx_sc_trail_hex_feeder_timestampAsc", columnList = "hex, feeder, timestamp ASC")})
public class SpacecraftTrail extends TrailSuperclass {
    public SpacecraftTrail() {
        // Benötiger, leerer Konstruktor
    }

    public SpacecraftTrail(String hex, Double longitude, Double latitude, Integer altitude, Boolean reenteredAircraft,
                           Long timestamp, String feeder, String source) {
        super(hex, longitude, latitude, altitude, reenteredAircraft, timestamp, feeder, source);
    }
}
