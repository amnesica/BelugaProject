package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.data.FlightrouteData;
import com.amnesica.belugaproject.repositories.data.FlightrouteDataRepository;
import com.amnesica.belugaproject.services.helper.NetworkHandlerService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FlightrouteDataService {

  @Autowired
  private FlightrouteDataRepository flightrouteDataRepository;
  @Autowired
  private NetworkHandlerService networkHandler;
  @Autowired
  private Configuration configuration;

  // Url zum Fetchen der Route-Daten von Opensky
  private static final String URL_OPENSKY_ROUTE_API = "https://opensky-network.org/api/routes?";

  /**
   * Gibt alle Informationen über eine Flightroute mit Angabe des flightID aus der
   * Datenbank zurück. Wenn die Datenbank nicht existiert oder keinen Eintrag hat wird Opensky angefragt
   *
   * @param flightId String
   * @return flightrouteData
   */
  public FlightrouteData getFlightrouteData(String flightId, final boolean isFrontendRequest) {
    FlightrouteData flightrouteData = null;

    if (flightId != null && !flightId.isEmpty() && !flightId.equals("null")) {
      flightId = flightId.trim();

      // Hole Daten aus Datenbank mit Angabe der flightId (bspw. "DLH01LP")
      try {
        flightrouteData = flightrouteDataRepository.findByFlightId(flightId);
      } catch (Exception e) {
        log.error("Server - DB error while reading FlightrouteData for FlightId " + flightId + ": Exception = "
            + e);
      }

      // Hole Daten von Opensky-Unoffical API, wenn Route-Datenbank nicht existiert oder keinen Eintrag hat
      // (Request soll nur gestellt werden, wenn das Frontend explizit Daten anfordert, bspw. bei Klick auf Flugzeug)
      if (flightrouteData == null && isFrontendRequest) {
        flightrouteData = getFlightRouteDataFromOpensky(flightId);
      }
    }

    return flightrouteData;
  }

  private FlightrouteData getFlightRouteDataFromOpensky(String flightId) {
    FlightrouteData flightrouteData = null;

    // Genriere URL
    final String url = URL_OPENSKY_ROUTE_API + "callsign=" + flightId;

    // Anfrage an Opensky mit url und Credentials
    String jsonStr = networkHandler.makeOpenskyServiceCall(url, configuration.getOpenskyUsername(), configuration.getOpenskyPassword());

    try {
      if (jsonStr != null) {
        final JSONObject jsonObject = new JSONObject(jsonStr);
        final String origin = jsonObject.getJSONArray("route").get(0).toString();
        final String destination = jsonObject.getJSONArray("route").get(1).toString();
        final long timestamp = jsonObject.getLong("updateTime");
        flightrouteData = new FlightrouteData(flightId, origin + "-" + destination, String.valueOf(timestamp));
      }
    } catch (Exception e) {
      log.error(
          "Server: Route-Data from Opensky-Network could not get fetched. Url: " + url);
    }

    return flightrouteData;
  }

  /**
   * Fügt zusätzliche Informationen zur Flugroute aus Datenbank-Tabellen hinzu
   *
   * @param aircraft AircraftSuperclass
   */
  public void addFlightrouteData(AircraftSuperclass aircraft, boolean isFrontendRequest) {

    // Lese Flugrouten-Information für flightId hinzu
    if (aircraft.getFlightId() != null && !aircraft.getFlightId().isEmpty()) {
      FlightrouteData flightrouteData = getFlightrouteData(aircraft.getFlightId(), isFrontendRequest);
      if (flightrouteData != null && flightrouteData.getFlightRoute().length() == 9) {
        aircraft.setOrigin(flightrouteData.getFlightRoute().substring(0, 4));
        aircraft.setDestination(flightrouteData.getFlightRoute().substring(5, 9));
      }
    }
  }
}
