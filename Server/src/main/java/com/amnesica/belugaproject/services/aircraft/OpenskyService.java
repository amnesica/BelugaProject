package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.config.FeederMapping;
import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.OpenskyAircraft;
import com.amnesica.belugaproject.entities.data.AirportData;
import com.amnesica.belugaproject.repositories.aircraft.OpenskyAircraftRepository;
import com.amnesica.belugaproject.services.data.AircraftDataService;
import com.amnesica.belugaproject.services.data.AirportDataService;
import com.amnesica.belugaproject.services.helper.HelperService;
import com.amnesica.belugaproject.services.helper.NetworkHandlerService;
import com.amnesica.belugaproject.services.helper.Request;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Slf4j
@EnableScheduling
@Service
public class OpenskyService {
    @Autowired
    private AircraftService aircraftService;
    @Autowired
    private NetworkHandlerService networkHandler;
    @Autowired
    private AircraftDataService aircraftDataService;
    @Autowired
    private AirportDataService airportDataService;
    @Autowired
    private OpenskyAircraftRepository openskyAircraftRepository;
    @Autowired
    private Configuration configuration;

    // Feeder für das Opensky-Network
    private Feeder openskyFeeder;

    // Queue mit Anfragen an Opensky
    private final BlockingQueue<Request> requestQueueOpensky = new LinkedBlockingQueue<>();

    // Url zum Fetchen der Daten von Opensky
    private static final String URL_OPENSKY_LIVE_API = "https://opensky-network.org/api/states/all?";

    /**
     * Ruft die Rohdaten als JSONArray vom Opensky-Network ab
     *
     * @param lomin lower bound for the longitude in decimal degrees
     * @param lamin lower bound for the latitude in decimal degrees
     * @param lomax upper bound for the longitude in decimal degrees
     * @param lamax upper bound for the latitude in decimal degrees
     * @return JSONArray
     */
    public JSONArray getDataFromOpensky(double lomin, double lamin, double lomax, double lamax) {
        // Array mit konvertierten Daten von Opensky
        JSONArray jsonArray = null;

        // Genriere URL mit Daten der Bounding-Box vom Frontend
        final String url = URL_OPENSKY_LIVE_API + "lamin=" + lamin + "&lomin=" + lomin + "&lamax=" + lamax + "&lomax="
                + lomax;

        // Anfrage an Opensky mit url und Credentials
        String jsonStr = networkHandler.makeOpenskyServiceCall(url, configuration.getOpenskyUsername(), configuration.getOpenskyPassword());

        try {
            if (jsonStr != null) {
                JSONObject jsonObject = new JSONObject(jsonStr);
                // Hinweis: jsonArray ist ein Array aus Arrays
                // und muss daher für weitere Bearbeitung konvertiert werden
                JSONArray jsonArrayStates = jsonObject.getJSONArray("states");
                if (jsonArrayStates != null) {
                    jsonArray = convertJsonArrayToArrayOfObjects(jsonArrayStates);
                } else {
                    throw new Exception();
                }
            }
        } catch (Exception e) {
            log.error(
                    "Server: Data from Opensky-Network could not get fetched or there are no planes in this area. Url: "
                            + url);
        }

        return jsonArray;
    }

    /**
     * Konvertiert ein JSONArray aus Arrays in ein JSONArray aus JSONObjects
     *
     * @param jsonArray JSONArray
     * @return JSONArray
     */
    private JSONArray convertJsonArrayToArrayOfObjects(JSONArray jsonArray) {
        JSONArray arrayWithObjects = new JSONArray();
        Double conversionValueDouble;

        if (jsonArray == null) {
            return null;
        }

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONArray innerArray = jsonArray.getJSONArray(i);

            if (innerArray != null) {
                JSONObject innerObject = new JSONObject();
                innerObject.put("hex", innerArray.get(0));
                innerObject.put("flightId", innerArray.get(1));
                innerObject.put("onGround", innerArray.get(8));
                innerObject.put("squawk", innerArray.get(14));
                innerObject.put("source", innerArray.get(16));

                if (innerArray.get(5) instanceof BigDecimal) {
                    innerObject.put("lon", innerArray.getDouble(5));
                } else {
                    innerObject.put("lon", innerArray.get(5));
                }

                if (innerArray.get(6) instanceof BigDecimal) {
                    innerObject.put("lat", innerArray.getDouble(6));
                } else {
                    innerObject.put("lat", innerArray.get(6));
                }

                if (innerArray.get(10) instanceof BigDecimal) {
                    innerObject.put("track", innerArray.getDouble(10));
                } else {
                    innerObject.put("track", innerArray.get(10));
                }

                // OpenSky liefert metrische Werte, deshalb Konvertierung in nautical erforderlich
                if (innerArray.get(7) instanceof Integer) {
                    conversionValueDouble = HelperService.convertMeter2Foot(((int) innerArray.get(7)));
                    innerObject.put("elipsoidalAltitude", conversionValueDouble);
                } else if (innerArray.get(7) instanceof Double || innerArray.get(7) instanceof BigDecimal) {
                    conversionValueDouble = HelperService.convertMeter2Foot(innerArray.getDouble(7));
                    innerObject.put("elipsoidalAltitude", conversionValueDouble);
                } else {
                    innerObject.put("elipsoidalAltitude", innerArray.get(7));
                }

                if (innerArray.get(13) instanceof Integer) {
                    conversionValueDouble = HelperService.convertMeter2Foot(((int) innerArray.get(13)));
                    innerObject.put("altitude", conversionValueDouble);
                } else if (innerArray.get(13) instanceof Double || innerArray.get(13) instanceof BigDecimal) {
                    conversionValueDouble = HelperService.convertMeter2Foot(innerArray.getDouble(13));
                    innerObject.put("altitude", conversionValueDouble);
                } else {
                    innerObject.put("altitude", innerArray.get(13));
                }

                if (innerArray.get(9) instanceof Integer) {
                    conversionValueDouble = HelperService.convertMeterPerSec2KilometersPerHour(((int) innerArray.get(9)));
                    conversionValueDouble = HelperService.convertKilometer2Nmile(conversionValueDouble);
                    innerObject.put("speed", conversionValueDouble);
                } else if (innerArray.get(9) instanceof Double || innerArray.get(9) instanceof BigDecimal) {
                    conversionValueDouble = HelperService.convertMeterPerSec2KilometersPerHour(innerArray.getDouble(9));
                    conversionValueDouble = HelperService.convertKilometer2Nmile(conversionValueDouble);
                    innerObject.put("speed", conversionValueDouble);
                } else {
                    innerObject.put("speed", innerArray.get(9));
                }

                if (innerArray.get(11) instanceof Integer) {
                    conversionValueDouble = HelperService.convertMeterPerSec2FootPerMin(((int) innerArray.get(11)));
                    innerObject.put("verticalRate", conversionValueDouble);
                } else if (innerArray.get(11) instanceof Double || innerArray.get(11) instanceof BigDecimal) {
                    conversionValueDouble = HelperService.convertMeterPerSec2FootPerMin(innerArray.getDouble(11));
                    innerObject.put("verticalRate", conversionValueDouble);
                } else {
                    innerObject.put("verticalRate", innerArray.get(11));
                }

                // Füge innerObject zu arrayWithObjects hinzu
                arrayWithObjects.put(innerObject);
            }
        }
        return arrayWithObjects;
    }

    /**
     * Erstellt einen Feeder für das Opensky-Network
     *
     * @return Feeder
     */
    public Feeder createOpenskyFeeder() {
        // Erstelle Feeder Opensky
        Feeder feeder = new Feeder("Opensky", null, "Opensky", "yellow");

        // Erstelle Mapping
        FeederMapping mapping = new FeederMapping();
        mapping.setHex("hex");
        mapping.setLatitude("latitude");
        mapping.setLongitude("longitude");
        mapping.setAltitude("altitude");
        mapping.setTrack("track");
        mapping.setOnGround("onGround");
        mapping.setSpeed("speed");
        mapping.setSquawk("squawk");
        mapping.setFlightId("flightId");
        mapping.setVerticalRate("verticalRate");
        mapping.setAutopilotEngaged("autopilotEngaged");
        mapping.setElipsoidalAltitude("elipsoidalAltitude");
        mapping.setFeeder("feeder");
        mapping.setSource("source");

        // Setze Mapping
        feeder.setMapping(mapping);

        return feeder;
    }

    /**
     * Methode ruft Flugzeuge innerhalb des Extents in arrayOpenskyExtent vom
     * Opensky-Network ab und speichert Flugzeuge in der Tabelle opensky_aircraft.
     * Methode wird alle INTERVAL_UPDATE_OPENSKY Sekunden abgerufen. Abruf wird
     * jedoch nur durchgeführt, wenn das arrayOpenskyExtent-Array mit Werten gefüllt
     * ist (dieses wird nur bei einer Anfrage vom Frontend gefüllt). Hinweis: Das
     * Abruf-Intervall ist auf 10 Sekunden gesetzt, da für nicht-registrierte Nutzer
     * nur alle 10 Sekunden die Daten von Opensky aktualisiert werden können
     */
    @Scheduled(fixedRate = StaticValues.INTERVAL_UPDATE_OPENSKY)
    private void getPlanesFromOpensky() {

        // Hole Request aus queue. Wenn kein Request vorhanden ist, wird null zurückgegeben
        Request request = requestQueueOpensky.poll();

        if (request == null) {
            return;
        }

        // Suche und extrahiere den neuesten Request der IP-Addresse
        final Request copyRequest = request;
        Optional<Request> requestNewest = requestQueueOpensky.stream()
                .filter(r -> r.getIpAddressClient().equals(copyRequest.getIpAddressClient()) &&
                        r.getTimestamp() > copyRequest.getTimestamp()).max(Comparator.comparing(Request::getTimestamp));

        if (requestNewest.isPresent()) {
            // Ersetze ursprünglich gepollten Request durch neueren Request
            request = requestNewest.get();

            // Lösche alle bisherigen Requests derjenigen Ip-Adressse, welche älter sind als der herausgenommene Request
            requestQueueOpensky.removeIf(r -> r.getTimestamp() < requestNewest.get().getTimestamp() && r.getIpAddressClient().equals(copyRequest.getIpAddressClient()));
        }

        // Validiere Request
        if (request.getLomin() == null || request.getLamin() == null || request.getLomax() == null
                || request.getLamax() == null) {
            log.error("Opensky: Request " + request + " is is not valid. Nothing to do");
            return;
        }

        JSONArray jsonArrayFromOpensky;

        // Hole Flugzeuge als JSONArray vom Opensky-Network
        jsonArrayFromOpensky = getDataFromOpensky(request.getLomin(), request.getLamin(), request.getLomax(),
                request.getLamax());

        // Initialisiere Feeder, wenn nötig
        if (openskyFeeder == null) {
            openskyFeeder = createOpenskyFeeder();
        }

        if (jsonArrayFromOpensky != null) {
            for (int i = 0; i < jsonArrayFromOpensky.length(); i++) {

                // Extrahiere element aus JSONArray
                JSONObject element = jsonArrayFromOpensky.getJSONObject(i);

                // Prüfe, ob element alle Basis-Eigenschaften erfüllt (bspw. 'lat','lon' sind
                // vorhanden)
                if (element != null && element.has("hex") && element.has("lat") && element.has("lon")
                        && !element.isNull("lat") && !element.isNull("lon") && element.getDouble("lat") != 0
                        && element.getDouble("lon") != 0) {

                    // Erstelle aus Daten des Feeders ein neues Flugzeug
                    OpenskyAircraft aircraftNew = aircraftService.createNewOpenskyAircraft(element, openskyFeeder);

                    // Aktualisiere Flugzeug aus Datenbank oder
                    // füge neues Flugzeug zur Datenbank hinzu
                    if (openskyAircraftRepository.existsById(aircraftNew.getHex())) {

                        // Prüfe, ob Flugzeug in Datenbank-Tabelle enthalten ist
                        OpenskyAircraft aircraftInDb = openskyAircraftRepository.findByHex(aircraftNew.getHex());

                        // Lösche Feeder-Liste und Source-Liste, damit nach der Iteration nur die Feeder
                        // und die Sources in der Liste stehen, welche das Flugzeug geupdated haben
                        aircraftInDb.clearFeederList();
                        aircraftInDb.clearSourceList();

                        // Update Werte des Flugzeugs mit Werten von aircraftNew
                        aircraftService.updateValuesOfAircraft(aircraftInDb, aircraftNew, openskyFeeder, false);

                        try {
                            // Schreibe Flugzeug in OpenskyAircraft-Tabelle
                            openskyAircraftRepository.save(aircraftInDb);
                        } catch (Exception e) {
                            log.error("Server - DB error when writing opensky aircraftNew for hex "
                                    + aircraftNew.getHex() + ": Exception = " + e);
                        }

                    } else {
                        // Füge Informationen aus aircraftData hinzu
                        aircraftDataService.addAircraftData(aircraftNew);

                        // Setze Boolean, dass Flugzeug von Opensky ist
                        aircraftNew.setIsFromOpensky(true);

                        // Füge Timestamp als Zeitpunkt des letzten Updates an
                        aircraftNew.setLastUpdate(System.currentTimeMillis());

                        try {
                            // Schreibe Flugzeug in OpenskyAircraft-Tabelle
                            openskyAircraftRepository.save(aircraftNew);
                        } catch (Exception e) {
                            log.error("Server - DB error when writing new opensky aircraftNew for hex "
                                    + aircraftNew.getHex() + ": Exception = " + e);
                        }
                    }
                }
            }
        }
    }

    /**
     * Methode entfernt alte Flugzeuge aus der opensky_aircraft-Tabelle. Methode
     * wird alle INTERVAL_REMOVE_OLD_PLANES_OPENSKY Sekunden aufgerufen
     */
    @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_PLANES_OPENSKY)
    private void removeOldPlanes() {
        long startTime = System.currentTimeMillis() - StaticValues.INTERVAL_REMOVE_OLD_PLANES_OPENSKY;

        // Hole Flugzeuge der aktuellen Iteration
        List<OpenskyAircraft> listPlanesNotUpdated = openskyAircraftRepository
                .findAllByLastUpdateLessThanEqual(startTime);

        if (listPlanesNotUpdated != null) {
            // Lösche alle betroffenen Flugzeuge aus der OpenskyAircraft-Tabelle
            openskyAircraftRepository.deleteAll(listPlanesNotUpdated);
        }
    }

    /**
     * Methode gibt alle Flugzeuge innerhalb eines Extents aus der Tabelle
     * opensky_aircraft zurück
     *
     * @param lomin lower bound for the longitude in decimal degrees
     * @param lamin lower bound for the latitude in decimal degrees
     * @param lomax upper bound for the longitude in decimal degrees
     * @param lamax upper bound for the latitude in decimal degrees
     * @return List<OpenskyAircraft>
     */
    public List<OpenskyAircraft> getOpenskyPlanesWithinExtent(double lomin, double lamin, double lomax,
                                                              double lamax) {
        List<OpenskyAircraft> listAircraftRaw = null;

        try {
            listAircraftRaw = openskyAircraftRepository.findAllWithinExtent(lomin, lamin, lomax, lamax);

        } catch (Exception e) {
            log.error("Server - DB error when fetching Opensky planes from db : Exception = " + e);
        }

        return listAircraftRaw;
    }

    /**
     * Sucht alle Informationen über ein Flugzeug (OpenskyAircraft) zusammen und
     * gibt diese zurück. Hinweis: Diese Funktion funktioniert nur für ein Flugzeug
     * der Klasse OpenskyAircraft
     *
     * @param hex          String
     * @param registration String
     * @return Object[] (OpenskyAircraft-Objekt, AirportData originAirportData,
     * AirportData destinationAirportData)
     */
    public Object[] getAllAircraftData(String hex, String registration) {
        if (hex != null && registration != null && !hex.isEmpty() && !registration.isEmpty()) {
            // Hole Flugzeug aus Datenbank
            OpenskyAircraft aircraft = openskyAircraftRepository.findByHex(hex);

            if (aircraft != null) {
                // Setze Photo-Url
                aircraftService.setAircraftPhotoUrls(aircraft);

                // Setze weitere Informationen an Flugzeug
                aircraftService.addInformationToAircraft(aircraft);

                // Hole Informationen über Herkunfts- und Zielflughafen
                AirportData originAirportData = null;
                AirportData destinationAirportData = null;
                if (aircraft.getOrigin() != null && !aircraft.getOrigin().isEmpty()) {
                    originAirportData = airportDataService.getAirportData(aircraft.getOrigin());
                }
                if (aircraft.getDestination() != null && !aircraft.getDestination().isEmpty()) {
                    destinationAirportData = airportDataService.getAirportData(aircraft.getDestination());
                }

                // Speichere Flugzeug in Datenbank
                try {
                    openskyAircraftRepository.save(aircraft);
                } catch (Exception e) {
                    log.error("Server - DB error when saving aircraft : Exception = " + e);
                }

                // Baue Array als Rückgabewert
                return new Object[]{aircraft, originAirportData, destinationAirportData};
            }
        }

        return null;
    }

    /**
     * Fügt einen neuen Request zur Queue für Opensky-Anfragen hinzu
     */
    public void addRequest(Request request) {
        requestQueueOpensky.add(request);
    }
}
