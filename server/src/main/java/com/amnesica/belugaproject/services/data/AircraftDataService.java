package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.data.AircraftData;
import com.amnesica.belugaproject.repositories.data.AircraftDataRepository;
import com.amnesica.belugaproject.services.aircraft.AircraftService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AircraftDataService {

    @Autowired
    private AircraftDataRepository aircraftDataRepository;

    @Autowired
    private AircraftService aircraftService;

    /**
     * Gibt alle Informationen über ein Flugzeug mit Angabe der hex aus der
     * Datenbank zurück
     *
     * @return AircraftData
     */
    public void addAircraftData(AircraftSuperclass aircraft) {
        AircraftData aircraftData = null;

        if (aircraft.getHex() != null && !aircraft.getHex().isEmpty() && !aircraft.getHex().equals("null") && !aircraft.getHex().equals("ISS")) {
            // Hole Daten aus Datenbank mit Angabe der Hex

            try {
                aircraftData = aircraftDataRepository.findByHex(aircraft.getHex());
            } catch (Exception e) {
                log.error("Server - DB-Error when reading AircraftData for hex " + aircraft.getHex() + ": Exception = "
                        + e);
            }

            if (aircraftData != null) {
                // Speichere Informationen am Flugzeug
                if ((aircraft.getRegistration() == null || aircraft.getRegistration().isEmpty())
                        && !aircraftData.getRegistration().isEmpty()) {
                    aircraft.setRegistration(aircraftData.getRegistration().trim());
                }

                if ((aircraft.getType() == null || aircraft.getType().isEmpty())
                        && !aircraftData.getTypecode().isEmpty()) {
                    aircraft.setType(aircraftData.getTypecode().trim());
                }

                if (aircraft.getFullType() == null || aircraft.getFullType().isEmpty()) {
                    String manufacturerName = aircraftData.getManufacturerName();
                    String model = aircraftData.getModel();

                    if (manufacturerName != null && model != null) {
                        aircraft.setFullType(manufacturerName.trim() + " " + model.trim());
                    }
                }

                if (!aircraftData.getOperatorIcao().isEmpty()) {
                    aircraft.setOperatorIcao(aircraftData.getOperatorIcao().trim());
                }

                if (!aircraftData.getSerialNumber().isEmpty()) {
                    aircraft.setSerialNumber(aircraftData.getSerialNumber().trim());
                }

                if (!aircraftData.getLineNumber().isEmpty()) {
                    aircraft.setLineNumber(aircraftData.getLineNumber().trim());
                }

                if (!aircraftData.getTestReg().isEmpty()) {
                    aircraft.setTestReg(aircraftData.getTestReg().trim());
                }

                if (!aircraftData.getRegistered().isEmpty()) {
                    aircraft.setRegistered(aircraftData.getRegistered().trim());
                }

                if (!aircraftData.getRegUntil().isEmpty()) {
                    aircraft.setRegUntil(aircraftData.getRegUntil().trim());
                }

                if (!aircraftData.getStatus().isEmpty()) {
                    aircraft.setStatus(aircraftData.getStatus().trim());
                }

                if (!aircraftData.getBuilt().isEmpty()) {
                    String built = aircraftData.getBuilt();
                    aircraft.setBuilt(aircraftData.getBuilt().trim());

                    // Berechne Alter des Flugzeugs und setze dieses
                    aircraftService.calcAndSetAge(aircraft, built);
                }

                if (!aircraftData.getFirstFlightDate().isEmpty()) {
                    aircraft.setFirstFlightDate(aircraftData.getFirstFlightDate().trim());
                }

                if (!aircraftData.getIcaoAircraftType().isEmpty()) {
                    aircraft.setIcaoAircraftType(aircraftData.getIcaoAircraftType().trim());
                }

                if (!aircraftData.getEngines().isEmpty()) {
                    String engines = aircraftData.getEngines().trim();
                    if(engines.contains("<br>")){
                        engines = engines.replace("<br>", "");
                    }
                    aircraft.setEngines(engines);
                }
            }
        }
    }
}
