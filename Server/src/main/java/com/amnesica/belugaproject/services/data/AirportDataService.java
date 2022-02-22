package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.data.AirportData;
import com.amnesica.belugaproject.repositories.data.AirportDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class AirportDataService {

    @Autowired
    private AirportDataRepository airportDataRepository;

    /**
     * Gibt alle Informationen über einen Flughafen mit Angabe der ident aus der
     * Datenbank zurück
     *
     * @param ident String
     * @return AirportData
     */
    public AirportData getAirportData(String ident) {
        AirportData airportData = null;

        if (ident != null && !ident.isEmpty() && !ident.equals("null")) {
            // Hole Daten aus Datenbank mit Angabe der Ident (bspw. "EDHI")

            try {
                airportData = airportDataRepository.findByIdent(ident);
            } catch (Exception e) {
                log.error("Server - DB error while reading AirportData for ident " + ident + ": Exception = " + e);
            }

        }

        return airportData;
    }

    /**
     * Gibt alle Flughäfen innerhalb eines Extents zurück
     *
     * @param lomin     lower bound for the longitude in decimal degrees
     * @param lamin     lower bound for the latitude in decimal degrees
     * @param lomax     upper bound for the longitude in decimal degrees
     * @param lamax     upper bound for the latitude in decimal degrees
     * @param zoomLevel Aktuelles Zoomlevel
     * @return List<AirportData>
     */
    public List<AirportData> getAirportsInExtent(double lomin, double lamin, double lomax, double lamax,
                                                 double zoomLevel) {
        List<AirportData> listAirports = null;

        try {
            // Wenn Zoom-Level > 8 ist, zeige alle Flughäfen an
            if (zoomLevel > 8) {
                listAirports = (List<AirportData>) airportDataRepository.findAllWithinExtent(lomin, lamin, lomax,
                        lamax);
            }
            // Wenn Zoom-Level = 8 ist, zeige große und mittlere Flughäfen an
            else if (zoomLevel == 8) {
                listAirports = (List<AirportData>) airportDataRepository
                        .findAllMediumAndLargeAirportsWithinExtent(lomin, lamin, lomax, lamax);
            } else {
                listAirports = (List<AirportData>) airportDataRepository.findAllLargeAirportsWithinExtent(lomin, lamin,
                        lomax, lamax);
            }

        } catch (Exception e) {
            log.error("Server - DB error when fetching airports from database: Exception = " + e);
        }

        return listAirports;
    }
}
