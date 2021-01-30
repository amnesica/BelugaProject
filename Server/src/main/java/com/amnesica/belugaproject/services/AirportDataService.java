package com.amnesica.belugaproject.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amnesica.belugaproject.entities.AirportData;
import com.amnesica.belugaproject.repositories.AirportDataRepository;

@Service
public class AirportDataService {

	@Autowired
	private AirportDataRepository airportDataRepository;

	/**
	 * Gibt alle Informationen über einen Flughafen mit Angabe der ident aus der
	 * Datenbank zurück
	 * 
	 * @param ident
	 * @return AirportData
	 */
	public AirportData getAirportData(String ident) {
		AirportData airportData = null;

		if (ident != null && !ident.isEmpty() && !ident.equals("null")) {
			// Hole Daten aus Datenbank mit Angabe der Ident (bspw. "EDHI")

			try {
				airportData = airportDataRepository.findByIdent(ident);
			} catch (Exception e) {
				System.out.println(
						"Error Server - DB error while reading AirportData for ident " + ident + ": Exception = " + e);
			}

		}

		return airportData;
	}
}
