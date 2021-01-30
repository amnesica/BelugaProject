package com.amnesica.belugaproject.services;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.amnesica.belugaproject.config.AppProperties;
import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.entities.Aircraft;

@EnableScheduling
@Service
public class AircraftService {

	@Autowired
	private RangeDataService rangeDataService;
	@Autowired
	private AircraftDataService aircraftDataService;
	@Autowired
	private RegcodeDataService regcodeDataService;
	@Autowired
	private OperatorDataService operatorDataService;
	@Autowired
	private FlightrouteDataService flightrouteDataService;

	// Konfigurationsdatei von AppProperties
	public Configuration configuration = AppProperties.configuration;

	// Networkhandler
	private static final NetworkHandlerService networkHandler = new NetworkHandlerService();

	// Liste mit Flugzeugen (komplett)
	private static List<Aircraft> aircraftList;

	// Liste mit Flugzeugen pro Iteration
	private static List<Aircraft> aircraftListTemp;

	// Liste mit Flugzeugen der vorherigen Iteration,
	// um zu bestimmen, welche Daten für die Statistik abzuspeichern sind
	private static List<Aircraft> previousAircraftList;

	// Liste mit Flugzeugen zum Merken des Trails und der Informationen,
	// sollte das Flugzeug innerhalb von MAX_COUNTER_IN_SECONDS noch einmal
	// auftauchen
	private static List<Aircraft> tempStorageAircraftList;

	// Obergrenze, bis wohin sich ein Flugzeug in tempStorageAircraftList gemerkt
	// wird (40 Minuten) in Sekunden
	private static int MAX_COUNTER_IN_SECONDS = 2400;

	// Url zum Fetchen der Position der ISS
	final static String URL_ISS_POSITION_API = "http://api.open-notify.org/iss-now.json";

	// ISS als besonderes Flugzeug
	private Aircraft iss;

	// Enum mit möglichen Zuständen des Flugzeugs
	private enum AircraftStates {
		UP, DOWN, HOLD, GROUND
	};

	/**
	 * Methode aktualisiert die aircraftList. Wird vom Server alle zwei Sekunden
	 * aufgerufen
	 */
	@Scheduled(fixedRate = 2000)
	private void getAllAircrafts() {
		// Initialisiere die Flugzeug-Listen
		initializeAircraftLists();

		// Entferne alle Flugzeuge aus vorheriger Iteration
		aircraftListTemp.clear();

		// Packe alle Flugzeuge der Iteration in Liste aircraftListTemp
		for (Feeder feeder : configuration.getListFeeder()) {
			getAircraftsFromFeeder(feeder);
		}

		// Aktualisiere komplette aircraftList mit Flugzeugen der Iteration
		updateAircraftList();

		// Speichere Flugzeuge in Statistik
		if (previousAircraftList != null) {
			saveAircraftsInStatistic();

			// Nach dem Speichern entferne alle Flugzeuge aus vorheriger Iteration
			previousAircraftList.clear();
		}

		// Initialisiere Liste mit Flugzeugen aus vorheriger Iteration (nach erstmaligem
		// Holen der Flugzeuge)
		if (previousAircraftList == null) {
			previousAircraftList = new ArrayList<>();
		}

		// Speichere Liste an Flugzeugen für nächste Iteration ab,
		// um zu bestimmen, welche Daten für die Statistik abzuspeichern sind
		previousAircraftList.addAll(aircraftList);

		// Erhöhe Counter der Flugzeuge in temporärer Liste zum Merken der Trails
		increaseCounterTempStorageAircrafts();
	}

	/**
	 * Erhöht die Counter der Flugzeuge in der tempStorageAircraftList und entfernt
	 * solche, deren Counter > MAX_COUNTER_IN_SECONDS ist
	 */
	private void increaseCounterTempStorageAircrafts() {
		ArrayList<Aircraft> aircraftsToBeRemoved = new ArrayList<>();

		if (tempStorageAircraftList != null && !tempStorageAircraftList.isEmpty()) {
			for (Aircraft aircraft : tempStorageAircraftList) {
				// Speichere Flugzeug in aircraftsToBeRemoved, wenn Counter >
				// MAX_COUNTER_IN_SECONDS Sekunden ist, um es aus der Liste zu nehmen, ansonsten
				// erhöhe Counter um 2 (Zwei Sekunden)
				if (aircraft.getCounter() > MAX_COUNTER_IN_SECONDS) {
					aircraftsToBeRemoved.add(aircraft);
				} else {
					aircraft.setCounter(aircraft.getCounter() + 2);
				}
			}
		}

		// Entferne alle Flugzeuge, deren Counter > MAX_COUNTER_IN_SECONDS Sekunden ist
		tempStorageAircraftList.removeAll(aircraftsToBeRemoved);
	}

	/**
	 * Aktualisiert die Liste an Flugzeugen mit Flugzeugen aus der aktuellen
	 * Iteration. Flugzeugen werden entweder hinzugefügt, aktualisiert oder aus der
	 * Liste entfernt, wenn sie nicht mehr vorhanden sind
	 */
	private void updateAircraftList() {
		if (aircraftListTemp != null) {
			ArrayList<Aircraft> aircraftsToBeRemoved = new ArrayList<>();

			for (Aircraft aircraft : aircraftListTemp) {
				// Wenn Flugzeug bereits vorhanden ist -> aktualisiere Felder des bestehenden
				// Flugzeugs
				if (aircraftList.contains(aircraft)) {
					updateAircraftInAircraftList(aircraft);
				} else {
					// Wenn Flugzeug noch nicht vorhanden ist -> packe Flugzeug in Liste und rufe
					// zusätzliche Informationen aus AircraftData-Tabelle ab
					addInformationToAircraft(aircraft);
					aircraftList.add(aircraft);
				}
			}

			// Suche alle Flugzeuge in kompletter Liste, die in dieser Iteration nicht
			// mehr vorhanden sind
			for (Aircraft aircraft : aircraftList) {
				if (!aircraftListTemp.contains(aircraft)) {
					aircraftsToBeRemoved.add(aircraft);

					// Füge nicht mehr vorhandene Flugzeuge in Liste zum Merken des Trails und der
					// Informationen
					tempStorageAircraftList.add(aircraft);
				}
			}

			// Entferne alle Flugzeuge in kompletter Liste, welche in dieser Iteration nicht
			// mehr vorhanden sind
			for (Aircraft aircraft : aircraftsToBeRemoved) {
				aircraftList.remove(aircraft);
			}
		}
	}

	/**
	 * Ruft zusätzliche Informationen aus Datenbank-Tabellen ab
	 * 
	 * @param aircraft Aircraft
	 */
	private void addInformationToAircraft(Aircraft aircraft) {
		aircraftDataService.addAircraftData(aircraft);
		operatorDataService.addOperatorData(aircraft);
		regcodeDataService.addRegcodeData(aircraft);
		flightrouteDataService.addFlightrouteData(aircraft);
	}

	/**
	 * Aktualisiert ein bestehendes Flugzeug aircraftToUpdate aus der Liste
	 * aircraftList durch Werte eines neuen Flugzeugs aircraftNew
	 * 
	 * @param aircraftNew Aircraft
	 */
	private void updateAircraftInAircraftList(Aircraft aircraftNew) {
		// Suche zu aktualisierendes Flugzeug in aircraftList
		Aircraft aircraftToUpdate = aircraftList.get(aircraftList.indexOf(aircraftNew));

		// Merken vorherige Position für nachfolgende Trackberechnung
		double prevLatitude = aircraftToUpdate.getLatitude();
		double prevLongitude = aircraftToUpdate.getLongitude();

		// Aktualisiere Werte
		aircraftToUpdate.setLatitude(aircraftNew.getLatitude());
		aircraftToUpdate.setLongitude(aircraftNew.getLongitude());
		aircraftToUpdate.setAltitude(aircraftNew.getAltitude());
		aircraftToUpdate.setOnGround(aircraftNew.isOnGround());
		aircraftToUpdate.setSpeed(aircraftNew.getSpeed());
		aircraftToUpdate.setVerticalRate(aircraftNew.getVerticalRate());
		aircraftToUpdate.setRssi(aircraftNew.getRssi());
		aircraftToUpdate.setTemperature(aircraftNew.getTemperature());
		aircraftToUpdate.setWindSpeed(aircraftNew.getWindSpeed());
		aircraftToUpdate.setWindFromDirection(aircraftNew.getWindFromDirection());
		aircraftToUpdate.setAutopilotEngaged(aircraftNew.isAutopilotEngaged());
		aircraftToUpdate.setElipsoidalAltitude(aircraftNew.getElipsoidalAltitude());
		aircraftToUpdate.setSelectedQnh(aircraftNew.getSelectedQnh());
		aircraftToUpdate.setSelectedAltitude(aircraftNew.getSelectedAltitude());
		aircraftToUpdate.setSelectedHeading(aircraftNew.getSelectedHeading());
		aircraftToUpdate.setFeeder(aircraftNew.getFeeder());
		aircraftToUpdate.setLastSeen(aircraftNew.getLastSeen());
		aircraftToUpdate.setSource(aircraftNew.getSource());

		// Prüfe bei zu aktualisierenden Werten, ob neue Werte überhaupt gesetzt sind
		if (aircraftNew.getType() != null && !aircraftNew.getType().isEmpty()) {
			aircraftToUpdate.setType(aircraftNew.getType());
		}

		if (aircraftNew.getRegistration() != null && !aircraftNew.getRegistration().isEmpty()
				&& aircraftToUpdate.getRegistration() == null) {
			aircraftToUpdate.setRegistration(aircraftNew.getRegistration());
			regcodeDataService.addRegcodeData(aircraftToUpdate);
		}

		if (aircraftNew.getSquawk() != null && !aircraftNew.getSquawk().isEmpty()) {
			aircraftToUpdate.setSquawk(aircraftNew.getSquawk());
		}

		if (aircraftNew.getFlightId() != null && !aircraftNew.getFlightId().isEmpty()
				&& aircraftToUpdate.getFlightId() == null) {
			aircraftToUpdate.setFlightId(aircraftNew.getFlightId());
			flightrouteDataService.addFlightrouteData(aircraftToUpdate);
			operatorDataService.addOperatorData(aircraftToUpdate);
		}

		if (aircraftNew.getCategory() != null && !aircraftNew.getCategory().isEmpty()) {
			aircraftToUpdate.setCategory(aircraftNew.getCategory());
		}

		if (aircraftNew.getDestination() != null && !aircraftNew.getDestination().isEmpty()) {
			aircraftToUpdate.setDestination(aircraftNew.getDestination());
		}

		if (aircraftNew.getOrigin() != null && !aircraftNew.getOrigin().isEmpty()) {
			aircraftToUpdate.setOrigin(aircraftNew.getOrigin());
		}

		if (aircraftNew.getDistance() != 0) {
			aircraftToUpdate.setDistance(aircraftNew.getDistance());
		}

		// Aktualisiere Trail des Flugzeugs mit neuer Position und Höhe
		aircraftToUpdate.addToTrailPositions(
				new double[] { aircraftNew.getLongitude(), aircraftNew.getLatitude(), aircraftNew.getAltitude() });

		// Track berechnen, wenn nicht vom Feeder geliefert und sich die Position
		// geändert hat
		if (aircraftNew.getTrack() == -1 && prevLatitude != aircraftNew.getLatitude()
				&& prevLongitude != aircraftNew.getLongitude()) {
			aircraftNew.setTrack((int) getAngleBetweenPositions(prevLatitude, prevLongitude, aircraftNew.getLatitude(),
					aircraftNew.getLongitude()));
		}

		aircraftToUpdate.setTrack(aircraftNew.getTrack());

		// Weise Zustand des Flugzeugs zu
		if (!aircraftNew.isOnGround() && aircraftNew.getVerticalRate() != -9999999) {
			if (aircraftNew.getVerticalRate() < -150) {
				aircraftToUpdate.setAircraftState(AircraftStates.DOWN.toString());
			} else if (aircraftNew.getVerticalRate() > 150) {
				aircraftToUpdate.setAircraftState(AircraftStates.UP.toString());
			} else {
				aircraftToUpdate.setAircraftState(AircraftStates.HOLD.toString());
			}
		} else if (aircraftNew.isOnGround()) {
			// Wenn Flugzeug am Boden ist
			aircraftToUpdate.setAircraftState(AircraftStates.GROUND.toString());
		} else {
			// Zustand unbekannt
			aircraftToUpdate.setAircraftState(null);
		}
	}

	/**
	 * Initialisiert die Listen aircraftList, aircraftListTemp und
	 * tempStorageAircraftList
	 */
	private void initializeAircraftLists() {
		if (aircraftList == null) {
			aircraftList = new ArrayList<>();
		}

		if (aircraftListTemp == null) {
			aircraftListTemp = new ArrayList<>();
		}

		if (tempStorageAircraftList == null) {
			tempStorageAircraftList = new ArrayList<>();
		}
	}

	/**
	 * Methode aktualisiert die ISS-Position. Wird vom Server alle zwei Sekunden
	 * aufgerufen
	 */
	@Scheduled(fixedRate = 2000)
	private void getIss() {
		if (configuration.isShowIss()) {
			// Initialisiere ISS, wenn nötig
			if (iss == null) {
				iss = new Aircraft("ISS", 0, 0);
				// Setze weitere Infos über die ISS
				iss.setAltitude(1312336);
				iss.setOperatorCountry("Intl");
				iss.setCategory("B7");
				iss.setFeeder("Open-Notify");
				iss.setFlightId("ISS");
				iss.setHex("ISS");
				iss.setOnGround(false);
				iss.setOperatorName("NASA, Roskosmos, ESA, CSA, JAXA");
				iss.setRegistration("ISS");
				iss.setType("ISS");
				iss.setSpeed(14903);
				iss.setFlightId("Alpha, Station");

				// Setze Flagge der ISS
				String flagCodeConverted = HelperService.convertFlagCodeToHTML("U+1F6F0 U+FE0F");
				iss.setRegCodeNameFlag(flagCodeConverted);
				iss.setRegCodeName("Space");

				// Setze boolean, dass Flugzeug die ISS ist
				iss.setAircraftIsISS(true);
			}

			// Anfrage an Feeder mit url
			String jsonStr = networkHandler.makeServiceCall(URL_ISS_POSITION_API);

			try {
				JSONObject jsonObject = new JSONObject(jsonStr);
				jsonObject = jsonObject.getJSONObject("iss_position");

				// Extrahiere Koordinaten der ISS aus JSON-Daten
				iss.setLongitude(jsonObject.getDouble("longitude"));
				iss.setLatitude(jsonObject.getDouble("latitude"));

				// Setze Trail mit aktueller Position und Höhe
				iss.addToTrailPositions(new double[] { iss.getLongitude(), iss.getLatitude(), iss.getAltitude() });

				// Berechne und setze distance
				double distance = getDistanceBetweenPositions(iss.getLatitude(), iss.getLongitude(),
						configuration.getLatFeeder(), configuration.getLonFeeder());
				iss.setDistance(distance);

			} catch (Exception e) {
				// debug only:
				e.printStackTrace();
				System.out.println("Server: ISS could not be updated");
			}
		}
	}

	/**
	 * Wandelt die Flugzeuge von einer url eines Feeder in ein Aircraft-Objekt um
	 * und fügt dieses der Liste aircraftList hinzu. Dopplungen (selber hex) werden
	 * nicht hinzugefügt.
	 *
	 * @param url url des Feeders
	 */
	private void getAircraftsFromFeeder(Feeder feeder) {
		if (feeder.getIpAdress() != null && !feeder.getIpAdress().isEmpty()) {
			// Anfrage an Feeder mit url
			String jsonStr = networkHandler.makeServiceCall(feeder.getIpAdress());

			try {
				if (jsonStr != null) {
					JSONArray jsonArray;

					// Erstelle jsonArray aus jsonStr vom Feeder
					if (feeder.getType().equals("fr24feeder")) {
						JSONObject jsonObject = new JSONObject(jsonStr);
						jsonArray = jsonObject.getJSONArray("aircraft");
					} else {
						// Wenn type=airsquitter ist
						jsonArray = new JSONArray(jsonStr);
					}

					if (jsonArray != null) {
						for (int i = 0; i < jsonArray.length(); i++) {

							// Extrahiere element aus JSONArray
							JSONObject element = jsonArray.getJSONObject(i);

							// Prüfe, ob element alle Basis-Eigenschaften erfüllt (bspw. 'lat','lon' sind
							// vorhanden)
							if (element != null && element.has("hex") && element.has("lat") && element.has("lon")
									&& !element.isNull("lat") && !element.isNull("lon") && element.getDouble("lat") != 0
									&& element.getDouble("lon") != 0 && element.getDouble("lon") < 90
									&& element.getDouble("lat") < 90) {

								// Erstelle Flugzeug mit minimalen Daten
								Aircraft aircraft = new Aircraft(element.getString("hex").toLowerCase(),
										element.getDouble("lat"), element.getDouble("lon"));

								// Prüfe, ob Flugzeug in der temporären Liste zum Merken der Trails und der
								// Informationen vorhanden ist, wenn ja nehme das Flugzeug aus der Liste mit
								// Trail als das aktuelle Flugzeug
								if (tempStorageAircraftList.contains(aircraft)) {
									// Speichere Index des gefundenen Flugzeugs
									int indexOfAircraftInList = tempStorageAircraftList.indexOf(aircraft);

									// Setze gefundenes Flugzeug als aktuelles Flugzeug
									aircraft = tempStorageAircraftList.get(indexOfAircraftInList);

									// Setze aktuelle Position am gefundenen Flugzeug
									aircraft.setLatitude(element.getDouble("lat"));
									aircraft.setLongitude(element.getDouble("lon"));

									// Setze Counter des Flugzeugs auf 0 zurück, da es wieder zu sehen ist
									aircraft.setCounter(0);

									// Setze Boolean, dass Flugzeug aus der tempStorageAircraftList stammt
									aircraft.setReenteredAircraft(true);

									// Lösche Flugzeug aus tempStorageAircraftList, da es wieder zu sehen ist
									tempStorageAircraftList.remove(indexOfAircraftInList);
								}

								removeDuplicatesInCurrentIteration(aircraft);

								// Double-Wert, ob Flugzeug aus tempStorageAircraftList stammt
								double reeteredAircraftAsDouble = 0;
								if (aircraft.getReenteredAircraft()) {
									reeteredAircraftAsDouble = 1;
								}

								// Setze initialer Trail mit aktueller Position und double-Wert, ob Flugzeug aus
								// tempStorageAircraftList stammt
								aircraft.addToTrailPositions(new double[] { aircraft.getLongitude(),
										aircraft.getLatitude(), aircraft.getAltitude(), reeteredAircraftAsDouble });

								// Setze spezifische Werte der Feeder und Herkunft des Flugzeugs
								setValuesToAircraft(feeder, element, aircraft);

								// Füge neues Flugzeug zur Liste für diese Iteration hinzu
								aircraftListTemp.add(aircraft);
							}
						}
					}
				}
			} catch (Exception e) {
				// debug only:
				e.printStackTrace();
				System.out.println("Server: Temporary aircraft list could not be updated at" + feeder.getIpAdress());
			}
		}
	}

	/**
	 * Setze Werte aus JSON-Element an das Flugzeug basierend auf den Mappings des
	 * jeweiligen Feeders
	 * 
	 * @param feeder   Feeder
	 * @param element  JSONObject
	 * @param aircraft Aircraft
	 */
	private void setValuesToAircraft(Feeder feeder, JSONObject element, Aircraft aircraft) {
		// Setze Name des Feeders als Feeder an das Flugzeug
		aircraft.setFeeder(feeder.getName());

		// Setze weitere Werte
		String altitude = feeder.getMapping().getAltitude();
		if (altitude != null && element.has(altitude) && !element.isNull(altitude)
				&& element.get(altitude) instanceof Integer) {
			aircraft.setAltitude(element.getInt(altitude));

			// Pruefe, ob Flugzeug auf dem Boden ist und setze Altitude auf 0
		} else if (altitude != null && element.has(altitude) && !element.isNull(altitude)
				&& element.get(altitude) instanceof String) {
			aircraft.setOnGround(true);
			aircraft.setAltitude(0);
		}

		String track = feeder.getMapping().getTrack();
		if (track != null && element.has(track) && !element.isNull(track)) {
			aircraft.setTrack(element.getInt(track));
		}

		String type = feeder.getMapping().getType();
		if (type != null && element.has(type) && !element.isNull(type)) {
			aircraft.setType(element.get(type).toString());
		}

		String registration = feeder.getMapping().getRegistration();
		if (registration != null && element.has(registration) && !element.isNull(registration)) {
			aircraft.setRegistration(element.get(registration).toString());
		}

		String category = feeder.getMapping().getCategory();
		if (category != null && element.has(category) && !element.isNull(category)) {
			aircraft.setCategory(element.getString(category));
		}

		String flightId = feeder.getMapping().getFlightId();
		if (flightId != null && element.has(flightId) && !element.isNull(flightId)) {
			aircraft.setFlightId(element.getString(flightId));
		}

		String speed = feeder.getMapping().getSpeed();
		if (speed != null && element.has(speed) && !element.isNull(speed)) {
			aircraft.setSpeed(element.getInt(speed));
		}

		String verticalRate = feeder.getMapping().getVerticalRate();
		if (verticalRate != null && element.has(verticalRate) && !element.isNull(verticalRate)) {
			aircraft.setVerticalRate(element.getInt(verticalRate));
		}

		String temperature = feeder.getMapping().getTemperature();
		if (temperature != null && element.has(temperature) && !element.isNull(temperature)) {
			aircraft.setTemperature(element.getInt(temperature));
		}

		String windSpeed = feeder.getMapping().getWindSpeed();
		if (windSpeed != null && element.has(windSpeed) && !element.isNull(windSpeed)) {
			aircraft.setWindSpeed(element.getInt(windSpeed));
		}

		String windFromDirection = feeder.getMapping().getWindFromDirection();
		if (windFromDirection != null && element.has(windFromDirection) && !element.isNull(windFromDirection)) {
			aircraft.setWindFromDirection(element.getInt(feeder.getMapping().getWindFromDirection()));
		}

		String destination = feeder.getMapping().getDestination();
		if (destination != null && element.has(destination) && !element.isNull(destination)) {
			aircraft.setDestination(element.getString(destination));
		}

		String origin = feeder.getMapping().getOrigin();
		if (origin != null && element.has(origin) && !element.isNull(origin)) {
			aircraft.setOrigin(element.getString(origin));
		}

		String squawk = feeder.getMapping().getSquawk();
		if (squawk != null && element.has(squawk) && !element.isNull(squawk)) {
			aircraft.setSquawk(element.getString(squawk));
		}

		String autopilotEngaged = feeder.getMapping().getAutopilotEngaged();
		if (autopilotEngaged != null && element.has(autopilotEngaged) && !element.isNull(autopilotEngaged)) {
			aircraft.setAutopilotEngaged(element.getBoolean(autopilotEngaged));
		}

		String elipsoidalAltitude = feeder.getMapping().getElipsoidalAltitude();
		if (elipsoidalAltitude != null && element.has(elipsoidalAltitude) && !element.isNull(elipsoidalAltitude)) {
			aircraft.setElipsoidalAltitude(element.getInt(elipsoidalAltitude));
		}

		String selectedQnh = feeder.getMapping().getSelectedQnh();
		if (selectedQnh != null && element.has(selectedQnh) && !element.isNull(selectedQnh)) {
			aircraft.setSelectedQnh(element.getDouble(selectedQnh));
		}

		String selectedAltitude = feeder.getMapping().getSelectedAltitude();
		if (selectedAltitude != null && element.has(selectedAltitude) && !element.isNull(selectedAltitude)) {
			aircraft.setSelectedAltitude(element.getInt(selectedAltitude));
		}

		String selectedHeading = feeder.getMapping().getSelectedHeading();
		if (selectedHeading != null && element.has(selectedHeading) && !element.isNull(selectedHeading)) {
			aircraft.setSelectedHeading(element.getInt(selectedHeading));
		}

		String lastSeen = feeder.getMapping().getLastSeen();
		if (lastSeen != null && element.has(lastSeen)) {
			aircraft.setLastSeen(element.getInt(lastSeen));
		}

		String rssi = feeder.getMapping().getRssi();
		if (rssi != null && element.has(rssi) && !element.isNull(rssi)) {
			aircraft.setRssi(element.getDouble(rssi));
		}

		String source = feeder.getMapping().getSource();
		if (source != null && element.has(source) && !element.isNull(source)) {
			if (feeder.getType().equals("fr24feeder")) {
				JSONArray mlatArray = element.getJSONArray(source);
				if (mlatArray != null && mlatArray.length() > 0) {
					aircraft.setSource("M");
				} else {
					aircraft.setSource("A");
				}
			}
			if (feeder.getType().equals("airsquitter")) {
				aircraft.setSource(element.getString(source));
			}
		}

		// Berechne und setze distance
		double distance = getDistanceBetweenPositions(aircraft.getLatitude(), aircraft.getLongitude(),
				configuration.getLatFeeder(), configuration.getLonFeeder());
		aircraft.setDistance(distance);
	}

	/**
	 * Löscht alle Duplikate aus der aktuellen Iteration, wenn mehrere Feeder ein
	 * Flugzeug empfangen haben
	 * 
	 * @param aircraft Aircraft
	 */
	private void removeDuplicatesInCurrentIteration(Aircraft aircraft) {
		// Zweite Liste zum Löschen um ConcurrentModificationException zu verhindern
		ArrayList<Aircraft> aircraftToRemoveList = new ArrayList<>();

		// Suche anderes Flugzeug von anderen Feeder mit demselben hex in Liste
		// aircraftList (Doppelung)
		for (Aircraft aircraftInListTemp : aircraftListTemp) {
			if (aircraftInListTemp.getHex().equals(aircraft.getHex())) {
				aircraftToRemoveList.add(aircraftInListTemp);
			}
		}

		// Lösche Flugzeuge aus Liste
		if (!aircraftToRemoveList.isEmpty()) {
			for (Aircraft aircraftToRemove : aircraftToRemoveList) {
				aircraftListTemp.remove(aircraftToRemove);
			}
		}
	}

	/**
	 * Methode extrahiert die Flugzeuge, welche in der vorherigen Interation noch
	 * nicht vorhanden waren oder welche in der jetzigen Interation nicht mehr
	 * vorhanden sind und speichert sie in der RangeData-Datenbank
	 */
	private void saveAircraftsInStatistic() {
		if (aircraftList != null && previousAircraftList != null) {
			ArrayList<Aircraft> aircraftsToPutInStatsList = new ArrayList<>();

			// Speichere jedes Flugzeug, welches in der vorherigen Interation noch nicht
			// vorhanden war ab (Kontakt zu Flugzeug wurde hergestellt)
			for (Aircraft aircraft : aircraftList) {
				// Hinweis: Damit "contains" funktioniert, musste in Aircraft die equals-Methode
				// überschrieben, hier sind jetzt zwei Aircrafts gleich, wenn sie denselben
				// hex-Wert haben
				if (!previousAircraftList.contains(aircraft)) {
					aircraftsToPutInStatsList.add(aircraft);
				}
			}

			// Speichere jedes Flugzeug, welches in der jetzigen Interation nicht mehr
			// vorhanden ist ab (Kontakt zu Flugzeug wurde verloren)
			for (Aircraft aircraft : previousAircraftList) {
				if (!aircraftList.contains(aircraft)) {
					aircraftsToPutInStatsList.add(aircraft);
				}
			}

			// Speichere Flugzeuge in RangeData-Datenbank
			rangeDataService.saveRangeData(aircraftsToPutInStatsList);
		}
	}

	/**
	 * Gibt eine Url zu einem Photo des Flugzeugs mit der hex oder mit der
	 * registration zurück. Die registration wird dabei priorisiert.
	 * 
	 * @param hex          String
	 * @param registration String
	 * @return url String
	 */
	public String[] getAircraftPhoto(String hex, String registration) {
		// TODO
		return null;
	}

	/**
	 * Haversine-Formel um die great-circle distance zwischen zwei Punkten zu
	 * berechnen Source: http://www.movable-type.co.uk/scripts/latlong.html
	 * 
	 * @param lat1 latitude of point 1
	 * @param lon1 longitude of point 1
	 * @param lat2 latitude of point 2
	 * @param lon2 longitude of point 2
	 * @return distance
	 */
	private double getDistanceBetweenPositions(double lat1, double lon1, double lat2, double lon2) {
		final double EarthRadius = 6378137.0; // meters
		final double var_1 = (lat1 * Math.PI) / 180.0; // lat1 in radians
		final double var_2 = (lat2 * Math.PI) / 180.0; // lat2 in radians
		final double delta_lat = ((lat2 - lat1) * Math.PI) / 180.0; // delta in radians
		final double delta_lon = ((lon2 - lon1) * Math.PI) / 180.0; // delta in radians

		final double a = Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2)
				+ Math.cos(var_1) * Math.cos(var_2) * Math.sin(delta_lon / 2) * Math.sin(delta_lon / 2);
		final double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		double d = (EarthRadius * c) / 1000; // distance

		DecimalFormat df = new DecimalFormat("#####.0");

		double distanceInKm = Double.parseDouble(df.format(d).replace(",", "."));

		return distanceInKm;
	}

	/**
	 * Berechne den Winkel zwischen zwei Positionen Source:
	 * https://stackoverflow.com/questions/9614109/how-to-calculate-an-angle-from-points
	 * 
	 * @param lat1 latitude of point 1
	 * @param lon1 longitude of point 1
	 * @param lat2 latitude of point 2
	 * @param lon2 longitude of point 2
	 * @return angle (in degrees)
	 */
	private double getAngleBetweenPositions(double lat1, double lon1, double lat2, double lon2) {
		double a = Math.atan2(lon2 - lon1, lat2 - lat1);

		if (a < 0) { // Winkel in radians
			a += 2 * Math.PI; // verhindere negativen Winkel
		}

		double ad = a * 180 / Math.PI; // konvertiere zu Grad

		DecimalFormat df = new DecimalFormat("#####.0");
		double angle = Double.parseDouble(df.format(ad).replace(",", "."));

		return angle;
	}

	/**
	 * Öffentliche Methode zum Abfragen der Liste an Flugzeugen des Servers
	 * 
	 * @return List<Aircraft>
	 */
	public List<Aircraft> getAircraftList() {
		return aircraftList;
	}

	/**
	 * Gibt die ISS als JSON-Objekt zurück
	 * 
	 * @return Aircraft (space craft)
	 */
	public Aircraft getIssPosition() {
		return iss;
	}

	/**
	 * Gibt die Konfigurationsdatei zurück. Damit IPs nicht preisgegeben werden,
	 * wird diese vorher noch bearbeitet
	 * 
	 * @return Configuration
	 */
	public Configuration getConfiguration() {
		Configuration configToFrontEnd = null;

		if (configuration != null) {
			configToFrontEnd = new Configuration(configuration.getLatFeeder(), configuration.getLonFeeder(),
					configuration.getAmountFeeder(), configuration.isShowIss(), configuration.getScaleIcons(),
					configuration.getCircleDistancesInNm());

			// Setze Liste an Feedern und entferne dabei ipAdresse
			for (Feeder feeder : configuration.getListFeeder()) {
				Feeder feederToAdd = new Feeder(feeder.getName(), feeder.getType(), null, feeder.getColor());
				configToFrontEnd.addFeederToList(feederToAdd);
			}
		}

		return configToFrontEnd;
	}
}
