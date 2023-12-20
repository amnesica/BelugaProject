package com.amnesica.belugaproject.services.trails;

import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import com.amnesica.belugaproject.entities.trails.TrailSuperclass;
import com.amnesica.belugaproject.repositories.trails.AircraftTrailRepository;
import com.amnesica.belugaproject.services.helper.TrailHelperService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AircraftTrailService {
  @Autowired
  private AircraftTrailRepository aircraftTrailRepository;
  @Autowired
  private TrailHelperService trailHelperService;

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
   * Gibt alle Trails zu einem Hex und einem Feeder zurück
   *
   * @param hex            String
   * @param selectedFeeder String
   * @return List<AircraftTrail>
   */
  public List<AircraftTrail> getAllTrails(String hex, List<String> selectedFeeder) {
    List<AircraftTrail> trails = new ArrayList<>();
    if (hex != null && !hex.isEmpty()) {
      for (String feeder : selectedFeeder) {
        if (feeder != null && !feeder.isEmpty()) {
          // Gebe nur Trails vom selektierten Feeder zurück
          try {
            trails.addAll(aircraftTrailRepository.findAllByHexAndFeederOrderByTimestampAsc(hex, feeder));
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
   * Gibt alle gespeicherten Trails zurück
   *
   * @return List<List < AircraftTrail>>
   */
  public List<List<AircraftTrail>> getAllTrails() {
    List<List<AircraftTrail>> trails = new ArrayList<>();

    try {
      List<String> hexList = new ArrayList<>(aircraftTrailRepository.findAllHex());

      for (String hex : hexList) {
        List<AircraftTrail> allTrailsForHex = aircraftTrailRepository.findAllByHexOrderByTimestampAsc(hex);
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
    if (selectedFeeder != null && !selectedFeeder.isEmpty()) {
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
   * Methode kopiert alle Trails, die älter als eine Stunde sind
   * in die HistoryTrails-Tabelle und löscht die betroffenen Trails aus der
   * AircraftTrails-Tabelle. Methode wird alle INTERVAL_REMOVE_OLD_TRAILS_LOCAL
   * Sekunden aufgerufen
   */
  @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_TRAILS_LOCAL)
  private void putOldTrailsInTrailsHistoryTable() {
    // Berechne timestamp vor 1 Stunde (3600 Sekunden, entspricht 3600000
    // Millisekunden), damit nur alte Trails kopiert und gelöscht werden
    long startTime = System.currentTimeMillis() - 3600000;

    // Hole Trails der aktuellen Iteration
    List<AircraftTrail> listOldTrails = aircraftTrailRepository
        .findAllByTimestampLessThanEqual(startTime);

    // Kopiere und lösche alle alten Trails
    if (listOldTrails != null) {
      // Lösche alle betroffenen Flugzeuge aus der AircraftTrails-Tabelle
      // TODO: Einstiegspunkt zum Speichern der Trail History
      aircraftTrailRepository.deleteAll(listOldTrails);
    }
  }
}











