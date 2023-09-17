package com.amnesica.belugaproject.services.trails;

import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import com.amnesica.belugaproject.entities.trails.HistoryAircraftTrail;
import com.amnesica.belugaproject.repositories.trails.HistoryAircraftTrailRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class HistoryAircraftTrailService {

  @Autowired
  private HistoryAircraftTrailRepository historyAircraftTrailRepository;

  /**
   * Speichert eine Liste an Trails in der HistoryTrails-Tabelle
   *
   * @param listTrailsToInsert List<AircraftTrail>
   */
  public boolean putListTrailsInTrailsHistoryTable(List<AircraftTrail> listTrailsToInsert) {
    // Konvertiere AircraftTrails zu HistoryAircraftTrails
    List<HistoryAircraftTrail> listTrailsForHistory = convertTrailsListToHistoryAircraftTrailsList(
        listTrailsToInsert);

    // Speichere HistoryAircraftTrails in Datenbank
    try {
      historyAircraftTrailRepository.saveAll(listTrailsForHistory);
      return true;
    } catch (Exception e) {
      log.error(
          "Server - DB error when trying to save all converted aircraft trails into HistoryAircraftTrails table : Exception = "
              + e);
      return false;
    }
  }

  /**
   * Konvertiert eine Liste an Trails (AircraftTrail) zu einer Liste an
   * HistoryAircraftTrail
   *
   * @param listTrailsToConvert List<AircraftTrail>
   * @return List<HistoryAircraftTrail>
   */
  private List<HistoryAircraftTrail> convertTrailsListToHistoryAircraftTrailsList(List<AircraftTrail> listTrailsToConvert) {
    List<HistoryAircraftTrail> listTrailsForHistory = new ArrayList<>();

    for (AircraftTrail aircraftTrail : listTrailsToConvert) {
      try {
        // Konvertiere Flugzeug
        HistoryAircraftTrail historyAircraftTrail = HistoryAircraftTrail.makeCopy(aircraftTrail);

        // Füge konvertierten Trail in Liste ein
        listTrailsForHistory.add(historyAircraftTrail);
      } catch (Exception e) {
        log.error("Server - DB error when converting aircraft trails into HistoryAircraftTrails at trail for hex "
            + aircraftTrail.getHex() + " from feeder " + aircraftTrail.getFeeder() + " : Exception = " + e);
      }
    }

    return listTrailsForHistory;
  }
}
