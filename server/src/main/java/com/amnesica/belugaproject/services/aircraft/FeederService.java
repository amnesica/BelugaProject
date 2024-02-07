package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.aircraft.RemoteAircraft;
import com.amnesica.belugaproject.services.data.MapCatToShapeDataService;
import com.amnesica.belugaproject.services.data.MapTypeToShapeDataService;
import com.amnesica.belugaproject.services.data.ShapeDataService;
import com.amnesica.belugaproject.services.helper.Request;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class FeederService {
  @Autowired
  private LocalFeederService localFeederService;
  @Autowired
  private RemoteService remoteService;
  @Autowired
  private SpacecraftService spacecraftService;

  @Autowired
  private MapCatToShapeDataService mapCatToShapeDataService;
  @Autowired
  private MapTypeToShapeDataService mapTypeToShapeDataService;
  @Autowired
  private ShapeDataService shapeDataService;
  @Autowired
  private BuildProperties buildProperties;

  @Autowired
  private Configuration configuration;

  private int requestCounter = 0;

  private boolean pendingRequest = false;

  /**
   * Öffentliche Methode zum Abfragen von Flugzeugen innerhalb eines Extents
   *
   * @param lomin          lower bound for the longitude in decimal degrees
   * @param lamin          lower bound for the latitude in decimal degrees
   * @param lomax          upper bound for the longitude in decimal degrees
   * @param lamax          upper bound for the latitude in decimal degrees
   * @param selectedFeeder List<String>, Ausgewählte Feeder (oder keiner)
   * @param fetchRemote    Boolean, ob Remote-Flugzeug angefragt werden soll ("Opensky" oder "Airplanes-Live")
   * @param showIss        Boolean, ob ISS abgefragt werden soll
   * @return HashSet<AircraftSuperclass>
   */
  @Async
  public HashSet<AircraftSuperclass> getPlanes(Double lomin, Double lamin, Double lomax, Double lamax,
                                               List<String> selectedFeeder, String fetchRemote, boolean showIss, String markedHex, boolean showOnlyMilitary, HttpServletRequest httpRequest) {
    if (pendingRequest)
      return null;

    // Setze Boolean pendingRequest auf 'pending'
    pendingRequest = true;

    // Initialisieren der Liste
    LinkedHashSet<AircraftSuperclass> aircraftSet = new LinkedHashSet<>();

    // HashMap zum Herausfiltern von doppelten Flugzeugen beim Fetch von lokalen
    // Feedern und Opensky
    HashMap<String, AircraftSuperclass> mapAircraftRaw = new HashMap<String, AircraftSuperclass>();

    try {

      // Erstelle Requests für Services, wenn Remote oder ISS angefragt werden soll
      createRequestsIfNecessary(lomin, lamin, lomax, lamax, fetchRemote, showIss, markedHex,
          httpRequest.getRemoteAddr());

      // Berechne timestamp vor 2 Sekunden, damit nur die Flugzeuge angezeigt werden,
      // welche in den letzten 2 Sekunden geupdatet wurden
      long startTime = System.currentTimeMillis() - 2000;

      try {
        if (selectedFeeder != null && !selectedFeeder.isEmpty()) {
          getPlanesFromLocalFeeder(lomin, lamin, lomax, lamax, selectedFeeder, markedHex, showOnlyMilitary, startTime,
              mapAircraftRaw, aircraftSet);
        }

        // Füge ISS hinzu
        if (showIss) {
          getIssFromApi(lomin, lamin, lomax, lamax, aircraftSet);
        }

        // Füge Remote-Flugzeuge hinzu
        if (("Opensky".equals(fetchRemote) || "Airplanes-Live".equals(fetchRemote))) {
          getPlanesFromRemote(lomin, lamin, lomax, lamax, showOnlyMilitary, mapAircraftRaw, aircraftSet, fetchRemote, markedHex);
        }
      } catch (Exception e) {
        log.error("Server - DB error when fetching and converting planes : Exception = " + e);
      }
    } catch (Exception e) {
      log.error("Server - DB error when fetching planes : Exception = " + e);
    }

    // Setze Boolean pendingRequest zurück
    pendingRequest = false;

    return aircraftSet;
  }

  private void getPlanesFromRemote(double lomin, double lamin, double lomax, double lamax, boolean showOnlyMilitary,
                                   HashMap<String, AircraftSuperclass> mapAircraftRaw,
                                   LinkedHashSet<AircraftSuperclass> aircraftSet,
                                   String fetchRemote,
                                   String markedHex) {
    List<RemoteAircraft> listRemotePlanes = remoteService
        .getRemotePlanesWithinExtent(lomin, lamin, lomax, lamax, showOnlyMilitary, fetchRemote);

    if (listRemotePlanes != null) {
      // Prüfe für jedes Remote-Flugzeug, ob bereits ein lokales Flugzeug mit
      // demselben Hex existiert (priorisiere lokale Feeder!)
      for (RemoteAircraft remoteAircraft : listRemotePlanes) {
        if (!mapAircraftRaw.containsKey(remoteAircraft.getHex())) {
          aircraftSet.add(remoteAircraft);
        } else {
          // Priorisiere Remote-Flugzeug, wenn dies neuer ist als markiertes lokales Flugzeug
          final Aircraft localAircraft = (Aircraft) mapAircraftRaw.get(remoteAircraft.getHex());
          if (localAircraft.getHex().equals(markedHex) && localAircraft.getLastUpdate() < remoteAircraft.getLastUpdate()) {
            aircraftSet.remove(localAircraft);
            aircraftSet.add(remoteAircraft);
          }
        }
      }
    }
  }

  private void getIssFromApi(double lomin, double lamin, double lomax, double lamax, LinkedHashSet<AircraftSuperclass> aircraftSet) {
    AircraftSuperclass iss = spacecraftService.getIssWithinExtent(lomin, lamin, lomax, lamax);
    if (iss != null) {
      // Füge ISS zur Gesamtliste hinzu
      aircraftSet.add(iss);
    }
  }

  private void getPlanesFromLocalFeeder(double lomin, double lamin, double lomax, double lamax, List<String> selectedFeeder, String markedHex, boolean showOnlyMilitary, long startTime, HashMap<String, AircraftSuperclass> mapAircraftRaw, LinkedHashSet<AircraftSuperclass> aircraftSet) {
    // Hole Flugzeuge von den lokalen Feedern
    List<Aircraft> listLocalFeederPlanes = new ArrayList<>();
    for (String feeder : selectedFeeder) {
      List<Aircraft> listPlanesForFeeder = localFeederService.getPlanes(lomin, lamin,
          lomax, lamax, feeder, startTime, markedHex, showOnlyMilitary);
      listLocalFeederPlanes.addAll(listPlanesForFeeder);
    }

    if (!listLocalFeederPlanes.isEmpty()) {
      for (Aircraft aircraft : listLocalFeederPlanes) {
        mapAircraftRaw.put(aircraft.getHex(), aircraft);
      }
      // Füge alle lokalen Fluzeuge zur Gesamtliste hinzu
      aircraftSet.addAll(listLocalFeederPlanes);
    }
  }

  /**
   * Erstellt einen Request an Opensky/Airplanes-Live und/oder an ISS-API, je nach
   * Booleans fetchRemote und showIss
   *
   * @param lomin       lower bound for the longitude in decimal degrees
   * @param lamin       lower bound for the latitude in decimal degrees
   * @param lomax       upper bound for the longitude in decimal degrees
   * @param lamax       upper bound for the latitude in decimal degrees
   * @param fetchRemote String, ob Remote-API angefragt werden soll ("Opensky" oder "Airplanes-Live")
   * @param showIss     Boolean, ob ISS abgefragt werden soll
   */
  private void createRequestsIfNecessary(Double lomin, Double lamin, Double lomax, Double lamax,
                                         String fetchRemote, boolean showIss, String markedHex, String ipAddress) {

    if (ipAddress == null || ipAddress.isEmpty())
      return;

    // Erstelle Request für ISS- und Opensky-Update mit Extent
    Request request = new Request("Request: " + requestCounter, System.currentTimeMillis(), ipAddress,
        lomin, lamin, lomax, lamax, markedHex, fetchRemote);
    requestCounter++;

    if (("Opensky".equals(fetchRemote) || "Airplanes-Live".equals(fetchRemote))) {
      // Packe Request in Opensky-Queue
      remoteService.addRequest(request);
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
    configMap.put("smallScaleIcons", configuration.getSmallScaleIcons());
    configMap.put("appName", buildProperties.getName());
    configMap.put("appVersion", buildProperties.getVersion());
    configMap.put("appStage", configuration.getAppStage());
    configMap.put("appBuildTime", buildProperties.getTime());
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

    // Prüfe, ob Geoapify-API-Key gesetzt wurde, damit Karten im Frontend verfügbar gemacht werden können
    if (configuration.geoapifyApiKeyIsValid()) {
      configMap.put("geoapifyApiKey", configuration.getGeoapifyApiKey());
    }

    // Prüfe, ob Cesium Ion Default Access Token gesetzt wurde, damit Cesium-Komponenten im Frontend genutzt werden kann
    if (configuration.cesiumIonDefaultAccessTokenIsValid()) {
      configMap.put("cesiumIonDefaultAccessToken", configuration.getCesiumIonDefaultAccessToken());
    }

    return configMap;
  }
}
