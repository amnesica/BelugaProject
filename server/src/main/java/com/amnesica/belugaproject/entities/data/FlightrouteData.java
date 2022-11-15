package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
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
