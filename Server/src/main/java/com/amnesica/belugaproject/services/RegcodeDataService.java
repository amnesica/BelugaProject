package com.amnesica.belugaproject.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amnesica.belugaproject.entities.Aircraft;
import com.amnesica.belugaproject.entities.RegcodeData;
import com.amnesica.belugaproject.repositories.RegcodeDataRepository;

@Service
public class RegcodeDataService {

	@Autowired
	private RegcodeDataRepository regcodeDataRepository;

	/**
	 * Gibt alle Informationen über einen Registrierungs-Code mit Angabe des
	 * regCode-Prefixes aus der Datenbank zurück
	 * 
	 * @param regcodePrefix
	 * @return regcodeData
	 */
	public RegcodeData getRegcodeData(String regcodePrefix) {
		RegcodeData regcodeData = null;

		if (regcodePrefix != null && !regcodePrefix.isEmpty() && !regcodePrefix.equals("null")) {
			// Hole Daten aus Datenbank mit Angabe des Registration-Prefixes (bspw. "D-")

			try {
				regcodeData = regcodeDataRepository.findByRegcodePrefix(regcodePrefix);
			} catch (Exception e) {
				System.out.println("Error Server - DB error on reading Regcode_Data for RegcodePrefix " + regcodePrefix
						+ ": Exception = " + e);
			}
		}

		return regcodeData;
	}

	public String getRegcodePrefix(String registration) {
		String regcodePrefix = null;
		int pos = -1;

		// Ermitteln Position des Bindestrichs innerhalb der Registration, z. B. bei
		// D-AIMA
		pos = registration.indexOf("-");

		// Meistens trennt der Bindestrich den Prefix vom Rest, aber es gibt Ausnahmen
		try {

			if (registration.substring(0, 1).equals("N")) {
				regcodePrefix = "N";
			} else if (registration.substring(0, 2).equals("HL")) {
				regcodePrefix = "HL";
			} else if (registration.substring(0, 2).equals("JA")) {
				regcodePrefix = "JA";
			} else if (registration.substring(0, 4).equals("SU-Y")) {
				regcodePrefix = "SU-Y";
			} else if (registration.substring(0, 3).equals("VP-")) {
				regcodePrefix = registration.substring(0, 4);
			} else if (registration.substring(0, 3).equals("VQ-")) {
				regcodePrefix = registration.substring(0, 4);
			} else if (pos != -1) {
				regcodePrefix = registration.substring(0, pos + 1);
			}

		} catch (Exception e) {
			// handle exception
			System.out.println(
					"Error Server: Exception in getRegcodePrefix during registration " + registration + ": " + e);
		}

		return regcodePrefix;
	}

	/**
	 * Fügt zusätzliche Informationen zur Registrierung aus Datenbank-Tabellen hinzu
	 * 
	 * @param aircraft Aircraft
	 */
	public void addRegcodeData(Aircraft aircraft) {

		// Lese Regcode-Data hinzu
		if (aircraft.getRegistration() != null && !aircraft.getRegistration().isEmpty()) {

			// aus der Registrierung (z. B. "D-AIMA") den Prefix ("D-")ermitteln und mit
			// diesem dann die Dasten lesen
			RegcodeData regcodeData = getRegcodeData(getRegcodePrefix(aircraft.getRegistration()));

			if (regcodeData != null && regcodeData.getRegcodeName() != null
					&& !regcodeData.getRegcodeName().isEmpty()) {
				aircraft.setRegCodeName(regcodeData.getRegcodeName());

				// Konvertiere Flagge in HTML-verarbeitbaren String, damit dieser richtig
				// angezeigt wird
				String flagCodeConverted = HelperService.convertFlagCodeToHTML(regcodeData.getRegcodeFlagUtf8code());
				aircraft.setRegCodeNameFlag(flagCodeConverted);
			}
		}

	}

}
