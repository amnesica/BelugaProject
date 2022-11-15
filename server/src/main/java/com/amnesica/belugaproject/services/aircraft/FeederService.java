package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.aircraft.OpenskyAircraft;
import com.amnesica.belugaproject.services.data.MapCatToShapeDataService;
import com.amnesica.belugaproject.services.data.MapTypeToShapeDataService;
import com.amnesica.belugaproject.services.data.ShapeDataService;
import com.amnesica.belugaproject.services.helper.Request;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.*;

@Slf4j
@Service
public class FeederService {
    @Autowired
    private LocalFeederService localFeederService;
    @Autowired
    private OpenskyService openskyService;
    @Autowired
    private SpacecraftService spacecraftService;

    @Autowired
    private MapCatToShapeDataService mapCatToShapeDataService;
    @Autowired
    private MapTypeToShapeDataService mapTypeToShapeDataService;
    @Autowired
    private ShapeDataService shapeDataService;

    @Autowired
    private Configuration configuration;

    private int requestCounter = 0;

    private boolean pendingRequest = false;

    /**
     * Öffentliche Methode zum Abfragen von Flugzeugen innerhalb eines Extents
     *
     * @param lomin            lower bound for the longitude in decimal degrees
     * @param lamin            lower bound for the latitude in decimal degrees
     * @param lomax            upper bound for the longitude in decimal degrees
     * @param lamax            upper bound for the latitude in decimal degrees
     * @param selectedFeeder   Ausgewählter Feeder (oder 'AllFeeder')
     * @param fetchFromOpensky Boolean, ob Opensky angefragt werden soll
     * @param showIss          Boolean, ob ISS abgefragt werden soll
     * @return HashSet<AircraftSuperclass>
     */
    @Async
    public HashSet<AircraftSuperclass> getPlanesWithinExtent(double lomin, double lamin, double lomax, double lamax,
                                                             String selectedFeeder, boolean fetchFromOpensky, boolean showIss, HttpServletRequest httpRequest) {
        if (pendingRequest)
            return null;

        // Setze Boolean pendingRequest auf 'pending'
        pendingRequest = true;

        // Initialisieren der Liste
        LinkedHashSet<AircraftSuperclass> setAircraft = new LinkedHashSet<>();

        // HashMap zum Herausfiltern von doppelten Flugzeugen beim Fetch von lokalen
        // Feedern und Opensky
        HashMap<String, AircraftSuperclass> mapAircraftRaw = new HashMap<String, AircraftSuperclass>();

        try {

            // Erstelle Requests für Services, wenn Opensky oder ISS angefragt werden soll
            createRequestsIfNecessary(lomin, lamin, lomax, lamax, fetchFromOpensky, showIss,
                    httpRequest.getRemoteAddr());

            // Berechne timestamp vor 2 Sekunden, damit nur die Flugzeuge angezeigt werden,
            // welche in den letzten 2 Sekunden geupdatet wurden
            long startTime = System.currentTimeMillis() - 2000;

            try {
                if (startTime != 0) {
                    // Hole Flugzeuge von den lokalen Feedern
                    List<Aircraft> listLocalFeederPlanes = localFeederService.getPlanesWithinExtent(lomin, lamin,
                            lomax, lamax, selectedFeeder, startTime);
                    if (listLocalFeederPlanes != null) {
                        for (Aircraft aircraft : listLocalFeederPlanes) {
                            mapAircraftRaw.put(aircraft.getHex(), aircraft);
                        }
                        // Füge alle lokalen Fluzeuge zur Gesamtliste hinzu
                        setAircraft.addAll(listLocalFeederPlanes);
                    }

                    // Füge ISS hinzu
                    if (showIss) {
                        AircraftSuperclass iss = spacecraftService.getIssWithinExtent(lomin, lamin, lomax, lamax);
                        if (iss != null) {
                            // Füge ISS zur Gesamtliste hinzu
                            setAircraft.add(iss);
                        }
                    }

                    // Füge Opensky hinzu
                    if (fetchFromOpensky) {
                        List<OpenskyAircraft> listOpenskyPlanes = openskyService
                                .getOpenskyPlanesWithinExtent(lomin, lamin, lomax, lamax);
                        if (listOpenskyPlanes != null) {
                            // Prüfe für jedes Opensky-Flugzeug, ob bereits ein lokales Flugzeug mit
                            // demselben Hex existiert
                            for (OpenskyAircraft openskyAircraft : listOpenskyPlanes) {
                                if (!mapAircraftRaw.containsKey(openskyAircraft.getHex())) {
                                    setAircraft.add(openskyAircraft);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Server - DB error when fetching and converting planes : Exception = " + e);
            }
        } catch (Exception e) {
            log.error("Server - DB error when fetching planes : Exception = " + e);
        }

        // Setze Boolean pendingRequest zurück
        pendingRequest = false;

        return setAircraft;
    }

    /**
     * Erstellt einen Request an Opensky und/oder an Open-Notify (ISS), je nach
     * Booleans fetchFromOpensky und showIss
     *
     * @param lomin            lower bound for the longitude in decimal degrees
     * @param lamin            lower bound for the latitude in decimal degrees
     * @param lomax            upper bound for the longitude in decimal degrees
     * @param lamax            upper bound for the latitude in decimal degrees
     * @param fetchFromOpensky Boolean, ob Opensky angefragt werden soll
     * @param showIss          Boolean, ob ISS abgefragt werden soll
     */
    private void createRequestsIfNecessary(double lomin, double lamin, double lomax, double lamax,
                                           boolean fetchFromOpensky, boolean showIss, String ipAddress) {

        if (ipAddress == null || ipAddress.isEmpty())
            return;

        // Erstelle Request für ISS- und Opensky-Update mit Extent
        Request request = new Request("Request: " + requestCounter, System.currentTimeMillis(), ipAddress,
                lomin, lamin, lomax, lamax);
        requestCounter++;

        if (fetchFromOpensky) {
            // Packe Request in Opensky-Queue
            openskyService.addRequest(request);
        }

        if (showIss) {
            // Packe Request in ISS-Queue
            spacecraftService.addRequest(request);
        }
    }

    /**
     * Gibt Konfigurationen zurück. Damit IPs der Feeder
     * nicht preisgegeben werden, werden diese vorher noch bearbeitet
     *
     * @param httpRequest HttpServletRequest
     * @return HashMap<String, Object>
     */
    public HashMap<String, Object> getConfiguration(HttpServletRequest httpRequest) {
        HashMap<String, Object> configMap = new HashMap<>();
        ArrayList<Feeder> listFeederEdited = new ArrayList<>();

        // Erstelle shapesMap
        Map<String, Object[]> shapesMap = shapeDataService.getShapes();

        // Erstelle catMap
        Map<String, Object[]> catMap = mapCatToShapeDataService.getMapCatToShape();

        // Erstelle typesMap
        Map<String, Object[]> typesMap = mapTypeToShapeDataService.getMapTypeToShape();

        // Setze Werte aus der configuration
        configMap.put("latFeeder", configuration.getLatFeeder());
        configMap.put("lonFeeder", configuration.getLonFeeder());
        configMap.put("scaleIcons", configuration.getScaleIcons());
        configMap.put("appName", configuration.getAppName());
        configMap.put("appVersion", configuration.getAppVersion());
        configMap.put("circleDistancesInNm", configuration.getListCircleDistancesInNm());
        configMap.put("shapesMap", shapesMap);
        configMap.put("catMap", catMap);
        configMap.put("typesMap", typesMap);

        // Entferne IP-Adresse der Feeder
        for (Feeder feeder : configuration.getListFeeder()) {
            Feeder feederToAdd = new Feeder(feeder.getName(), null, feeder.getType(), feeder.getColor());
            listFeederEdited.add(feederToAdd);
        }
        configMap.put("listFeeder", listFeederEdited);

        // Füge IP-Adresse des anfragenden Clients hinzu
        configMap.put("clientIp", httpRequest != null ? httpRequest.getRemoteAddr() : null);

        // Prüfe, ob Opensky-Credentials gesetzt wurden, damit Switch im Frontend disabled werden kann, falls nicht
        if (configuration.openskyCredentialsAreValid()) {
            configMap.put("openskyCredentials", true);
        } else {
            configMap.put("openskyCredentials", false);
        }

        return configMap;
    }
}
