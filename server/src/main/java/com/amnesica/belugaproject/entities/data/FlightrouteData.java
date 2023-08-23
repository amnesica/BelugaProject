package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
@AllArgsConstructor
public class FlightrouteData {

  // bspw. "DLH01LP"
  @Id
  private String flightId;

  // Route von Origin zum Destination Airport (ICAO-Code), e.g. "EDDM-EDDH"
  private String flightRoute;

  // Timestamp
  private String flightLastUpdate;

  public FlightrouteData() {
    // Benötiger, leerer Konstruktor
  }
}
