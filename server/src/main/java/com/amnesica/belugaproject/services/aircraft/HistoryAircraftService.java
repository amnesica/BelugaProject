package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.entities.aircraft.HistoryAircraft;
import com.amnesica.belugaproject.repositories.aircraft.HistoryAircraftRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class HistoryAircraftService {

    @Autowired
    private HistoryAircraftRepository historyAircraftRepository;

    /**
     * Speichert eine Liste an Flugzeuge in der History-Tabelle
     *
     * @param listPlanesToInsert List<Aircraft>
     */
    public boolean putListPlanesInHistoryTable(List<Aircraft> listPlanesToInsert) {
        // Konvertiere Aircraft zu HistoryAircraft
        List<HistoryAircraft> listPlanesForHistory = convertPlanesListToHistoryAircraftList(
                listPlanesToInsert);

        // Speichere HistoryAircraft in Datenbank
        try {
            historyAircraftRepository.saveAll(listPlanesForHistory);
            return true;
        } catch (Exception e) {
            log.error(
                    "Server - DB error when trying to save all converted planes into HistoryAircraft table : Exception = "
                            + e);
            return false;
        }
    }

    /**
     * Konvertiert eine Liste an Flugzeugen (Aircraft) zu einer Liste an
     * HistoryAircraft
     *
     * @param listPlanesToConvert List<Aircraft>
     * @return List<HistoryAircraft>
     */
    private List<HistoryAircraft> convertPlanesListToHistoryAircraftList(List<Aircraft> listPlanesToConvert) {
        List<HistoryAircraft> listPlanesForHistory = new ArrayList<>();

        for (Aircraft aircraft : listPlanesToConvert) {
            try {
                // Konvertiere Flugzeug
                HistoryAircraft historyAircraft = HistoryAircraft.makeCopy(aircraft);

                // Füge konvertiertes Flugzeug in Liste ein
                listPlanesForHistory.add(historyAircraft);
            } catch (Exception e) {
                log.error("Server - DB error when converting planes into HistoryAircraft at hex "
                        + aircraft.getHex() + " : Exception = " + e);
            }
        }

        return listPlanesForHistory;
    }

    /**
     * Löscht alle History-Aircraft endgültig, welche älter sind als RETENTION_DAYS_AIRCRAFT_IN_HISTORY.
     * Methode wird als cron-job mit Parameter aus INTERVAL_REMOVE_OLD_AIRCRAFT_FROM_HISTORY aufgerufen
     */
    @Transactional
    @Scheduled(cron = StaticValues.INTERVAL_REMOVE_OLD_AIRCRAFT_FROM_HISTORY)
    private void deleteOldAircraftFromHistory() {
        int retention_days = StaticValues.RETENTION_DAYS_AIRCRAFT_IN_HISTORY;

        // Lösche History-Aircraft, welche älter sind als retention_days
        try {
            log.info("Job deleteOldAircraftFromHistory scheduled with Parameters: [cron = " +
                    StaticValues.INTERVAL_REMOVE_OLD_AIRCRAFT_FROM_HISTORY +
                    "] [retention_days = " + StaticValues.RETENTION_DAYS_AIRCRAFT_IN_HISTORY + "]");
            historyAircraftRepository.deleteAllByLastUpdateLessThanEqual(retention_days + " days");
        } catch (Exception e) {
            log.error("Server - DB error when removing planes from HistoryAircraft older than "
                    + retention_days + " days : Exception = " + e);
        }
    }
}
