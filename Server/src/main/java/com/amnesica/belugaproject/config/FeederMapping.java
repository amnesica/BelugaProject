package com.amnesica.belugaproject.config;

import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class FeederMapping {
    private String hex;
    private String latitude;
    private String longitude;
    private String altitude;
    private String track;
    private String type;
    private String registration;
    private String onGround;
    private String speed;
    private String squawk;
    private String flightId;
    private String verticalRate;
    private String rssi;
    private String category;
    private String temperature;
    private String windSpeed;
    private String windFromDirection;
    private String destination;
    private String origin;
    private String distance;
    private String autopilotEngaged;
    private String elipsoidalAltitude;
    private String selectedQnh;
    private String selectedAltitude;
    private String selectedHeading;
    private String feeder;
    private String lastSeen;
    private String source;
}
