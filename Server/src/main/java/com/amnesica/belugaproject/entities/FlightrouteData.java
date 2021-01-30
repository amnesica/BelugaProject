package com.amnesica.belugaproject.entities;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class FlightrouteData {

	@Id
	private String flightId; // e.g. "DLH01LP"
	private String flightRoute; // Route from Origin to Destination Airport (ICAO-Code), e.g. "EDDM-EDDH"
	private String flightLastupdate; // Timestamp

	public FlightrouteData() {

	}

	public String getFlightId() {
		return flightId;
	}

	public void setFlightId(String flightId) {
		this.flightId = flightId;
	}

	public String getFlightRoute() {
		return flightRoute;
	}

	public void setFlightRoute(String flightRoute) {
		this.flightRoute = flightRoute;
	}

	public String getFlightLastupdate() {
		return flightLastupdate;
	}

	public void setFlightLastupdate(String flightLastupdate) {
		this.flightLastupdate = flightLastupdate;
	}

}
