package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.aircraft.OpenskyAircraft;
import com.amnesica.belugaproject.services.data.FlightrouteDataService;
import com.amnesica.belugaproject.services.data.OperatorDataService;
import com.amnesica.belugaproject.services.data.RegcodeDataService;
import com.amnesica.belugaproject.services.helper.HelperService;
import com.amnesica.belugaproject.services.helper.NetworkHandlerService;
import com.amnesica.belugaproject.services.trails.AircraftTrailService;
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
     * @param element JSONObject
     * @param feeder  Feeder
     * @return Aircraft
     */
    public Aircraft createNewAircraft(JSONObject element, Feeder feeder) {
        // Erstelle Flugzeug
        Aircraft aircraftNew = new Aircraft(element.getString("hex").toLowerCase().trim(), element.getDouble("lat"),
                element.getDouble("lon"));

        // Setze spezifische Werte der Feeder
        setValuesToAircraft(feeder, element, aircraftNew);

        return aircraftNew;
    }

    /**
     * Erstellt ein neues Flugzeug (OpenskyAircraft)
     *
     * @param element JSONObject
     * @param feeder  Feeder
     * @return OpenskyAircraft
     */
    public OpenskyAircraft createNewOpenskyAircraft(JSONObject element, Feeder feeder) {
        // Erstelle Flugzeug
        OpenskyAircraft aircraftNew = new OpenskyAircraft(element.getString("hex").toLowerCase().trim(),
                element.getDouble("lat"), element.getDouble("lon"));

        // Setze spezifische Werte der Feeder
        setValuesToAircraft(feeder, element, aircraftNew);

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
                                       Feeder feeder, boolean isLocalFeederService) {
        // Merken vorherige Position für nachfolgende Trackberechnung
        double prevLatitude = aircraftToUpdate.getLatitude();
        double prevLongitude = aircraftToUpdate.getLongitude();
        Integer prevTrack = aircraftToUpdate.getTrack();

        if (isLocalFeederService) {
            // Setze 'reentered'-Zustand, damit später eine schwarze Linie gezeichnet wird
            boolean isAircraftReentered = aircraftTrailService.getIsReenteredAircraft(aircraftToUpdate.getHex(),
                    feeder.getName());
            aircraftToUpdate.setReenteredAircraft(isAircraftReentered);
            aircraftNew.setReenteredAircraft(isAircraftReentered);
        }

        // Aktualisiere Werte von aircraftNew
        aircraftToUpdate.setLatitude(aircraftNew.getLatitude());
        aircraftToUpdate.setLongitude(aircraftNew.getLongitude());
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
        aircraftToUpdate.setLastSeen(aircraftNew.getLastSeen());
        aircraftToUpdate.setSourceCurrentFeeder(aircraftNew.getSourceCurrentFeeder());

        // Schreibe aktuellen Feeder als Feeder in Liste
        if (!aircraftToUpdate.getFeederList().contains(feeder.getName())) {
            aircraftToUpdate.addFeederToFeederList(feeder.getName());
        }

        // Schreibe aktuellen Feeder und dessen Source in Liste
        aircraftToUpdate.addSourceToSourceList(feeder.getName());

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

        if (aircraftNew.getDistance() != 0) {
            aircraftToUpdate.setDistance(aircraftNew.getDistance());
        }

        if (isLocalFeederService) {
            // Aktualisiere Trail des Flugzeugs mit neuer Position und Höhe
            aircraftTrailService.addTrail(aircraftNew, feeder.getName());
        }

        // Track berechnen, wenn nicht vom Feeder geliefert und sich die Position
        // geändert hat
        if (aircraftNew.getTrack() == null && prevLatitude != aircraftNew.getLatitude()
                && prevLongitude != aircraftNew.getLongitude()) {
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
     * @param feeder   Feeder
     * @param element  JSONObject
     * @param aircraft Aircraft
     */
    private void setValuesToAircraft(Feeder feeder, JSONObject element, AircraftSuperclass aircraft) {
        // Füge Feeder in Liste der Feeder hinzu
        aircraft.addFeederToFeederList(feeder.getName());

        // Setze Mapping-Werte
        String altitude = feeder.getMapping().getAltitude();
        String track = feeder.getMapping().getTrack();
        String type = feeder.getMapping().getType();
        String registration = feeder.getMapping().getRegistration();
        String category = feeder.getMapping().getCategory();
        String flightId = feeder.getMapping().getFlightId();
        String speed = feeder.getMapping().getSpeed();
        String verticalRate = feeder.getMapping().getVerticalRate();
        String temperature = feeder.getMapping().getTemperature();
        String windSpeed = feeder.getMapping().getWindSpeed();
        String windFromDirection = feeder.getMapping().getWindFromDirection();
        String destination = feeder.getMapping().getDestination();
        String origin = feeder.getMapping().getOrigin();
        String squawk = feeder.getMapping().getSquawk();
        String autopilotEngaged = feeder.getMapping().getAutopilotEngaged();
        String elipsoidalAltitude = feeder.getMapping().getElipsoidalAltitude();
        String selectedQnh = feeder.getMapping().getSelectedQnh();
        String selectedAltitude = feeder.getMapping().getSelectedAltitude();
        String selectedHeading = feeder.getMapping().getSelectedHeading();
        String lastSeen = feeder.getMapping().getLastSeen();
        String rssi = feeder.getMapping().getRssi();
        String source = feeder.getMapping().getSource();

        // Setze Werte nach Mapping
        if (altitude != null && element.has(altitude) && !element.isNull(altitude)
                && element.get(altitude) instanceof Integer) {
            aircraft.setAltitude(element.getInt(altitude));
            aircraft.setOnGround(false);
        } else if (altitude != null && element.has(altitude) && !element.isNull(altitude)
                && element.get(altitude) instanceof Double) {
            aircraft.setAltitude((int) element.getDouble(altitude));
            aircraft.setOnGround(false);
            // Pruefe, ob Flugzeug auf dem Boden ist und setze Altitude auf 0
        } else if (altitude != null && element.has(altitude) && !element.isNull(altitude)
                && element.get(altitude) instanceof String) {
            aircraft.setOnGround(true);
            aircraft.setAltitude(0);
            // Prüfe, ob asdbx-Feeder baro_alt hat, aber nicht geom_alt,
            // setze elipsoidalAltitude als altitude (verhindert schwarze Marker!)
        } else if (feeder.getType().equals("adsbx") && altitude != null && !element.has(altitude) &&
                elipsoidalAltitude != null && element.has(elipsoidalAltitude) && !element.isNull(elipsoidalAltitude) &&
                element.get(elipsoidalAltitude) instanceof Integer) {
            aircraft.setOnGround(false);
            aircraft.setAltitude(element.getInt(elipsoidalAltitude));
        }

        if (track != null && element.has(track) && !element.isNull(track)) {
            aircraft.setTrack(element.getInt(track));
        }

        if (type != null && element.has(type) && !element.isNull(type)) {
            aircraft.setType(element.get(type).toString().trim());
        }

        if (registration != null && element.has(registration) && !element.isNull(registration)) {
            aircraft.setRegistration(element.get(registration).toString().trim());
        }

        if (category != null && element.has(category) && !element.isNull(category)) {
            aircraft.setCategory(element.getString(category));
        }

        if (flightId != null && element.has(flightId) && !element.isNull(flightId)) {
            aircraft.setFlightId(element.getString(flightId).trim());
        }

        if (speed != null && element.has(speed) && !element.isNull(speed)) {
            aircraft.setSpeed(element.getInt(speed));
        }

        if (verticalRate != null && element.has(verticalRate) && !element.isNull(verticalRate)) {
            aircraft.setVerticalRate(element.getInt(verticalRate));
        }

        if (temperature != null && element.has(temperature) && !element.isNull(temperature)) {
            aircraft.setTemperature(element.getInt(temperature));
        }

        if (windSpeed != null && element.has(windSpeed) && !element.isNull(windSpeed)) {
            aircraft.setWindSpeed(element.getInt(windSpeed));
        }

        if (windFromDirection != null && element.has(windFromDirection) && !element.isNull(windFromDirection)) {
            aircraft.setWindFromDirection(element.getInt(feeder.getMapping().getWindFromDirection()));
        }

        if (destination != null && element.has(destination) && !element.isNull(destination)) {
            aircraft.setDestination(element.getString(destination));
        }

        if (origin != null && element.has(origin) && !element.isNull(origin)) {
            aircraft.setOrigin(element.getString(origin));
        }

        if (squawk != null && element.has(squawk) && !element.isNull(squawk)) {
            aircraft.setSquawk(element.getString(squawk));
        }

        if (autopilotEngaged != null && element.has(autopilotEngaged) && !element.isNull(autopilotEngaged)) {
            aircraft.setAutopilotEngaged(element.getBoolean(autopilotEngaged));
        }

        if (elipsoidalAltitude != null && element.has(elipsoidalAltitude) && !element.isNull(elipsoidalAltitude)
                && element.get(elipsoidalAltitude) instanceof Integer) {
            aircraft.setElipsoidalAltitude(element.getInt(elipsoidalAltitude));
        } else if (elipsoidalAltitude != null && element.has(elipsoidalAltitude) && !element.isNull(elipsoidalAltitude)
                && element.get(elipsoidalAltitude) instanceof String) {
            // Wenn adsbx-Feeder "ground" sendet
            aircraft.setAltitude(0);
            aircraft.setElipsoidalAltitude(0);
            aircraft.setOnGround(true);
        }

        if (selectedQnh != null && element.has(selectedQnh) && !element.isNull(selectedQnh)) {
            aircraft.setSelectedQnh(element.getDouble(selectedQnh));
        }

        if (selectedAltitude != null && element.has(selectedAltitude) && !element.isNull(selectedAltitude)) {
            aircraft.setSelectedAltitude(element.getInt(selectedAltitude));
        }

        if (selectedHeading != null && element.has(selectedHeading) && !element.isNull(selectedHeading)) {
            aircraft.setSelectedHeading(element.getInt(selectedHeading));
        }

        if (lastSeen != null && element.has(lastSeen)) {
            aircraft.setLastSeen(element.getInt(lastSeen));
        }

        if (rssi != null && element.has(rssi) && !element.isNull(rssi)) {
            aircraft.setRssi(element.getDouble(rssi));
        }

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

        // Berechne und setze distance
        double distance = HelperService.getDistanceBetweenPositions(aircraft.getLatitude(), aircraft.getLongitude(),
                configuration.getLatFeeder(), configuration.getLonFeeder());
        aircraft.setDistance(distance);

        // Zustand des Flugzeugs
        setAircraftState(aircraft);
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
