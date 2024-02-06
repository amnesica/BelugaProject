package com.amnesica.belugaproject.services.trails;

import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.Spacecraft;
import com.amnesica.belugaproject.entities.trails.SpacecraftTrail;
import com.amnesica.belugaproject.repositories.trails.SpacecraftTrailRepository;
import com.amnesica.belugaproject.services.helper.TrailHelperService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SpacecraftTrailService {
  @Autowired
  private SpacecraftTrailRepository spacecraftTrailRepository;
  @Autowired
  private TrailHelperService trailHelperService;

  /**
   * Methode speichert ein Trail-Element der ISS in der Tabelle spacecraft_trail
   *
   * @param spacecraft Spacecraft
   * @param feederName String
   */
  public void addTrail(Spacecraft spacecraft, String feederName) {
    if (spacecraft != null) {
      // Erstelle neues Trail-Element
      SpacecraftTrail trail = new SpacecraftTrail(spacecraft.getHex(), spacecraft.getLongitude(),
          spacecraft.getLatitude(), spacecraft.getAltitude(), spacecraft.getReenteredAircraft(),
          spacecraft.getLastUpdate(), feederName, spacecraft.getSourceCurrentFeeder(), spacecraft.getTrack(), spacecraft.getRoll());

      try {
        // Speichere Trail in Datenbank
        spacecraftTrailRepository.save(trail);
      } catch (Exception e) {
        log.error("Server - DB error when saving trail for spacecraft with hex " + trail.getHex()
            + ": Exception = " + e);
      }
    }
  }

  /**
   * Methode entfernt Trails die älter als drei Stunden sind aus der Tabelle
   * aircraft_trail. Methode wird alle INTERVAL_REMOVE_OLD_TRAILS_ISS Sekunden
   * aufgerufen
   */
  @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_TRAILS_ISS)
  private void removeOldTrails() {
    // Berechne timestamp vor 3 Stunden, damit nur alte Trails gelöscht werden
    long startTime = System.currentTimeMillis() - 10800000;

    // Hole Trails der aktuellen Iteration
    List<SpacecraftTrail> listOldTrails = spacecraftTrailRepository
        .findAllByTimestampLessThanEqual(startTime);

    // Entferne alte Trails
    if (listOldTrails != null) {
      spacecraftTrailRepository.deleteAll(listOldTrails);
    }
  }

  /**
   * Methode gibt alle Trails der ISS zurück
   *
   * @return List<SpacecraftTrail>
   */
  public List<SpacecraftTrail> getAllTrails() {
    List<SpacecraftTrail> trails = null;
    try {
      trails = spacecraftTrailRepository.findAllByHexOrderByTimestampAsc("ISS");
      if (trails != null)
        trails = trails.stream().distinct().collect(Collectors.toList());

      if (trails != null)
        trails = trailHelperService.checkSpacecraftTrailsFor180Border(trails);
    } catch (Exception e) {
      log.error("Server - DB error when retrieving all trails for iss : Exception = " + e);
    }
    return trails;
  }
}
