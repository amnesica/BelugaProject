package com.amnesica.belugaproject.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amnesica.belugaproject.entities.Aircraft;
import com.amnesica.belugaproject.entities.CountryData;
import com.amnesica.belugaproject.entities.OperatorData;
import com.amnesica.belugaproject.repositories.OperatorDataRepository;

@Service
public class OperatorDataService {

	@Autowired
	private OperatorDataRepository operatorDataRepository;
	@Autowired
	private CountryDataService countryDataService;

	/**
	 * Gibt alle Informationen über einen Operator mit Angabe des ICAO-Codes aus der
	 * Datenbank zurück
	 * 
	 * @param operatorIcao
	 * @return OperatorData
	 */
	public OperatorData getOperatorData(String operatorIcao) {
		OperatorData operatorData = null;

		if (operatorIcao != null && !operatorIcao.isEmpty() && !operatorIcao.equals("null")) {
			// Hole Daten aus Datenbank mit Angabe der operatorIcao (bspw. "DLH")
			// operatorIcao = 3-Letter-Code fuer die Fluggesellschft (OPerator)
			try {
				operatorData = operatorDataRepository.findByOperatorIcao(operatorIcao);
			} catch (Exception e) {
				System.out.println("Error Server - DB error on reading Operator_Data for ICAO code " + operatorIcao
						+ ": Exception = " + e);
			}

		}

		return operatorData;
	}

	/**
	 * Fügt zusätzliche Informationen zum Operator aus Datenbank-Tabellen hinzu
	 * 
	 * @param Aircraft aircraft
	 */
	public void addOperatorData(Aircraft aircraft) {

		// Lese Operator-Data hinzu
		// zuerst über den Operator-Icao aus der Aircraft-Datenbank,
		// falls nicht vorhanden, aus den ersten drei Zeichen der FlightID
		OperatorData operatorData = null;

		if (aircraft != null && aircraft.getOperatorIcao() != null && !aircraft.getOperatorIcao().isEmpty()) {
			operatorData = getOperatorData(aircraft.getOperatorIcao());
		}

		if (operatorData != null) {
			aircraft.setOperatorIcao(operatorData.getOperatorIcao());
			aircraft.setOperatorIata(operatorData.getOperatorIata());
			aircraft.setOperatorCallsign(operatorData.getOperatorCallsign());
			aircraft.setOperatorCountry(operatorData.getOperatorCountry());
			aircraft.setOperatorName(operatorData.getOperatorName());
		}

		// Lese Flaggendaten für Operator-Land hinzu
		if (operatorData != null && operatorData.getOperatorCountryIso2letter() != null
				&& !operatorData.getOperatorCountryIso2letter().isEmpty())

		{
			CountryData countryData = countryDataService.getCountryData(operatorData.getOperatorCountryIso2letter());
			if (countryData != null) {
				// Konvertiere Flagge in HTML-verarbeitbaren String, damit dieser richtig
				// angezeigt wird
				String flagCodeConverted = HelperService.convertFlagCodeToHTML(countryData.getCountryFlagUtf8Code());

				// Setze konvertierten Flag-Code als OperatorCountryFlag
				aircraft.setOperatorCountryFlag(flagCodeConverted);
			}
		}
	}

}
