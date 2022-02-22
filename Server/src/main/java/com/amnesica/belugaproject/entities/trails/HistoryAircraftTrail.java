package com.amnesica.belugaproject.entities.trails;

import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.Table;

@Entity
@Table(indexes = {@Index(name = "idx_hac_trail_hex_timestampAsc", columnList = "hex, timestamp ASC"),
        @Index(name = "idx_hac_trail_timestamp", columnList = "timestamp"),
        @Index(name = "idx_hac_trail_hex", columnList = "hex"),
        @Index(name = "idx_hac_trail_hex_feeder_timestampAsc", columnList = "hex, feeder, timestamp ASC")})
public class HistoryAircraftTrail extends TrailSuperclass {

    public HistoryAircraftTrail() {
        // Benötiger, leerer Konstruktor
    }

    public HistoryAircraftTrail(String hex, Double longitude, Double latitude, Integer altitude, Boolean reenteredAircraft,
                                Long timestamp, String feeder, String source) {
        super(hex, longitude, latitude, altitude, reenteredAircraft,
                timestamp, feeder, source);
    }

    /**
     * Erstellt eine Kopie des AircraftTrails, welches als Parameter hereingegeben wird
     *
     * @param that Zu kopierender Trail (AircraftTrail)
     * @return HistoryAircraftTrail
     */
    public static HistoryAircraftTrail makeCopy(AircraftTrail that) {
        return new HistoryAircraftTrail(that.getHex(), that.getLongitude(), that.getLatitude(), that.getAltitude(), that.getReenteredAircraft(), that.getTimestamp(), that.getFeeder(), that.getSource());
    }
}
