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
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AircraftTrailService {
  @Autowired
  private AircraftTrailRepository aircraftTrailRepository;
  @Autowired
  private TrailHelperService trailHelperService;
  @Autowired
  private Configuration configuration;

  // key: feeder name, value: map for feeder (angleToSite, trail)
  final Map<String, Map<Integer, AircraftTrail>> actualOutlineMap = new ConcurrentHashMap<>();

  private final double EFFECTIVE_MAX_RANGE_KM = 666.72;

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

      trail.setFlightId(aircraft.getFlightId());
      trail.setRegistration(aircraft.getRegistration());
      trail.setCategory(aircraft.getCategory());
      trail.setType(aircraft.getType());

      addDistanceAndAngleToSite(trail);
      addTrailToOutlineMapIfNecessary(trail, feederName);

      try {
        // Speichere Trail in Datenbank
        aircraftTrailRepository.save(trail);
      } catch (Exception e) {
        log.error("Server - DB error when saving trail for aircraft with hex " + trail.getHex()
            + ": Exception = " + e);
      }
    }
  }

  public void addTrailToOutlineMapIfNecessary(AircraftTrail trail, String feederName) {
    if (trail.getDistanceToSite() == null || trail.getAngleToSite() == null) return;

    Map<Integer, AircraftTrail> outlineMapForFeeder = actualOutlineMap.get(feederName);
    if (outlineMapForFeeder == null) outlineMapForFeeder = new ConcurrentHashMap<>();

    final AircraftTrail trailAtSameAngle = outlineMapForFeeder.get(trail.getAngleToSite());

    if (trail.getDistanceToSite() > EFFECTIVE_MAX_RANGE_KM) return; // trail ist Outlier (max distance ist 360nm)

    if (trailAtSameAngle == null || // angle in map existiert noch nicht
        trail.getDistanceToSite() >= trailAtSameAngle.getDistanceToSite() || // neuer trail hat höhere distance
        trailAtSameAngle.getTimestamp() < System.currentTimeMillis() - 86400000L) // existierender trail ist älter als 24h
    {
      outlineMapForFeeder.put(trail.getAngleToSite(), trail);
      actualOutlineMap.put(feederName, outlineMapForFeeder);
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
   * Methode kopiert alle Trails, die älter als eine Stunde sind in die
   * HistoryTrails-Tabelle und löscht die betroffenen Trails aus der
   * AircraftTrails-Tabelle. Methode wird alle INTERVAL_REMOVE_OLD_TRAILS_LOCAL
   * Sekunden aufgerufen
   */
  @Transactional
  @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_TRAILS_LOCAL)
  protected void putOldTrailsInTrailsHistoryTable() {
    long oneHourInMilliSeconds = 3600000L;
    long timestampOneDayAgo = System.currentTimeMillis() - oneHourInMilliSeconds;

    aircraftTrailRepository.deleteAllByTimestampLessThanEqual(timestampOneDayAgo);

    // TODO: Einstiegspunkt zum Speichern der Trail History
  }

  public List<AircraftTrail> getActualOutlineFromLast24Hours(List<String> selectedFeeder) {
    if (selectedFeeder == null || selectedFeeder.isEmpty()) return null;

    // Map zur Speicherung des maximalen AircraftTrail für jeden Winkel für alle selectedFeeder insgesamt
    Map<Integer, AircraftTrail> maxTrailsPerAngle = new ConcurrentHashMap<>();

    for (String feeder : selectedFeeder) {
      Map<Integer, AircraftTrail> feederMap = actualOutlineMap.get(feeder);
      if (feederMap != null) {
        for (Map.Entry<Integer, AircraftTrail> entry : feederMap.entrySet()) {
          final Integer angleToSite = entry.getKey();
          final AircraftTrail trail = entry.getValue();

          if (angleToSite == null || trail == null) continue;

          // Vergleichen und speichern des maximalen Trails pro Winkel
          maxTrailsPerAngle.merge(angleToSite, trail, (existingTrail, newTrail) ->
              (newTrail.getDistanceToSite() > existingTrail.getDistanceToSite()) ? newTrail : existingTrail);
        }
      }
    }

    return maxTrailsPerAngle.values().stream().sorted(Comparator.comparing(TrailSuperclass::getAngleToSite))
        .collect(Collectors.toList());
  }
}











