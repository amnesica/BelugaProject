package com.amnesica.belugaproject.services.trails;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import com.amnesica.belugaproject.entities.trails.TrailSuperclass;
import com.amnesica.belugaproject.repositories.trails.AircraftTrailRepository;
import com.amnesica.belugaproject.services.helper.HelperService;
import com.amnesica.belugaproject.services.helper.TrailHelperService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
public class AircraftTrailService {
  @Autowired
  private AircraftTrailRepository aircraftTrailRepository;
  @Autowired
  private TrailHelperService trailHelperService;
  @Autowired
  private Configuration configuration;

  private List<AircraftTrail> lastActualOutline = null;
  private List<String> lastSelectedFeederForOutline = null;
  private Long lastOutlineTimestamp = null;

  /**
   * Speichert einen Trail im AircraftTrailRepository
   *
   * @param aircraft   AircraftSuperclass
   * @param feederName String
   */
  public void addTrail(AircraftSuperclass aircraft, String feederName) {
    if (aircraft != null) {
      // Erstelle neues Trail-Element
      AircraftTrail trail = new AircraftTrail(aircraft.getHex(), aircraft.getLongitude(), aircraft.getLatitude(),
          aircraft.getAltitude(), aircraft.getReenteredAircraft(), System.currentTimeMillis(), feederName,
          aircraft.getSourceCurrentFeeder(), aircraft.getTrack(), aircraft.getRoll());

      addDistanceAndAngleToSite(trail);

      try {
        // Speichere Trail in Datenbank
        aircraftTrailRepository.save(trail);
      } catch (Exception e) {
        log.error("Server - DB error when saving trail for aircraft with hex " + trail.getHex()
            + ": Exception = " + e);
      }
    }
  }

  /**
   * Berechnet die Distanz und den Winkel zur Site
   *
   * @param trail AircraftTrail
   */
  private void addDistanceAndAngleToSite(AircraftTrail trail) {
    Double distanceToSite = HelperService.getDistanceBetweenPositions(configuration.getLatFeeder(), configuration.getLonFeeder(),
        trail.getLatitude(), trail.getLongitude());
    trail.setDistanceToSite(distanceToSite);

    Integer angleToSite = (int) HelperService.getAngleBetweenPositions(configuration.getLatFeeder(), configuration.getLonFeeder(),
        trail.getLatitude(), trail.getLongitude());
    trail.setAngleToSite(angleToSite);
  }

  /**
   * Gibt alle Trails zu einem Hex und einem Feeder aus der letzten Stunde zurück
   *
   * @param hex            String
   * @param selectedFeeder String
   * @return List<AircraftTrail>
   */
  public List<AircraftTrail> getAllTrailsFromLastHour(String hex, List<String> selectedFeeder) {
    List<AircraftTrail> trails = new ArrayList<>();
    long timeOneHourAgo = System.currentTimeMillis() - 3600000L;

    if (hex != null && !hex.isEmpty()) {
      for (String feeder : selectedFeeder) {
        if (feeder != null && !feeder.isEmpty()) {
          // Gebe nur Trails vom selektierten Feeder zurück
          try {
            trails.addAll(aircraftTrailRepository.findAllByHexAndFeederAndTimestampGreaterThanEqualOrderByTimestampAsc(hex, feeder, timeOneHourAgo));
          } catch (Exception e) {
            log.error("Server - DB error when retrieving all trails for aircraft with hex " + hex
                + ": Exception = " + e);
          }
        }
      }
    }

    trails = trails.stream().distinct().collect(Collectors.toList());
    trails.sort(Comparator.comparing(TrailSuperclass::getTimestamp));

    trails = trailHelperService.checkAircraftTrailsFor180Border(trails);

    return trails;
  }

  /**
   * Gibt alle gespeicherten Trails aus der letzten Stunde zurück
   *
   * @return List<List < AircraftTrail>>
   */
  public List<List<AircraftTrail>> getAllTrailsFromLastHour() {
    List<List<AircraftTrail>> trails = new ArrayList<>();
    long timeOneHourAgo = System.currentTimeMillis() - 3600000L;

    try {
      List<String> hexList = new ArrayList<>(aircraftTrailRepository.findAllHexUpdatedInLastHour());

      for (String hex : hexList) {
        List<AircraftTrail> allTrailsForHex = aircraftTrailRepository.findAllByHexAndTimestampGreaterThanEqualOrderByTimestampAsc(hex, timeOneHourAgo);
        allTrailsForHex = allTrailsForHex.stream().distinct().toList();
        allTrailsForHex = trailHelperService.checkAircraftTrailsFor180Border(allTrailsForHex);
        trails.add(allTrailsForHex);
      }
    } catch (Exception e) {
      log.error("Server - DB error when retrieving all trails : Exception = " + e);
    }

    return trails;
  }

  /**
   * Bestimmt, ob ein Flugzeug als 'reentered'-Flugzeug bezeichnet werden kann
   *
   * @param hex            String
   * @param selectedFeeder String
   * @return boolean
   */
  public boolean getIsReenteredAircraft(String hex, String selectedFeeder) {
    if (selectedFeeder != null && !selectedFeeder.isEmpty() && !selectedFeeder.equals("Opensky") && !selectedFeeder.equals("Airplanes-Live")) {
      try {
        long time = System.currentTimeMillis();

        AircraftTrail trail = aircraftTrailRepository.findFirstByHexAndFeederOrderByTimestampDesc(hex,
            selectedFeeder);

        return trail != null && (time - trail.getTimestamp() > 3000);
      } catch (Exception e) {
        log.error("Server - DB error when retrieving all trails for aircraft with hex " + hex + ": Exception = "
            + e);
        return false;
      }
    }
    return false;
  }

  /**
   * Methode kopiert alle Trails, die älter als ein Tag sind in die
   * HistoryTrails-Tabelle und löscht die betroffenen Trails aus der
   * AircraftTrails-Tabelle. Methode wird alle INTERVAL_REMOVE_OLD_TRAILS_LOCAL
   * Sekunden aufgerufen
   */
  @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_TRAILS_LOCAL)
  private void putOldTrailsInTrailsHistoryTable() {
    // Berechne timestamp vor 1 Tag (entspricht 86400000L
    // Millisekunden), damit nur alte Trails kopiert und gelöscht werden
    long oneDayInMilliSeconds = 86400000L;
    long timestampOneDayAgo = System.currentTimeMillis() - oneDayInMilliSeconds;

    aircraftTrailRepository.deleteAllByTimestampLessThanEqual(timestampOneDayAgo);

    // TODO: Einstiegspunkt zum Speichern der Trail History
  }

  public List<AircraftTrail> getActualOutlineFromLast24Hours(List<String> selectedFeeder) {
    if (selectedFeeder == null || selectedFeeder.isEmpty()) return null;

    List<AircraftTrail> aircraftTrails = null;
    final Map<Integer, AircraftTrail> maxDistancePerAngleMap = new ConcurrentHashMap<>();

    try {
      if (lastActualOutline == null || lastActualOutline.isEmpty() || !lastSelectedFeederForOutline.equals(selectedFeeder)
          || lastOutlineTimestamp == null) {
        lastOutlineTimestamp = System.currentTimeMillis();
        aircraftTrails = aircraftTrailRepository.findAllFromLast24Hours();
      } else {
        // Nutze bereits berechnete Outline von letzter Iteration
        aircraftTrails = lastActualOutline;
        List<AircraftTrail> newTrails = aircraftTrailRepository.findAllByTimestampGreaterThanEqualOrderByAngleToSite(lastOutlineTimestamp);
        aircraftTrails.addAll(newTrails);
        lastOutlineTimestamp = System.currentTimeMillis();

        // Filtere zu alte trails (> 24h)
        long time24Hours = System.currentTimeMillis() - 86400000L; // 1 Tag
        aircraftTrails.stream().filter(at -> at.getTimestamp() < time24Hours).collect(Collectors.toList());
      }

      // Filtere nach feeder
      aircraftTrails = aircraftTrails.stream()
          .filter(
              at -> Stream.of(at.getFeeder())
                  .anyMatch(selectedFeeder::contains))
          .toList();

      // Über die Liste iterieren und die maximale Distanz für jeden Winkel zur Site finden
      for (AircraftTrail trail : aircraftTrails) {
        final Integer angleToSite = trail.getAngleToSite();
        final Double distanceToSite = trail.getDistanceToSite();
        if (angleToSite == null || distanceToSite == null) continue;

        // Maximalen Abstand für den aktuellen Winkel aktualisieren
        if (!maxDistancePerAngleMap.containsKey(angleToSite) || distanceToSite > maxDistancePerAngleMap.get(angleToSite).getDistanceToSite()) {
          maxDistancePerAngleMap.put(angleToSite, trail);
        }
      }

      // Sortiere nach Winkeln
      aircraftTrails = maxDistancePerAngleMap.values().stream().sorted(Comparator.comparing(TrailSuperclass::getAngleToSite))
          .collect(Collectors.toList());

      lastActualOutline = aircraftTrails;
      lastSelectedFeederForOutline = selectedFeeder;
    } catch (Exception e) {
      log.error("Server - DB error when calculating actual range outline from feeder " + selectedFeeder +
          " and last 24 hours : Exception = {}", String.valueOf(e));
    }

    return aircraftTrails;
  }
}











