package com.amnesica.belugaproject.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.entities.Aircraft;
import com.amnesica.belugaproject.entities.AirportData;
import com.amnesica.belugaproject.entities.CountryData;
import com.amnesica.belugaproject.entities.FlightrouteData;
import com.amnesica.belugaproject.entities.OperatorData;
import com.amnesica.belugaproject.entities.RangeData;
import com.amnesica.belugaproject.entities.RegcodeData;
import com.amnesica.belugaproject.services.AircraftService;
import com.amnesica.belugaproject.services.AirportDataService;
import com.amnesica.belugaproject.services.CountryDataService;
import com.amnesica.belugaproject.services.FlightrouteDataService;
import com.amnesica.belugaproject.services.OperatorDataService;
import com.amnesica.belugaproject.services.RangeDataService;
import com.amnesica.belugaproject.services.RegcodeDataService;

@RestController
@CrossOrigin
public class Controller {

	@Autowired
	private AircraftService aircraftService;
	@Autowired
	private AirportDataService airportDataService;
	@Autowired
	private CountryDataService countryDataService;
	@Autowired
	private FlightrouteDataService flightrouteDataService;
	@Autowired
	private OperatorDataService operatorDataService;
	@Autowired
	private RegcodeDataService regcodeDataService;
	@Autowired
	private RangeDataService rangeDataService;

	/**
	 * Gibt die Konfiguration mit nötigen Variablen zurück, die aus den
	 * Konfigurationsdateien stammt
	 * 
	 * @return Configuration
	 */
	@GetMapping(value = "/getConfigurationData", produces = "application/json")
	public @ResponseBody Configuration getConfigurationData() {
		return aircraftService.getConfiguration();
	}

	/**
	 * Gibt die Flugzeug-Liste für den Client zurück.
	 * 
	 * @return List<Aircraft>
	 */
	@GetMapping(value = "/getAircraftList", produces = "application/json")
	public @ResponseBody List<Aircraft> getAircraftList() {
		return aircraftService.getAircraftList();
	}

	/**
	 * Gibt die Position der ISS zurück für den Client zurück
	 * 
	 * @return Aircraft
	 */
	@GetMapping(value = "/getIss", produces = "application/json")
	public @ResponseBody Aircraft getIss() {
		return aircraftService.getIssPosition();
	}

	/**
	 * Gibt Links zum Foto eines Flugzeugs und zur Website mit diesem Foto durch
	 * Angabe seiner hex oder seiner registration zurück
	 * 
	 * @param hex          String
	 * @param registration String
	 * @return String[]
	 */
	@GetMapping(value = "/getAircraftPhoto", produces = "application/json")
	public @ResponseBody String[] getAircraftPhoto(@RequestParam(value = "hex") String hex,
			@RequestParam(value = "registration") String registration) {
		return aircraftService.getAircraftPhoto(hex, registration);
	}

	/**
	 * Gibt weitere Informationen zum Flughafen durch Aufruf der AirportData-Table
	 * zurück
	 * 
	 * @param ident String
	 * @return AirportData
	 */
	@GetMapping(value = "/getAirportData", produces = "application/json")
	public @ResponseBody AirportData getAirportData(@RequestParam(value = "ident") String ident) {
		return airportDataService.getAirportData(ident);
	}

	/**
	 * Gibt weitere Informationen zu einem Land durch Aufruf der CountryData-Table
	 * zurück
	 * 
	 * @param countryIso2letter String
	 * @return CountryData
	 */
	@GetMapping(value = "/getCountryData", produces = "application/json")
	public @ResponseBody CountryData getCountryData(
			@RequestParam(value = "countryIso2letter") String countryIso2letter) {
		return countryDataService.getCountryData(countryIso2letter);
	}

	/**
	 * Gibt weitere Informationen zu einer Flugroute durch Aufruf der
	 * FlightrouteData-Table zurück
	 * 
	 * @param flightId String
	 * @return FlightrouteData
	 */
	@GetMapping(value = "/getFlightrouteData", produces = "application/json")
	public @ResponseBody FlightrouteData getFlightrouteData(@RequestParam(value = "flightId") String flightId) {
		return flightrouteDataService.getFlightrouteData(flightId);
	}

	/**
	 * Gibt weitere Informationen zu einem Operator durch Aufruf der
	 * OperatorData-Table zurück
	 * 
	 * @param operatorIcao String
	 * @return OperatorData
	 */
	@GetMapping(value = "/getOperatorData", produces = "application/json")
	public @ResponseBody OperatorData getOperatorData(@RequestParam(value = "operatorIcao") String operatorIcao) {
		return operatorDataService.getOperatorData(operatorIcao);
	}

	/**
	 * Gibt weitere Informationen zu einem Regcode durch Aufruf der
	 * RegcodeData-Table zurück
	 * 
	 * @param regcodePrefix String
	 * @return RegcodeData
	 */
	@GetMapping(value = "/getRegcodeData", produces = "application/json")
	public @ResponseBody RegcodeData getRegcodeData(@RequestParam(value = "regcodePrefix") String regcodePrefix) {
		return regcodeDataService.getRegcodeData(regcodePrefix);
	}

	/**
	 * Gibt alle Informationen aus der RangeData-Tabelle zurück
	 * 
	 * @return List<RangeData>
	 */
	@GetMapping(value = "/getAllRangeData", produces = "application/json")
	public @ResponseBody List<RangeData> getAllRangeData() {
		return rangeDataService.getAllRangeData();
	}

	/**
	 * Gibt alle Informationen aus der RangeData-Tabelle für eine bestimmte
	 * Zeitspanne zurück
	 * 
	 * @param startTime Startzeit
	 * @param endTime   Endzeit
	 * @return List<RangeData>
	 */
	@GetMapping(value = "/getRangeDataBetweenTimestamps", produces = "application/json")
	public @ResponseBody List<RangeData> getRangeDataBetweenTimestamps(
			@RequestParam(value = "startTime") long startTime, @RequestParam(value = "endTime") long endTime) {
		return rangeDataService.getRangeDataBetweenTimestamps(startTime, endTime);
	}
}
