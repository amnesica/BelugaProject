package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.data.FlightrouteData;
import com.amnesica.belugaproject.repositories.data.FlightrouteDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FlightrouteDataService {

    @Autowired
    private FlightrouteDataRepository flightrouteDataRepository;

    /**
     * Gibt alle Informationen über eine Flightroute mit Angabe des flightID aus der
     * Datenbank zurück
     *
     * @param flightId String
     * @return flightrouteData
     */
    public FlightrouteData getFlightrouteData(String flightId) {
        FlightrouteData flightrouteData = null;

        if (flightId != null && !flightId.isEmpty() && !flightId.equals("null")) {
            flightId = flightId.trim();

            // Hole Daten aus Datenbank mit Angabe der flightId (bspw. "DLH01LP")
            try {
                flightrouteData = flightrouteDataRepository.findByFlightId(flightId);
            } catch (Exception e) {
                log.error("Server - DB error while reading FlightrouteData for FlightId " + flightId + ": Exception = "
                        + e);
            }

        }

        return flightrouteData;
    }

    /**
     * Fügt zusätzliche Informationen zur Flugroute aus Datenbank-Tabellen hinzu
     *
     * @param aircraft AircraftSuperclass
     */
    public void addFlightrouteData(AircraftSuperclass aircraft) {

        // Lese Flugrouten-Information für flightId hinzu
        if (aircraft.getFlightId() != null && !aircraft.getFlightId().isEmpty()) {
            FlightrouteData flightrouteData = getFlightrouteData(aircraft.getFlightId());
            if (flightrouteData != null && flightrouteData.getFlightRoute().length() == 9) {
                aircraft.setOrigin(flightrouteData.getFlightRoute().substring(0, 4));
                aircraft.setDestination(flightrouteData.getFlightRoute().substring(5, 9));
            }
        }
    }
}
