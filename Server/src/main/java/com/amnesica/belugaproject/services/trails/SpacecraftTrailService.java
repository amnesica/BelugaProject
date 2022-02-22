package com.amnesica.belugaproject.services.trails;

import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.Spacecraft;
import com.amnesica.belugaproject.entities.trails.SpacecraftTrail;
import com.amnesica.belugaproject.repositories.trails.SpacecraftTrailRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class SpacecraftTrailService {
    @Autowired
    private SpacecraftTrailRepository spacecraftTrailRepository;

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
                    System.currentTimeMillis(), feederName, spacecraft.getSourceCurrentFeeder());

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
     * Methode entfernt Trails die älter als eine Stunde sind aus der Tabelle
     * aircraft_trail. Methode wird alle INTERVAL_REMOVE_OLD_TRAILS_ISS Sekunden
     * aufgerufen
     */
    @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_TRAILS_ISS)
    private void removeOldTrails() {
        // Berechne timestamp vor 1 Stunde (3600 Sekunden, entspricht 3600000
        // Millisekunden), damit nur alte Trails gelöscht werden
        long startTime = System.currentTimeMillis() - 3600000;

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
        } catch (Exception e) {
            log.error("Server - DB error when retrieving all trails for iss : Exception = " + e);
        }
        return trails;
    }
}
