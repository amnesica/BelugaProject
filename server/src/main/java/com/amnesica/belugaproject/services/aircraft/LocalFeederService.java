package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.entities.data.AirportData;
import com.amnesica.belugaproject.repositories.aircraft.AircraftRepository;
import com.amnesica.belugaproject.services.data.AircraftDataService;
import com.amnesica.belugaproject.services.data.AirportDataService;
import com.amnesica.belugaproject.services.data.RangeDataService;
import com.amnesica.belugaproject.services.helper.NetworkHandlerService;
import com.amnesica.belugaproject.services.trails.AircraftTrailService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Slf4j
@EnableScheduling
@Service
public class LocalFeederService {
    @Autowired
    private AircraftService aircraftService;

    @Autowired
    private NetworkHandlerService networkHandler;

    @Autowired
    private AircraftDataService aircraftDataService;
    @Autowired
    private HistoryAircraftService historyAircraftService;
    @Autowired
    private AircraftTrailService aircraftTrailService;
    @Autowired
    private AirportDataService airportDataService;
    @Autowired
    private RangeDataService rangeDataService;

    @Autowired
    private AircraftRepository aircraftRepository;

    @Autowired
    private Configuration configuration;

    // Sets mit hex der Flugzeuge, um Flugzeuge temporär zu speichern
    // (nötig um feederList und sourceList jeweils zu füllen)
    private final HashSet<String> currentIterationSet = new HashSet<>();
    private final HashSet<String> previousIterationSet = new HashSet<>();

    /**
     * Methode fragt Flugzeuge von den lokalen Feedern ab und speichert diese in der
     * Tabelle aircraft. Methode wird alle INTERVAL_UPDATE_LOCAL_FEEDER Sekunden
     * aufgerufen
     */
    @Scheduled(fixedRate = StaticValues.INTERVAL_UPDATE_LOCAL_FEEDER)
    private void getPlanesFromFeeder() {
        // Hole und verarbeite Flugzeuge von jedem Feeder
        for (Feeder feeder : configuration.getListFeeder()) {
            // Breche ab, wenn aus einem Grund der Feeder null ist
            if (feeder == null) return;

            // Hole Planes vom lokalen Feeder als JSONArray
            JSONArray jsonArrayPlanesFeeder = getAircraftJSONFromLocalFeeder(feeder);

            // Wenn JSONArray null ist, breche Vorgang ab und fahre mit nächstem Feeder fort
            if (jsonArrayPlanesFeeder == null) continue;

            // Füge Flugzeuge in Datenbank hinzu oder update Flugzeuge in Datenbank
            for (int i = 0; i < jsonArrayPlanesFeeder.length(); i++) {

                // Extrahiere element aus JSONArray
                JSONObject element = jsonArrayPlanesFeeder.getJSONObject(i);

                // Prüfe, ob element alle Basis-Eigenschaften erfüllt (bspw. 'lat','lon' sind vorhanden)
                if (element != null && element.has("hex") && element.has("lat") && element.has("lon")
                        && !element.isNull("lat") && !element.isNull("lon")
                        && element.getDouble("lat") != 0 && element.getDouble("lon") != 0) {

                    // Erstelle aus Daten des Feeders ein neues Flugzeug
                    Aircraft aircraftNew = aircraftService.createNewAircraft(element, feeder);

                    // Füge hex mit feeder zu currentIterationSet hinzu
                    currentIterationSet.add(aircraftNew.getHex());

                    // Aktualisiere Flugzeug aus Datenbank oder
                    // füge neues Flugzeug zur Datenbank hinzu
                    if (aircraftRepository.existsById(aircraftNew.getHex())) {

                        // Prüfe, ob Flugzeug in Datenbank-Tabelle enthalten ist
                        Aircraft aircraftInDb = aircraftRepository.findByHex(aircraftNew.getHex());

                        // Wenn Flugzeug in der letzten Iteration vorhanden war, lösche Feeder-Liste und Source-Liste,
                        // damit nach der Iteration nur die Feeder und die Sources in der Liste stehen,
                        // welche das Flugzeug geupdated haben (nur der erste Feeder pro Iteration soll die Listen löschen)
                        if (previousIterationSet.contains(aircraftNew.getHex())) {
                            previousIterationSet.remove(aircraftNew.getHex());
                            aircraftInDb.clearFeederList();
                            aircraftInDb.clearSourceList();
                        }

                        // Update Werte des Flugzeugs mit Werten von aircraftNew
                        aircraftService.updateValuesOfAircraft(aircraftInDb, aircraftNew, feeder, true);

                        try {
                            // Schreibe Flugzeug in aircraft-Tabelle
                            aircraftRepository.save(aircraftInDb);
                        } catch (Exception e) {
                            log.error("Server - DB error when writing aircraftInDb for hex " + aircraftInDb.getHex()
                                    + ": Exception = " + e);
                        }
                    } else {
                        // Füge Informationen aus aircraftData hinzu
                        aircraftDataService.addAircraftData(aircraftNew);

                        // Setze Boolean, dass Flugzeug nicht von Opensky ist
                        aircraftNew.setIsFromOpensky(false);

                        // Füge Timestamp als Zeitpunkt des letzten Updates an
                        aircraftNew.setLastUpdate(System.currentTimeMillis());

                        // Erstelle Range-Data Eintrag (Flugzeug empfangen!)
                        rangeDataService.createAndSaveRangeDataEntry(aircraftNew);

                        // Speichere Trail
                        aircraftTrailService.addTrail(aircraftNew, feeder.getName());

                        try {
                            // Schreibe Flugzeug in aircraft-Tabelle
                            aircraftRepository.save(aircraftNew);
                        } catch (Exception e) {
                            log.error("Server - DB error when writing aircraftNew for hex " + aircraftNew.getHex()
                                    + ": Exception = " + e);
                        }
                    }
                }
            }
        }

        // Schreibe currentIterationSet in previousIterationSet
        previousIterationSet.addAll(currentIterationSet);
    }

    /**
     * Methode kopiert alle Flugzeuge, die länger als eine Stunde nicht geupdatet
     * wurden in die History-Tabelle und löscht die betroffenen Flugzeuge aus der
     * aircraft-Tabelle. Methode wird alle INTERVAL_LOCAL_PLANES_TO_HISTORY
     * Millisekunden aufgerufen
     */
    @Scheduled(fixedRate = StaticValues.INTERVAL_LOCAL_PLANES_TO_HISTORY)
    private void putOldPlanesInHistoryTable() {
        // Berechne timestamp vor 1 Stunde (3600 Sekunden, entspricht 3600000
        // Millisekunden), damit nur die Flugzeuge kopiert werden, die nicht mehr
        // aktualisiert werden
        long startTime = System.currentTimeMillis() - 3600000;

        // Hole Flugzeuge der aktuellen Iteration
        List<Aircraft> listPlanesNotUpdated = aircraftRepository
                .findAllByLastUpdateLessThanEqual(startTime);

        if (listPlanesNotUpdated != null) {
            // Erstelle Range-Date Eintrag (Flugzeug verloren!) und
            // lösche Daten der planespotters.net API, damit diese
            // nicht länger als 24h in der Db gespeichert werden
            for (Aircraft aircraft : listPlanesNotUpdated) {
                rangeDataService.createAndSaveRangeDataEntry(aircraft);

                aircraft.setUrlPhotoDirect(null);
                aircraft.setUrlPhotoWebsite(null);
                aircraft.setPhotoPhotographer(null);
            }

            // Packe nicht geupdatete Flugzeuge in History-Tabelle
            boolean successful = historyAircraftService.putListPlanesInHistoryTable(listPlanesNotUpdated);

            // Wenn Speicherung in History-Tabelle erfolgreich war, lösche alle betroffenen
            // Flugzeuge aus der Aircraft-Tabelle
            if (successful) {
                aircraftRepository.deleteAll(listPlanesNotUpdated);
            }
        }
    }

    /**
     * Wandelt die Flugzeuge von einer url eines Feeder in ein Aircraft-Objekt um
     * und fügt dieses der Liste aircraftList hinzu. Dopplungen (selber hex) werden
     * nicht hinzugefügt.
     *
     * @param feeder Feeder
     */
    private JSONArray getAircraftJSONFromLocalFeeder(Feeder feeder) {
        if (feeder.getIpAddress() != null && !feeder.getIpAddress().isEmpty()) {
            // Anfrage an Feeder mit url
            String jsonStr = networkHandler.makeServiceCallLocalFeeder(feeder.getIpAddress());

            try {
                if (jsonStr != null) {
                    JSONArray jsonArray;

                    // Erstelle jsonArray aus jsonStr vom Feeder
                    if (feeder.getType().equals("airsquitter")) {
                        jsonArray = new JSONArray(jsonStr);
                    } else {
                        JSONObject jsonObject = new JSONObject(jsonStr);
                        jsonArray = jsonObject.getJSONArray("aircraft");
                    }

                    return jsonArray;
                }
            } catch (Exception e) {
                log.error("Server: Temporary aircraft list could not be updated from " + feeder.getIpAddress() + ": Exception = " + e);
            }
        }
        return null;
    }

    /**
     * Sucht alle Informationen über ein Flugzeug (aircraft) zusammen und gibt diese
     * zurück. Hinweis: Diese Funktion funktioniert nur für ein Flugzeug der Klasse
     * Aircraft
     *
     * @param hex          String
     * @param registration String
     * @return Object[] (Aircraft-Objekt, AirportData originAirportData, AirportData
     * destinationAirportData)
     */
    public Object[] getAllAircraftData(String hex, String registration) {
        if (hex != null && registration != null && !hex.isEmpty() && !registration.isEmpty()) {
            // Hole Flugzeug aus Datenbank
            Aircraft aircraft = aircraftRepository.findByHex(hex);

            if (aircraft != null) {
                // Setze Photo-Urls
                aircraftService.setAircraftPhotoUrls(aircraft);

                // Setze weitere Informationen an Flugzeug
                aircraftService.addInformationToAircraft(aircraft);

                // Hole Informationen über Herkunfts- und Zielflughafen
                AirportData originAirportData = null;
                AirportData destinationAirportData = null;
                if (aircraft.getOrigin() != null && !aircraft.getOrigin().isEmpty()) {
                    originAirportData = airportDataService.getAirportData(aircraft.getOrigin());
                }
                if (aircraft.getDestination() != null && !aircraft.getDestination().isEmpty()) {
                    destinationAirportData = airportDataService.getAirportData(aircraft.getDestination());
                }

                // Speichere Flugzeug in Datenbank
                try {
                    aircraftRepository.save(aircraft);
                } catch (Exception e) {
                    log.error("Server - DB error when saving aircraft : Exception = " + e);
                }

                // Baue Array als Rückgabewert
                return new Object[]{aircraft, originAirportData, destinationAirportData};
            }
        }

        return null;
    }

    /**
     * Gibt alle Flugzeuge innerhalb eines Extents zurück. Dabei beachtet wird der
     * ausgewählte Feeder und der gewünschte Zeitpunkt des letzten Updates der
     * Flugzeuge
     *
     * @param lomin          lower bound for the longitude in decimal degrees
     * @param lamin          lower bound for the latitude in decimal degrees
     * @param lomax          upper bound for the longitude in decimal degrees
     * @param lamax          upper bound for the latitude in decimal degrees
     * @param selectedFeeder Ausgewählter Feeder (oder 'AllFeeder')
     * @param startTime      Zeitpunkt des letzten Updates
     * @return List<Aircraft>
     */
    public List<Aircraft> getPlanesWithinExtent(double lomin, double lamin, double lomax, double lamax,
                                                String selectedFeeder, long startTime) {
        List<Aircraft> listAircraftRaw = null;

        try {
            if (selectedFeeder != null && !selectedFeeder.isEmpty() && !selectedFeeder.equals("AllFeeder")) {
                // Gebe Flugzeuge eines bestimmten Feeders zurück
                listAircraftRaw = aircraftRepository.findAllByLastUpdateAndFeederAndWithinExtent(
                        startTime, selectedFeeder, lomin, lamin, lomax, lamax);
            } else if (selectedFeeder != null && !selectedFeeder.isEmpty()) {
                // Gebe Flugzeuge aller Feeder zurück
                listAircraftRaw = aircraftRepository.findAllByLastUpdateAndWithinExtent(startTime,
                        lomin, lamin, lomax, lamax);
            }
        } catch (Exception e) {
            log.error("Server - DB error when fetching planes : Exception = " + e);
        }

        return listAircraftRaw;
    }
}
