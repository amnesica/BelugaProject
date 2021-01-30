package com.amnesica.belugaproject.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amnesica.belugaproject.entities.Aircraft;
import com.amnesica.belugaproject.entities.FlightrouteData;
import com.amnesica.belugaproject.repositories.FlightrouteDataRepository;

@Service
public class FlightrouteDataService {

	@Autowired
	private FlightrouteDataRepository flightrouteDataRepository;

	/**
	 * Gibt alle Informationen über eine Flightroute mit Angabe des flightID aus der
	 * Datenbank zurück
	 * 
	 * @param flightId
	 * @return flightrouteData
	 */
	public FlightrouteData getFlightrouteData(String flightId) {
		FlightrouteData flightrouteData = null;

		if (flightId != null && !flightId.isEmpty() && !flightId.equals("null")) {
			flightId = flightId.trim();
			// Hole Daten aus Datenbank mit Angabe der flightId (bspw. "DLH01LP")

			try {
				flightrouteData = flightrouteDataRepository.findByFlightId(flightId);
			} catch (Exception e) {
				System.out.println("Error Server - DB error while reading FlightrouteData for FlightId " + flightId
						+ ": Exception = " + e);
			}

		}

		return flightrouteData;
	}

	/**
	 * Fügt zusätzliche Informationen zumr Flugroute aus Datenbank-Tabellen hinzu
	 * 
	 * @param Aircraft aircraft
	 */
	public void addFlightrouteData(Aircraft aircraft) {

		// Lese Flugrouten-Information für flightId hinzu

		if (aircraft.getFlightId() != null && !aircraft.getFlightId().isEmpty()) {
			FlightrouteData flightrouteData = getFlightrouteData(aircraft.getFlightId());
			if (flightrouteData != null) {
				aircraft.setOrigin(flightrouteData.getFlightRoute().substring(0, 4));
				aircraft.setDestination(flightrouteData.getFlightRoute().substring(5, 9));
			}
		}

	}

}
