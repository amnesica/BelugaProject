package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.data.RegcodeData;
import com.amnesica.belugaproject.repositories.data.RegcodeDataRepository;
import com.amnesica.belugaproject.services.helper.HelperService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class RegcodeDataService {

    @Autowired
    private RegcodeDataRepository regcodeDataRepository;

    /**
     * Gibt alle Informationen über einen Registrierungs-Code mit Angabe des
     * regCode-Prefixes aus der Datenbank zurück
     *
     * @param regcodePrefix String
     * @return regcodeData
     */
    public RegcodeData getRegcodeData(String regcodePrefix) {
        RegcodeData regcodeData = null;

        if (regcodePrefix != null && !regcodePrefix.isEmpty() && !regcodePrefix.equals("null")) {
            // Hole Daten aus Datenbank mit Angabe des Registration-Prefixes (bspw. "D-")

            try {
                regcodeData = regcodeDataRepository.findByRegcodePrefix(regcodePrefix);
            } catch (Exception e) {
                log.error("Server - DB error on reading Regcode_Data for RegcodePrefix " + regcodePrefix
                        + ": Exception = " + e);
            }
        }

        return regcodeData;
    }

    public String getRegcodePrefix(String registration) {
        String regcodePrefix = null;
        int pos = -1;

        // Ermitteln Position des Bindestrichs innerhalb der Registration, z. B. bei
        // D-AIMA
        pos = registration.indexOf("-");

        // Meistens trennt der Bindestrich den Prefix vom Rest, aber es gibt Ausnahmen
        try {

            if (registration.charAt(0) == 'N') {
                regcodePrefix = "N";
            } else if (registration.startsWith("HL")) {
                regcodePrefix = "HL";
            } else if (registration.startsWith("JA")) {
                regcodePrefix = "JA";
            } else if (registration.startsWith("SU-Y")) {
                regcodePrefix = "SU-Y";
            } else if (registration.startsWith("VP-")) {
                regcodePrefix = registration.substring(0, 4);
            } else if (registration.startsWith("VQ-")) {
                regcodePrefix = registration.substring(0, 4);
            } else if (pos != -1) {
                regcodePrefix = registration.substring(0, pos + 1);
            }

        } catch (Exception e) {
            // handle exception
            log.warn("Warning Server: Exception in getRegcodePrefix during registration " + registration + ": " + e);
        }

        return regcodePrefix;
    }

    /**
     * Fügt zusätzliche Informationen zur Registrierung aus Datenbank-Tabellen hinzu
     *
     * @param aircraft Aircraft
     */
    public void addRegcodeData(AircraftSuperclass aircraft) {

        // Lese Regcode-Data hinzu
        if (aircraft.getRegistration() != null && !aircraft.getRegistration().isEmpty()) {

            // aus der Registrierung (z. B. "D-AIMA") den Prefix ("D-")ermitteln und mit
            // diesem dann die Dasten lesen
            RegcodeData regcodeData = getRegcodeData(getRegcodePrefix(aircraft.getRegistration()));

            if (regcodeData != null && regcodeData.getRegcodeName() != null
                    && !regcodeData.getRegcodeName().isEmpty()) {
                aircraft.setRegCodeName(regcodeData.getRegcodeName());

                // Konvertiere Flagge in HTML-verarbeitbaren String, damit dieser richtig
                // angezeigt wird
                String flagCodeConverted = HelperService.convertFlagCodeToHTML(regcodeData.getRegcodeFlagUtf8code());
                aircraft.setRegCodeNameFlag(flagCodeConverted);
            }
        }

    }

}
