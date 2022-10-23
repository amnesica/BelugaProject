package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class AirportData {

    @Id
    private String ident;
    private String type;
    private String name;
    private Double latitude_deg;
    private Double longitude_deg;
    private String elevation_ft;
    private String continent;
    private String iso_country;
    private String iso_region;
    private String municipality;
    private String scheduled_service;
    private String gps_code;
    private String iata_code;
    private String local_code;
    private String home_link;
    private String wikipedia_link;

    // Höhere Größe, da ein Eintrag länger als 255 ist
    @Column(length = 260)
    private String keywords;

    private Integer numberAirport;

    public AirportData() {
        // Benötiger, leerer Konstruktor
    }
}
