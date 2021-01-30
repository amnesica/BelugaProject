package com.amnesica.belugaproject.services;

public class HelperService {

	/**
	 * Konvertiert einen Flaggen-Code aus UTF8 in HTML-verarbeitbaren String, damit
	 * dieser richtig angezeigt wird
	 * 
	 * @param flagCode UTF8
	 * @return String
	 */
	public static String convertFlagCodeToHTML(String flagCode) {
		flagCode = flagCode.replaceAll(" ", ";");
		flagCode = flagCode.replaceAll("U\\+", "&#x");
		return flagCode;
	}
}
