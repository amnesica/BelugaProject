package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.config.FeederMapping;
import com.amnesica.belugaproject.entities.aircraft.RemoteAircraft;
import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import com.amnesica.belugaproject.repositories.aircraft.RemoteAircraftRepository;
import com.amnesica.belugaproject.services.data.AircraftDataService;
import com.amnesica.belugaproject.services.helper.HelperService;
import com.amnesica.belugaproject.services.helper.Request;
import com.amnesica.belugaproject.services.helper.TrailHelperService;
import com.amnesica.belugaproject.services.network.NetworkHandlerService;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OpenskyService {

  @Autowired
  private AircraftDataService aircraftDataService;
  @Autowired
  private AircraftService aircraftService;
  @Autowired
  private RemoteAircraftRepository remoteAircraftRepository;
  @Autowired
  private Configuration configuration;
  @Autowired
  private NetworkHandlerService networkHandler;
  @Autowired
  private TrailHelperService trailHelperService;

  // Feeder für das Opensky-Network
  private Feeder openskyFeeder;

  // Url zum Fetchen der Daten von Opensky
  private static final String URL_OPENSKY_LIVE_API = "https://opensky-network.org/api/states/all?";

  // Url zum Fetchen der Track-Daten von Opensky
  private static final String URL_OPENSKY_LIVE_TRACK_API = "https://opensky-network.org/api/tracks/all?";

  // Url zum Fetchen des Access Tokens
  private static final String URL_OPENSKY_LIVE_TOKEN_API = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

  private String openskyAccessToken;

  @Setter
  private Instant lastTokenFetchTime;

  void fetchAircraftData(Request request) {
    JSONArray jsonArrayFromOpensky;

    // Hole Flugzeuge als JSONArray vom Opensky-Network
    jsonArrayFromOpensky = getDataFromOpensky(request.getLomin(), request.getLamin(), request.getLomax(), request.getLamax());

    // Initialisiere Feeder, wenn nötig
    if (openskyFeeder == null) {
      openskyFeeder = createOpenskyFeeder();
    }

    processOpenskyAircraftJsonArray(jsonArrayFromOpensky);
  }

  private void processOpenskyAircraftJsonArray(JSONArray jsonArrayFromOpensky) {
    if (jsonArrayFromOpensky != null) {
      for (int i = 0; i < jsonArrayFromOpensky.length(); i++) {

        // Extrahiere element aus JSONArray
        JSONObject element = jsonArrayFromOpensky.getJSONObject(i);

        // Prüfe, ob element alle Basis-Eigenschaften erfüllt (bspw. 'lat','lon' sind
        // vorhanden)
        if (element != null && element.has("hex") && element.has("lat") && element.has("lon") && !element.isNull("lat") && !element.isNull("lon") && element.getDouble("lat") != 0 && element.getDouble("lon") != 0) {

          // Erstelle aus Daten des Feeders ein neues Flugzeug
          RemoteAircraft aircraftNew = aircraftService.createNewRemoteAircraft(element, openskyFeeder);

          // Aktualisiere Flugzeug aus Datenbank oder
          // füge neues Flugzeug zur Datenbank hinzu
          if (remoteAircraftRepository.existsById(aircraftNew.getHex())) {

            // Prüfe, ob Flugzeug in Datenbank-Tabelle enthalten ist
            RemoteAircraft aircraftInDb = remoteAircraftRepository.findByHex(aircraftNew.getHex());

            // Lösche Feeder-Liste und Source-Liste, damit nach der Iteration nur die Feeder
            // und die Sources in der Liste stehen, welche das Flugzeug geupdated haben
            aircraftInDb.clearFeederList();
            aircraftInDb.clearSourceList();

            // Update Werte des Flugzeugs mit Werten von aircraftNew
            aircraftService.updateValuesOfAircraft(aircraftInDb, aircraftNew, openskyFeeder.getName(), false);

            try {
              // Schreibe Flugzeug in OpenskyAircraft-Tabelle
              remoteAircraftRepository.save(aircraftInDb);
            } catch (Exception e) {
              log.error("Server - DB error when writing opensky aircraftNew for hex " + aircraftNew.getHex() + ": Exception = " + e);
            }

          } else {
            // Füge Informationen aus aircraftData hinzu
            aircraftDataService.addAircraftData(aircraftNew);

            // Setze Boolean, dass Flugzeug von Opensky ist
            aircraftNew.setIsFromRemote("Opensky");

            // Füge Timestamp als Zeitpunkt des letzten Updates an
            aircraftNew.setLastUpdate(System.currentTimeMillis());

            try {
              // Schreibe Flugzeug in OpenskyAircraft-Tabelle
              remoteAircraftRepository.save(aircraftNew);
            } catch (Exception e) {
              log.error("Server - DB error when writing new opensky aircraftNew for hex " + aircraftNew.getHex() + ": Exception = " + e);
            }
          }
        }
      }
    }
  }

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
    final String url = URL_OPENSKY_LIVE_API + "lamin=" + lamin + "&lomin=" + lomin + "&lamax=" + lamax + "&lomax=" + lomax;

    // Anfrage an Opensky mit url und Credentials
    String jsonStr = networkHandler.makeOpenskyServiceCall(url, configuration.getOpenskyUsername(), configuration.getOpenskyPassword());

    try {
      if (jsonStr != null) {
        JSONObject jsonObject = new JSONObject(jsonStr);
        // Hinweis: jsonArray ist ein Array aus Arrays
        // und muss daher für weitere Bearbeitung konvertiert werden
        final JSONArray jsonArrayStates = jsonObject.getJSONArray("states");
        final Integer lastUpdate = jsonObject.getInt("time");

        if (jsonArrayStates != null) {
          jsonArray = convertOpenskyDataJsonArrayToArrayOfObjects(jsonArrayStates, lastUpdate);
        } else {
          throw new Exception();
        }
      }
    } catch (Exception e) {
      log.error("Server: Data from Opensky-Network could not get fetched or there are no planes in this area. Url: " + url);
    }

    return jsonArray;
  }


  /**
   * Konvertiert ein JSONArray aus Arrays in ein JSONArray aus JSONObjects (für allgemeine Flugzeug-Daten)
   *
   * @param jsonArray JSONArray
   * @return JSONArray
   */
  private JSONArray convertOpenskyDataJsonArrayToArrayOfObjects(JSONArray jsonArray, Integer lastUpdate) {
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

        if (lastUpdate != null) {
          // Berechne lastSeen-Wert (in Sekunden)
          int lastSeen = lastUpdate - (int) innerArray.get(4);
          innerObject.put("lastSeen", lastSeen);
        }

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
   * Ruft die Trackdaten als JSONArray vom Opensky-Network ab
   *
   * @param hex String
   * @return JSONArray
   */
  public JSONArray getTrackDataFromOpensky(String hex) {
    // Array mit Track-Daten von Opensky
    JSONArray jsonArrayTrackStates = null;

    // Genriere URL mit Daten der Bounding-Box vom Frontend
    final String url = URL_OPENSKY_LIVE_TRACK_API + "icao24=" + hex + "&time=0";

    // Anfrage an Opensky mit url und Credentials
    String jsonStr = networkHandler.makeOpenskyServiceCall(url, configuration.getOpenskyUsername(), configuration.getOpenskyPassword());

    try {
      if (jsonStr != null) {
        JSONObject jsonObject = new JSONObject(jsonStr);
        jsonArrayTrackStates = jsonObject.getJSONArray("path");
      }
    } catch (Exception e) {
      log.error("Server: Track-Data from Opensky-Network could not get fetched or there are no planes in this area. Url: " + url);
    }

    return jsonArrayTrackStates;
  }

  /**
   * Gibt alle Trails zu einem Flugzeug mit hex zurück
   *
   * @param hex String
   * @return List<AircraftTrail>
   */
  public List<AircraftTrail> getTrail(String hex) {
    List<AircraftTrail> trails = null;
    if (hex != null && !hex.isEmpty()) {
      trails = new ArrayList<>();
      try {
        JSONArray jsonArrayTrackStates = getTrackDataFromOpensky(hex);
        for (int i = 0; i < jsonArrayTrackStates.length(); i++) {
          JSONArray innerArray = jsonArrayTrackStates.getJSONArray(i);

          if (innerArray != null) {
            final Long timestamp = innerArray.getLong(0);
            final Double latitude = innerArray.getDouble(1);
            final Double longitude = innerArray.getDouble(2);
            final Double baroAltitude = innerArray.getDouble(3);
            final Integer track = (int) innerArray.getDouble(4);
            final int altitudeInFeet = (int) HelperService.convertMeter2Foot(baroAltitude);
            final AircraftTrail openskyTrail = new AircraftTrail(hex, longitude, latitude, altitudeInFeet, false, timestamp * 1000, "Opensky", null, track, null); // convert timestamp to be in milli seconds
            trails.add(openskyTrail);
          }
        }
      } catch (Exception e) {
        log.error("Server - DB error when retrieving all trails for aircraft from Opensky-Network with hex " + hex + ": Exception = " + e);
      }
    }

    if (trails != null) trails = trails.stream().distinct().collect(Collectors.toList());

    if (trails != null) trails = trailHelperService.checkAircraftTrailsFor180Border(trails);

    return trails;
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
    mapping.setLastSeen("lastSeen");

    // Setze Mapping
    feeder.setMapping(mapping);

    return feeder;
  }

  /**
   * Gibt den Access-Token für das Opensky-Network zurück (neuer OAuth2-Ansatz für neu erstellte Accounts)
   * <p>
   * Siehe <a href="https://openskynetwork.github.io/opensky-api/rest.html#oauth2-client-credentials-flow">Docs</a>
   *
   * @return String
   */
  public String getOpenskyAccessToken() {
    final String clientId = configuration.getOpenskyClientId();
    final char[] clientSecret = configuration.getOpenskyClientSecret();

    // Check if the token is still valid (cached for 30 minutes)
    if (this.lastTokenFetchTime != null && Instant.now().isBefore(this.lastTokenFetchTime.plusSeconds(1800))) {
      // Return cached token if it was fetched within the last hour
      return this.openskyAccessToken;
    }

    if (clientId == null || clientId.isEmpty() || clientSecret == null || clientSecret.length == 0) {
      log.error("Opensky username or password is not configured properly.");
      return null;
    }

    final String jsonStr = networkHandler.makeOpenskyTokenCall(URL_OPENSKY_LIVE_TOKEN_API, clientId, clientSecret);

    try {
      if (jsonStr != null) {
        JSONObject jsonObject = new JSONObject(jsonStr);
        final String accessToken = jsonObject.getString("access_token");
        this.openskyAccessToken = accessToken;
        this.lastTokenFetchTime = Instant.now();
        return accessToken;
      }
    } catch (Exception e) {
      log.error("Server: Access token from Opensky-Network could not get fetched. Url: " + URL_OPENSKY_LIVE_TOKEN_API);
    }

    return null;
  }
}
