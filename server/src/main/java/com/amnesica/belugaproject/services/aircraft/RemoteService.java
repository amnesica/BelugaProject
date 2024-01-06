package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.RemoteAircraft;
import com.amnesica.belugaproject.entities.data.AirportData;
import com.amnesica.belugaproject.repositories.aircraft.RemoteAircraftRepository;
import com.amnesica.belugaproject.services.data.AirportDataService;
import com.amnesica.belugaproject.services.helper.Request;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.stream.Collectors;

@Slf4j
@EnableScheduling
@Service
public class RemoteService {
  @Autowired
  private AircraftService aircraftService;

  @Autowired
  private AirportDataService airportDataService;
  @Autowired
  private RemoteAircraftRepository remoteAircraftRepository;

  @Autowired
  private OpenskyService openskyService;
  @Autowired
  private AirplanesLiveService airplanesLiveService;

  // Queue mit Anfragen an Remote-API
  private final BlockingQueue<Request> requestQueueRemote = new LinkedBlockingQueue<>();

  /**
   * Methode ruft Remote-Flugzeuge je nach vorliegenden Requests von der
   * jeweiligen Remote-API alle INTERVAL_UPDATE_REMOTE Millisekunden ab
   */
  @Scheduled(fixedRate = StaticValues.INTERVAL_UPDATE_REMOTE)
  private void getPlanesFromRemote() {

    // Hole Request aus queue. Wenn kein Request vorhanden ist, wird null zurückgegeben
    Request request = requestQueueRemote.poll();

    if (request == null) return;

    final Request copyRequest = request;
    Optional<Request> requestNewest = getNewestRequestForIpAddress(copyRequest);

    if (requestNewest.isPresent()) {
      // Ersetze ursprünglich gepollten Request durch neueren Request
      request = requestNewest.get();

      // Lösche alle bisherigen Requests derjenigen Ip-Adressse, welche älter sind als der heraus genommene Request
      removePrevRequestsForIpAddressOlderThanPolled(requestNewest, copyRequest);
    }

    // Validiere Request
    if (remoteRequestIsNotValid(request)) {
      log.error("RemoteService: Request " + request + " is is not valid. Nothing to do");
      return;
    }

    if ("Opensky".equals(request.getRemote())) {
      openskyService.fetchAircraftData(request);
    } else if ("Airplanes-Live".equals(request.getRemote())) {
      airplanesLiveService.fetchAircraftData(request);
    }
  }

  private void removePrevRequestsForIpAddressOlderThanPolled(Optional<Request> requestNewest, Request copyRequest) {
    requestQueueRemote.removeIf(r -> r.getTimestamp() < requestNewest.get().getTimestamp() &&
        r.getIpAddressClient().equals(copyRequest.getIpAddressClient()));
  }

  @NotNull
  private Optional<Request> getNewestRequestForIpAddress(Request copyRequest) {
    return requestQueueRemote.stream()
        .filter(r -> r.getIpAddressClient().equals(copyRequest.getIpAddressClient()) &&
            r.getTimestamp() > copyRequest.getTimestamp()).max(Comparator.comparing(Request::getTimestamp));
  }

  private static boolean remoteRequestIsNotValid(Request request) {
    return request.getLomin() == null || request.getLamin() == null || request.getLomax() == null
        || request.getLamax() == null || request.getRemote() == null || (!"Opensky".equals(request.getRemote()) && !"Airplanes-Live".equals(request.getRemote()));
  }

  /**
   * Methode entfernt alte Flugzeuge aus der remote_aircraft-Tabelle. Methode
   * wird alle INTERVAL_REMOVE_OLD_PLANES_REMOTE Millisekunden aufgerufen
   */
  @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_PLANES_REMOTE)
  private void removeOldPlanes() {
    long startTime = System.currentTimeMillis() - StaticValues.INTERVAL_REMOVE_OLD_PLANES_REMOTE;

    // Hole Flugzeuge der aktuellen Iteration
    List<RemoteAircraft> listPlanesNotUpdated = remoteAircraftRepository
        .findAllByLastUpdateLessThanEqual(startTime);

    if (listPlanesNotUpdated != null) {
      // Lösche alle betroffenen Flugzeuge aus der RemoteAircraft-Tabelle
      remoteAircraftRepository.deleteAll(listPlanesNotUpdated);
    }
  }

  /**
   * Methode gibt alle Flugzeuge innerhalb eines Extents aus der Tabelle
   * remote_aircraft zurück
   *
   * @param lomin lower bound for the longitude in decimal degrees
   * @param lamin lower bound for the latitude in decimal degrees
   * @param lomax upper bound for the longitude in decimal degrees
   * @param lamax upper bound for the latitude in decimal degrees
   * @return List<RemoteAircraft>
   */
  public List<RemoteAircraft> getRemotePlanesWithinExtent(double lomin, double lamin, double lomax,
                                                          double lamax, boolean showOnlyMilitary, String fetchRemote) {
    List<RemoteAircraft> listAircraftRaw = null;

    if (!fetchRemote.equals("Opensky") && !fetchRemote.equals("Airplanes-Live")) return listAircraftRaw;

    try {
      listAircraftRaw = remoteAircraftRepository.findAllWithinExtent(lomin, lamin, lomax, lamax, fetchRemote);

      if (listAircraftRaw != null && showOnlyMilitary)
        listAircraftRaw = listAircraftRaw.stream().filter(a -> a.getIsMilitary() != null).collect(Collectors.toList());

    } catch (Exception e) {
      log.error("Server - DB error when fetching remote planes (" + fetchRemote + ") from db : Exception = " + e);
    }

    return listAircraftRaw;
  }

  /**
   * Sucht alle Informationen über ein Flugzeug (RemoteAircraft) zusammen und
   * gibt diese zurück. Hinweis: Diese Funktion funktioniert nur für ein Flugzeug
   * der Klasse RemoteAircraft
   *
   * @param hex          String
   * @param registration String
   * @return Object[] (RemoteAircraft-Objekt, AirportData originAirportData,
   * AirportData destinationAirportData)
   */
  public Object[] getAllAircraftData(String hex, String registration) {
    if (hex != null && registration != null && !hex.isEmpty() && !registration.isEmpty()) {
      // Hole Flugzeug aus Datenbank
      RemoteAircraft aircraft = remoteAircraftRepository.findByHex(hex);

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
          remoteAircraftRepository.save(aircraft);
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
    requestQueueRemote.add(request);
  }
}
