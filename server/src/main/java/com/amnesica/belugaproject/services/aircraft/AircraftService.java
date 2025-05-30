package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.aircraft.RemoteAircraft;
import com.amnesica.belugaproject.services.data.AirportDataService;
import com.amnesica.belugaproject.services.data.FlightrouteDataService;
import com.amnesica.belugaproject.services.data.OperatorDataService;
import com.amnesica.belugaproject.services.data.RegcodeDataService;
import com.amnesica.belugaproject.services.helper.HelperService;
import com.amnesica.belugaproject.services.network.NetworkHandlerService;
import com.amnesica.belugaproject.services.trails.AircraftTrailService;
import com.amnesica.belugaproject.utility.Utility;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Calendar;

@Slf4j
@Service
public class AircraftService {
  @Autowired
  private RegcodeDataService regcodeDataService;
  @Autowired
  private AirportDataService airportDataService;
  @Autowired
  private OperatorDataService operatorDataService;
  @Autowired
  private FlightrouteDataService flightrouteDataService;

  @Autowired
  private AircraftTrailService aircraftTrailService;

  @Autowired
  private Configuration configuration;

  // Networkhandler
  private static final NetworkHandlerService networkHandler = new NetworkHandlerService();

  // Record mit Informationen von der Planespotters.net API
  record PlanespottersResponse(String thumbnailLargeUrl, String linkToWebsiteUrl, String photographer) {
  }

  /**
   * Erstellt ein neues Flugzeug (Aircraft)
   *
   * @param jsonObject JSONObject
   * @param feeder     Feeder
   * @return Aircraft
   */
  public Aircraft createNewAircraft(JSONObject jsonObject, Feeder feeder) {
    Aircraft aircraftNew;

    final String hexMapping = feeder.getMapping().getHex();
    final String latMapping = feeder.getMapping().getLatitude();
    final String lonMapping = feeder.getMapping().getLongitude();

    if (hexMapping == null || latMapping == null || lonMapping == null) return null;

    aircraftNew = new Aircraft(jsonObject.getString(hexMapping).toLowerCase().trim());
    if (Utility.jsonFieldExists(jsonObject, latMapping))
      aircraftNew.setLatitude(jsonObject.getDouble(latMapping));
    if (Utility.jsonFieldExists(jsonObject, lonMapping))
      aircraftNew.setLongitude(jsonObject.getDouble(lonMapping));

    // Message with position
    aircraftNew.setSendWithPos(Utility.jsonFieldExists(jsonObject, latMapping) && Utility.jsonFieldExists(jsonObject, lonMapping));

    // Only for adsbx
    setPosFromAdsbxLastPosWhenNeeded(jsonObject, feeder, latMapping, lonMapping, aircraftNew);

    setValuesToAircraft(feeder, jsonObject, aircraftNew);

    return aircraftNew;
  }

  private static void setPosFromAdsbxLastPosWhenNeeded(JSONObject jsonObject, Feeder feeder, String latMapping, String lonMapping, Aircraft aircraftNew) {
    if (feeder.getType().equals("adsbx") &&
        !Utility.jsonFieldExists(jsonObject, latMapping) &&
        !Utility.jsonFieldExists(jsonObject, lonMapping) &&
        Utility.jsonFieldExists(jsonObject, "lastPosition")) {
      final JSONObject lastPosition = jsonObject.getJSONObject("lastPosition");
      aircraftNew.setLatitude(lastPosition.getDouble(latMapping));
      aircraftNew.setLongitude(lastPosition.getDouble(lonMapping));
    }
  }

  /**
   * Erstellt ein neues Remote-Flugzeug (von Opensky oder Airplanes-Live)
   *
   * @param aircraft JSONObject
   * @param feeder   Feeder
   * @return OpenskyAircraft
   */
  public RemoteAircraft createNewRemoteAircraft(JSONObject aircraft, Feeder feeder) {
    // Erstelle Flugzeug
    RemoteAircraft aircraftNew = new RemoteAircraft(aircraft.getString("hex").toLowerCase().trim(),
        aircraft.getDouble("lat"), aircraft.getDouble("lon"));

    aircraftNew.setIsFromRemote(feeder.getName());

    // Setze spezifische Werte der Feeder
    setValuesToAircraft(feeder, aircraft, aircraftNew);

    return aircraftNew;
  }

  /**
   * Ruft zusätzliche Informationen aus Datenbank-Tabellen ab
   *
   * @param aircraft Aircraft
   */
  public void addInformationToAircraft(AircraftSuperclass aircraft) {
    operatorDataService.addOperatorData(aircraft);
    regcodeDataService.addRegcodeData(aircraft);
    flightrouteDataService.addFlightrouteData(aircraft);
  }

  /**
   * Aktualisiert ein bestehendes Flugzeug aircraftToUpdate durch Werte eines
   * neuen Flugzeugs aircraftNew
   *
   * @param aircraftNew Aircraft
   */
  public void updateValuesOfAircraft(AircraftSuperclass aircraftToUpdate, AircraftSuperclass aircraftNew,
                                     String feederName, boolean isLocalFeederService) {
    // Merken vorherige Position für nachfolgende Trackberechnung
    Double prevLatitude = aircraftToUpdate.getLatitude();
    Double prevLongitude = aircraftToUpdate.getLongitude();
    Integer prevTrack = aircraftToUpdate.getTrack();

    if (isLocalFeederService) {
      // Setze 'reentered'-Zustand, damit später eine schwarze Linie gezeichnet wird
      boolean isAircraftReentered = aircraftTrailService.getIsReenteredAircraft(aircraftToUpdate.getHex(),
          feederName);
      aircraftToUpdate.setReenteredAircraft(isAircraftReentered);
      aircraftNew.setReenteredAircraft(isAircraftReentered);
    }

    // Aktualisiere Werte von aircraftNew
    aircraftToUpdate.setLatitude(aircraftNew.getLatitude());
    aircraftToUpdate.setLongitude(aircraftNew.getLongitude());
    aircraftToUpdate.setSendWithPos(aircraftNew.getSendWithPos());
    aircraftToUpdate.setAltitude(aircraftNew.getAltitude());
    aircraftToUpdate.setOnGround(aircraftNew.getOnGround());
    aircraftToUpdate.setSpeed(aircraftNew.getSpeed());
    aircraftToUpdate.setVerticalRate(aircraftNew.getVerticalRate());
    aircraftToUpdate.setRssi(aircraftNew.getRssi());
    aircraftToUpdate.setTemperature(aircraftNew.getTemperature());
    aircraftToUpdate.setWindSpeed(aircraftNew.getWindSpeed());
    aircraftToUpdate.setWindFromDirection(aircraftNew.getWindFromDirection());
    aircraftToUpdate.setAutopilotEngaged(aircraftNew.getAutopilotEngaged());
    aircraftToUpdate.setElipsoidalAltitude(aircraftNew.getElipsoidalAltitude());
    aircraftToUpdate.setSelectedQnh(aircraftNew.getSelectedQnh());
    aircraftToUpdate.setSelectedAltitude(aircraftNew.getSelectedAltitude());
    aircraftToUpdate.setSelectedHeading(aircraftNew.getSelectedHeading());
    aircraftToUpdate.setLastSeenPos(aircraftNew.getLastSeenPos());
    aircraftToUpdate.setSourceCurrentFeeder(aircraftNew.getSourceCurrentFeeder());
    aircraftToUpdate.setRoll(aircraftNew.getRoll());
    aircraftToUpdate.setIas(aircraftNew.getIas());
    aircraftToUpdate.setTas(aircraftNew.getTas());
    aircraftToUpdate.setMach(aircraftNew.getMach());
    aircraftToUpdate.setMagHeading(aircraftNew.getMagHeading());
    aircraftToUpdate.setTrueHeading(aircraftNew.getTrueHeading());
    aircraftToUpdate.setMessages(aircraftNew.getMessages());
    aircraftToUpdate.setEmergency(aircraftNew.getEmergency());
    aircraftToUpdate.setNavModes(aircraftNew.getNavModes());

    // Schreibe aktuellen Feeder als Feeder in Liste
    if (!aircraftToUpdate.getFeederList().contains(feederName)) {
      aircraftToUpdate.addFeederToFeederList(feederName);
    }

    // Schreibe aktuellen Feeder und dessen Source in Liste
    aircraftToUpdate.addSourceToSourceList(feederName);

    // Prüfe bei zu aktualisierenden Werten, ob neue Werte überhaupt gesetzt sind
    if (aircraftNew.getType() != null && !aircraftNew.getType().isEmpty()) {
      aircraftToUpdate.setType(aircraftNew.getType().trim());
    }

    if (aircraftNew.getRegistration() != null && !aircraftNew.getRegistration().isEmpty()
        && aircraftToUpdate.getRegistration() == null) {
      aircraftToUpdate.setRegistration(aircraftNew.getRegistration().trim());
    }

    if (aircraftNew.getSquawk() != null && !aircraftNew.getSquawk().isEmpty()) {
      aircraftToUpdate.setSquawk(aircraftNew.getSquawk());
    }

    if (aircraftNew.getFlightId() != null && !aircraftNew.getFlightId().isEmpty()
        && aircraftToUpdate.getFlightId() == null) {
      aircraftToUpdate.setFlightId(aircraftNew.getFlightId().trim());

      if (isLocalFeederService) {
        flightrouteDataService.addFlightrouteData(aircraftToUpdate);
        operatorDataService.addOperatorData(aircraftToUpdate);
      }
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

    if (aircraftNew.getDistance() != null && aircraftNew.getDistance() != 0) {
      aircraftToUpdate.setDistance(aircraftNew.getDistance());
    }

    if (isLocalFeederService) {
      // Aktualisiere Trail des Flugzeugs mit neuer Position und Höhe
      aircraftTrailService.addTrail(aircraftToUpdate, feederName);
    }

    // Track berechnen, wenn nicht vom Feeder geliefert und sich die Position geändert hat
    if (prevLatitude != null && prevLongitude != null &&
        aircraftNew.getLatitude() != null && aircraftNew.getLongitude() != null && aircraftNew.getTrack() == null &&
        !prevLatitude.equals(aircraftNew.getLatitude()) && !prevLongitude.equals(aircraftNew.getLongitude())) {
      aircraftNew.setTrack((int) HelperService.getAngleBetweenPositions(prevLatitude, prevLongitude,
          aircraftNew.getLatitude(), aircraftNew.getLongitude()));
    } else if (aircraftNew.getTrack() == null) {
      aircraftNew.setTrack(prevTrack);
    }

    aircraftToUpdate.setTrack(aircraftNew.getTrack());

    // Weise Zustand des Flugzeugs zu
    if (aircraftNew.getOnGround() != null && !aircraftNew.getOnGround() && aircraftNew.getVerticalRate() != null) {
      if (aircraftNew.getVerticalRate() < -150) {
        aircraftToUpdate.setAircraftState(AircraftStates.DOWN.toString());
      } else if (aircraftNew.getVerticalRate() > 150) {
        aircraftToUpdate.setAircraftState(AircraftStates.UP.toString());
      } else {
        aircraftToUpdate.setAircraftState(AircraftStates.HOLD.toString());
      }
    } else if (aircraftNew.getOnGround() != null && aircraftNew.getOnGround()) {
      // Wenn Flugzeug am Boden ist
      aircraftToUpdate.setAircraftState(AircraftStates.GROUND.toString());
    } else {
      // Zustand unbekannt
      aircraftToUpdate.setAircraftState(null);
    }

    // Füge Timestamp als Zeitpunkt des letzten Updates an
    aircraftToUpdate.setLastUpdate(System.currentTimeMillis());
  }

  /**
   * Setze Werte aus JSON-Element an das Flugzeug basierend auf den Mappings des
   * jeweiligen Feeders
   *
   * @param feeder     Feeder
   * @param jsonObject JSONObject
   * @param aircraft   Aircraft
   */
  private void setValuesToAircraft(Feeder feeder, JSONObject jsonObject, AircraftSuperclass aircraft) {
    // Füge Feeder in Liste der Feeder hinzu
    aircraft.addFeederToFeederList(feeder.getName());

    // Setze Mapping-Werte
    final String altitude = feeder.getMapping().getAltitude();
    final String track = feeder.getMapping().getTrack();
    final String type = feeder.getMapping().getType();
    final String registration = feeder.getMapping().getRegistration();
    final String category = feeder.getMapping().getCategory();
    final String flightId = feeder.getMapping().getFlightId();
    final String speed = feeder.getMapping().getSpeed();
    final String verticalRate = feeder.getMapping().getVerticalRate();
    final String temperature = feeder.getMapping().getTemperature();
    final String windSpeed = feeder.getMapping().getWindSpeed();
    final String windFromDirection = feeder.getMapping().getWindFromDirection();
    final String destination = feeder.getMapping().getDestination();
    final String origin = feeder.getMapping().getOrigin();
    final String squawk = feeder.getMapping().getSquawk();
    final String autopilotEngaged = feeder.getMapping().getAutopilotEngaged();
    final String elipsoidalAltitude = feeder.getMapping().getElipsoidalAltitude();
    final String selectedQnh = feeder.getMapping().getSelectedQnh();
    final String selectedAltitude = feeder.getMapping().getSelectedAltitude();
    final String selectedHeading = feeder.getMapping().getSelectedHeading();
    final String lastSeenPos = feeder.getMapping().getLastSeen();
    final String rssi = feeder.getMapping().getRssi();
    final String source = feeder.getMapping().getSource();
    final String roll = feeder.getMapping().getRoll();
    final String ias = feeder.getMapping().getIas();
    final String tas = feeder.getMapping().getTas();
    final String mach = feeder.getMapping().getMach();
    final String magHeading = feeder.getMapping().getMagHeading();
    final String trueHeading = feeder.getMapping().getTrueHeading();
    final String messages = feeder.getMapping().getMessages();
    final String emergency = feeder.getMapping().getEmergency();
    final String navModes = feeder.getMapping().getNavModes();

    // Setze Werte nach Mapping
    if (Utility.jsonFieldExists(jsonObject, altitude) && jsonObject.get(altitude) instanceof Integer) {
      aircraft.setAltitude(jsonObject.getInt(altitude));
      aircraft.setOnGround(false);
    } else if (Utility.jsonFieldExists(jsonObject, altitude) && jsonObject.get(altitude) instanceof Double) {
      aircraft.setAltitude((int) jsonObject.getDouble(altitude));
      aircraft.setOnGround(false);
      // Pruefe, ob Flugzeug auf dem Boden ist und setze Altitude auf 0
    } else if (Utility.jsonFieldExists(jsonObject, altitude) && jsonObject.get(altitude) instanceof String) {
      aircraft.setOnGround(true);
      aircraft.setAltitude(0);
      // Prüfe, ob asdbx-Feeder baro_alt hat, aber nicht geom_alt,
      // setze elipsoidalAltitude als altitude (verhindert schwarze Marker!)
    } else if (feeder.getType().equals("adsbx") && !Utility.jsonFieldExists(jsonObject, altitude) &&
        Utility.jsonFieldExists(jsonObject, elipsoidalAltitude) &&
        jsonObject.get(elipsoidalAltitude) instanceof Integer) {
      aircraft.setOnGround(false);
      aircraft.setAltitude(jsonObject.getInt(elipsoidalAltitude));
    }

    if (Utility.jsonFieldExists(jsonObject, track)) {
      aircraft.setTrack(jsonObject.getInt(track));
    }

    if (Utility.jsonFieldExists(jsonObject, roll)) {
      aircraft.setRoll(jsonObject.getDouble(roll));
    }

    if (Utility.jsonFieldExists(jsonObject, type)) {
      aircraft.setType(jsonObject.get(type).toString().trim());
    }

    if (Utility.jsonFieldExists(jsonObject, registration)) {
      aircraft.setRegistration(jsonObject.get(registration).toString().trim());
    }

    if (Utility.jsonFieldExists(jsonObject, category)) {
      aircraft.setCategory(jsonObject.getString(category));
    }

    if (Utility.jsonFieldExists(jsonObject, flightId)) {
      aircraft.setFlightId(jsonObject.getString(flightId).trim());
    }

    if (Utility.jsonFieldExists(jsonObject, speed)) {
      aircraft.setSpeed(jsonObject.getInt(speed));
    }

    if (Utility.jsonFieldExists(jsonObject, verticalRate)) {
      aircraft.setVerticalRate(jsonObject.getInt(verticalRate));
    }

    if (Utility.jsonFieldExists(jsonObject, temperature)) {
      aircraft.setTemperature(jsonObject.getInt(temperature));
    }

    if (Utility.jsonFieldExists(jsonObject, windSpeed)) {
      aircraft.setWindSpeed(jsonObject.getInt(windSpeed));
    }

    if (Utility.jsonFieldExists(jsonObject, windFromDirection)) {
      aircraft.setWindFromDirection(jsonObject.getInt(windFromDirection));
    }

    // Virtual Radar Server liefert Origin/Destination im Format IATA-Code plus Airportbezeichnung
    // Nur der IATA-Code wird extrahiert und über die Datenbank nach ICAO gemappt
    if (feeder.getType().equals("vrs") && Utility.jsonFieldExists(jsonObject, destination)) {
      String iataCode = jsonObject.getString(destination).substring(0, 3);
      String icaoCode = airportDataService.getAirportIcaoCode(iataCode);
      if (icaoCode != null) {
        jsonObject.put(destination, icaoCode);
        aircraft.setDestination(jsonObject.getString(destination));
      }
    } else {
      if (Utility.jsonFieldExists(jsonObject, destination)) {
        aircraft.setDestination(jsonObject.getString(destination));
      }
    }
    if (feeder.getType().equals("vrs") && Utility.jsonFieldExists(jsonObject, origin)) {
      String iataCode = jsonObject.getString(origin).substring(0, 3);
      String icaoCode = airportDataService.getAirportIcaoCode(iataCode);
      if (icaoCode != null) {
        jsonObject.put(origin, icaoCode);
        aircraft.setOrigin(jsonObject.getString(origin));
      }
    } else {
      if (Utility.jsonFieldExists(jsonObject, origin)) {
        aircraft.setOrigin(jsonObject.getString(origin));
      }
    }

    if (Utility.jsonFieldExists(jsonObject, squawk)) {
      aircraft.setSquawk(jsonObject.getString(squawk));
    }

    if (Utility.jsonFieldExists(jsonObject, autopilotEngaged)) {
      aircraft.setAutopilotEngaged(jsonObject.getBoolean(autopilotEngaged));
    }

    if (Utility.jsonFieldExists(jsonObject, elipsoidalAltitude)
        && jsonObject.get(elipsoidalAltitude) instanceof Integer) {
      aircraft.setElipsoidalAltitude(jsonObject.getInt(elipsoidalAltitude));
    } else if (Utility.jsonFieldExists(jsonObject, elipsoidalAltitude)
        && jsonObject.get(elipsoidalAltitude) instanceof String) {
      // Wenn adsbx-Feeder "ground" sendet
      aircraft.setAltitude(0);
      aircraft.setElipsoidalAltitude(0);
      aircraft.setOnGround(true);
    }

    if (Utility.jsonFieldExists(jsonObject, selectedQnh)) {
      aircraft.setSelectedQnh(jsonObject.getDouble(selectedQnh));
    }

    if (Utility.jsonFieldExists(jsonObject, selectedAltitude)) {
      aircraft.setSelectedAltitude(jsonObject.getInt(selectedAltitude));
    }

    if (Utility.jsonFieldExists(jsonObject, selectedHeading)) {
      aircraft.setSelectedHeading(jsonObject.getInt(selectedHeading));
    }

    if (Utility.jsonFieldExists(jsonObject, lastSeenPos)) {
      aircraft.setLastSeenPos(jsonObject.getInt(lastSeenPos));
    }

    if (Utility.jsonFieldExists(jsonObject, rssi)) {
      aircraft.setRssi(jsonObject.getDouble(rssi));
    }

    if (Utility.jsonFieldExists(jsonObject, ias)) {
      aircraft.setIas(jsonObject.getInt(ias));
    }

    if (Utility.jsonFieldExists(jsonObject, tas)) {
      aircraft.setTas(jsonObject.getInt(tas));
    }

    if (Utility.jsonFieldExists(jsonObject, mach)) {
      aircraft.setMach(jsonObject.getDouble(mach));
    }

    if (Utility.jsonFieldExists(jsonObject, magHeading)) {
      aircraft.setMagHeading(jsonObject.getDouble(magHeading));
    }

    if (Utility.jsonFieldExists(jsonObject, trueHeading)) {
      aircraft.setTrueHeading(jsonObject.getDouble(trueHeading));
    }

    if (Utility.jsonFieldExists(jsonObject, messages)) {
      aircraft.setMessages(jsonObject.getInt(messages));
    }

    if (Utility.jsonFieldExists(jsonObject, emergency)) {
      aircraft.setEmergency(jsonObject.getString(emergency));
    }

    if (Utility.jsonFieldExists(jsonObject, navModes)) {
      JSONArray navModesArray = jsonObject.getJSONArray(navModes);
      if (navModesArray != null && !navModesArray.isEmpty()) {
        String navModesString = navModesArray.toString();
        navModesString = navModesString.replace("[", "");
        navModesString = navModesString.replace("]", "");
        navModesString = navModesString.replaceAll("\"", "");
        aircraft.setNavModes(navModesString);
        aircraft.setAutopilotEngaged(true);
      }
    }

    addSourceToAircraft(feeder, jsonObject, aircraft, source);

    boolean positionExists = aircraft.getLatitude() != null && aircraft.getLongitude() != null;
    if (positionExists) {
      double distance = HelperService.getDistanceBetweenPositions(aircraft.getLatitude(), aircraft.getLongitude(),
          configuration.getLatFeeder(), configuration.getLonFeeder());
      aircraft.setDistance(distance);
    }

    setAircraftState(aircraft);
  }

  private static void addSourceToAircraft(Feeder feeder, JSONObject element, AircraftSuperclass aircraft, String source) {
    if (source != null && element.has(source) && !element.isNull(source)) {
      if (feeder.getType().equals("fr24feeder")) {
        JSONArray mlatArray = element.getJSONArray(source);
        if (mlatArray != null && mlatArray.length() > 0) {
          aircraft.setSourceCurrentFeeder("M");
        } else {
          aircraft.setSourceCurrentFeeder("A");
        }
      }
      if (feeder.getType().equals("airsquitter")) {
        aircraft.setSourceCurrentFeeder(element.getString(source));
      }

      // Füge source zur Liste der Quellen hinzu
      aircraft.addSourceToSourceList(feeder.getName());
    }
    if (feeder.getType().equals("adsbx")) {
      if (source != null && element.has(source) && !element.isNull(source)) {
        String type = element.getString("type");
        aircraft.setSourceCurrentFeeder(getShortTypeFromType(type));
        aircraft.addSourceToSourceList(feeder.getName());
      } else {
        if (element.has("mlat") && !element.isNull("mlat") && !element.getJSONArray("mlat").isEmpty()) {
          aircraft.setSourceCurrentFeeder("M");
          aircraft.addSourceToSourceList(feeder.getName());
        }
      }
    }
  }

  private static String getShortTypeFromType(String type) {
    String finalType = null;
    if (type.contains("adsb")) {
      finalType = "A";
    } else if (type.contains("mlat")) {
      finalType = "M";
    } else if (type.contains("adsc")) {
      finalType = "C";
    } else if (type.contains("mode")) {
      finalType = "S";
    }
    return finalType;
  }

  /**
   * Setzt den Zustand des Flugzeugs
   *
   * @param aircraft AircraftSuperclass
   */
  public void setAircraftState(AircraftSuperclass aircraft) {
    if (aircraft.getOnGround() != null && !aircraft.getOnGround() && aircraft.getVerticalRate() != null) {
      if (aircraft.getVerticalRate() < -150) {
        aircraft.setAircraftState(AircraftStates.DOWN.toString());
      } else if (aircraft.getVerticalRate() > 150) {
        aircraft.setAircraftState(AircraftStates.UP.toString());
      } else {
        aircraft.setAircraftState(AircraftStates.HOLD.toString());
      }
    } else if (aircraft.getOnGround() != null && aircraft.getOnGround()) {
      // Wenn Flugzeug am Boden ist
      aircraft.setAircraftState(AircraftStates.GROUND.toString());
    } else {
      // Zustand unbekannt
      aircraft.setAircraftState(null);
    }
  }

  /**
   * Setzt Flugzeug-Photo, Link zur Website mit dem Photo und dem
   * Photographen von planespotters.net. Wird nichts gefunden, wird
   * eine Url zur Bildersuche von Startpage gesetzt
   */
  public void setAircraftPhotoUrls(AircraftSuperclass aircraft) {
    if (aircraft == null) {
      return;
    }

    String url;
    PlanespottersResponse planespottersResponse;

    // Hole Photo-Urls von planespotters.net
    planespottersResponse = getUrlsFromPlanespotters(aircraft.getHex());

    if (planespottersResponse == null) {
      // Baue Link für Startpage-Bildersuche
      url = buildStartpagePhotoUrl(aircraft.getHex(), aircraft.getRegistration());

      // Setze Link für Suchergebnisse
      aircraft.setUrlPhotoWebsite(url);

      // Setze Information, dass Suche bereits stattfand
      aircraft.setUrlPhotoDirect("noPhotoFound");
    } else {
      // Setze Daten von planespotters.net
      aircraft.setUrlPhotoDirect(planespottersResponse.thumbnailLargeUrl());
      aircraft.setUrlPhotoWebsite(planespottersResponse.linkToWebsiteUrl());
      aircraft.setPhotoPhotographer(planespottersResponse.photographer());
    }
  }

  /**
   * Gibt einen Link zur Bildersuche von Startpage mit der registration
   * oder der hex zurück (registration wird dabei priorisiert)
   *
   * @return String
   */
  private String buildStartpagePhotoUrl(String hex, String registration) {
    // Hole Url für Suchmaschinenergebnisse aus Configuration
    String searchEngineUrl = configuration.getSearchEngineUrl();

    // Prüfe, ob Platzhalter in Url vorhanden ist
    if (!searchEngineUrl.contains("<PLACEHOLDER>")) {
      return null;
    }

    // Baue Link zu Startpage-Suchergebnissen für aircraft
    if (registration != null && !registration.isEmpty() && !registration.equals("null")) {
      // Ersetze Leerstellen in der Registration mit "+", wenn militärische
      // Registrierungen falsch übermittelt wurden
      if (registration.contains(" ")) {
        registration = registration.replace(" ", "+").trim();
      }

      // Ersetze Platzhalter in Url mit registration
      return searchEngineUrl.replace("<PLACEHOLDER>", "\"" + registration + "\"");
    } else if (hex != null && !hex.isEmpty() && !hex.equals("null")) {
      hex = hex.trim();

      // Ersetze Platzhalter in Url mit hex
      return searchEngineUrl.replace("<PLACEHOLDER>", "\"" + hex + "\"");
    }
    return null;
  }

  /**
   * Fragt Daten mit der hex bei planespotters.net an. Methode gibt die Url zum
   * Flugzeug-Photo, dem Link zur Website mit dem Photo sowie den Photographen
   * in einem Record zurück. Wenn Fehler auftreten oder nichts gefunden wird,
   * wird null zurückgegeben
   *
   * @return PlanespottersResponse
   */
  private PlanespottersResponse getUrlsFromPlanespotters(String hex) {
    if (hex == null || hex.isEmpty() || hex.equals("null")) {
      return null;
    }

    final String query = "https://api.planespotters.net/pub/photos/hex/" + hex.trim();
    PlanespottersResponse response = null;

    // Anfrage an planespotters
    String jsonStr = networkHandler.makeServiceCall(query);

    try {
      if (jsonStr != null) {
        JSONObject jsonObject = new JSONObject(jsonStr);
        JSONArray photosArray = jsonObject.getJSONArray("photos");

        if (photosArray.length() > 0) {
          JSONObject photosObject = photosArray.getJSONObject(0);

          String thumbnailLargeUrl = photosObject.getJSONObject("thumbnail_large").getString("src");
          String linkToWebsiteUrl = photosObject.getString("link");
          String photographer = photosObject.getString("photographer");

          response = new PlanespottersResponse(thumbnailLargeUrl, linkToWebsiteUrl, photographer);
        }
      }
    } catch (Exception e) {
      log.info("Server: Error consuming photo urls from planespotters.net. Query: " + query);
    }

    return response;
  }

  /**
   * Berechnet und setzt das Alter eines Flugzeugs
   *
   * @param aircraft AircraftSuperclass
   * @param built    String with format YYYY-01-01
   */
  public void calcAndSetAge(AircraftSuperclass aircraft, String built) {
    int builtYear = built.length() > 4 ? Integer.parseInt(built.substring(0, 4)) : Integer.parseInt(built);
    int year = Calendar.getInstance().get(Calendar.YEAR);
    int age = year - builtYear;
    aircraft.setAge(age);
  }
}
