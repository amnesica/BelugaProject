package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.data.CountryData;
import com.amnesica.belugaproject.repositories.data.CountryDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CountryDataService {

    @Autowired
    private CountryDataRepository countryDataRepository;

    /**
     * Gibt alle Informationen über ein Land mit Angabe der ident aus der Datenbank
     * zurück
     *
     * @param countryIso2letter String
     * @return CountryData
     */
    public CountryData getCountryData(String countryIso2letter) {
        CountryData countryData = null;

        if (countryIso2letter != null && !countryIso2letter.isEmpty() && !countryIso2letter.equals("null")) {
            // Hole Daten aus Datenbank mit Angabe der Ident (bspw. "de")
            // ident = iso2letter-Code für das Land

            try {
                countryData = countryDataRepository.findByCountryIso2letter(countryIso2letter);
            } catch (Exception e) {
                log.error("Server - DB error reading CountryData for countryIso2letter " + countryIso2letter
                        + ": Exception = " + e);
            }

        }

        return countryData;
    }

}
