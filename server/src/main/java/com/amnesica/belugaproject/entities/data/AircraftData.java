package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.ToString;

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

  // Modellbezeichnung bspw. A380-841
  private String model;

  // Type-Code bpsw. A388
  private String typecode;
  private String serialNumber;
  private String lineNumber;

  // Kategorie bpsw. L2J
  private String icaoAircraftType;

  // Wake Turbulance class bspw. L (Light), M (Medium), H (Heavy), J (Super)
  private String wtc;

  // Special Tag bspw. 00 (not special), 10 (military), 01 or 11 (interesting)
  private String specialTag;

  // Operator-Name bspw. GERMAN AIR FORCE
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

  // Data source bspw. OSN, mictronics
  private String dataSource;

  public AircraftData() {
    // Benötiger, leerer Konstruktor
  }
}
