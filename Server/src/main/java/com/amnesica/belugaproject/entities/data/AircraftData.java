package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.ToString;

import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class AircraftData {

    @Id
    private String hex;
    private String registration;
    private String manufacturerIcao;

    // Hersteller bpsw. AIRBUS
    private String manufacturerName;

    // Modellbezeichnung bpsw. A380-841
    private String model;

    // Type-Code bpsw. A388
    private String typecode;
    private String serialNumber;
    private String lineNumber;

    // Kategorie bpsw. L2J
    private String icaoAircraftType;

    // Operator-Name bpsw. GERMAN AIR FORCE
    private String operatorName;

    private String operatorCallsign;
    private String operatorIcao;
    private String operatorIata;

    // Owner (airline) bspw. LUFTHANSA oder GERMAN AIR FORCE
    private String ownerName;
    private String testReg;
    private String registered;
    private String regUntil;
    private String status;
    private String built;
    private String firstFlightDate;
    private String seatConfiguration;
    private String engines;
    private String modes;
    private String adsb;
    private String acars;
    private String notes;
    private String categoryDescription;

    public AircraftData() {
        // Benötiger, leerer Konstruktor
    }
}
