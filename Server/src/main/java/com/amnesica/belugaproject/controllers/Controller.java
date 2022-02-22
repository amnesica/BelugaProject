package com.amnesica.belugaproject.controllers;

import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.data.AirportData;
import com.amnesica.belugaproject.entities.data.RangeData;
import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import com.amnesica.belugaproject.entities.trails.SpacecraftTrail;
import com.amnesica.belugaproject.services.aircraft.*;
import com.amnesica.belugaproject.services.data.*;
import com.amnesica.belugaproject.services.helper.DebugService;
import com.amnesica.belugaproject.services.trails.AircraftTrailService;
import com.amnesica.belugaproject.services.trails.SpacecraftTrailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

@RestController
@CrossOrigin
public class Controller {

    @Autowired
    private FeederService feederService;
    @Autowired
    private LocalFeederService localFeederService;
    @Autowired
    private OpenskyService openskyService;
    @Autowired
    private SpacecraftService spacecraftService;

    @Autowired
    private AircraftService aircraftService;

    @Autowired
    private AirportDataService airportDataService;
    @Autowired
    private RangeDataService rangeDataService;
    @Autowired
    private HistoryAircraftService historyAircraftService;

    @Autowired
    private SpacecraftTrailService spacecraftTrailService;
    @Autowired
    private AircraftTrailService aircraftTrailService;

    @Autowired
    private ShapeDataService shapeDataService;

    @Autowired
    private MapCatToShapeDataService mapCatToShapeDataService;

    @Autowired
    private MapTypeToShapeDataService mapTypeToShapeDataService;

    @Autowired
    private DebugService debugService;

    /**
     * Gibt die Konfiguration nur mit den nötigsten Variablen zurück
     *
     * @return Configuration
     */
    @GetMapping(value = "/getConfigurationData", produces = "application/json")
    public @ResponseBody
    HashMap<String, Object> getConfigurationData(HttpServletRequest httpRequest) {
        return feederService.getConfiguration(httpRequest);
    }

    /**
     * Gibt Flugzeuge innerhalb eines Extents zurück
     *
     * @param lomin            lower bound for the longitude in decimal degrees
     * @param lamin            lower bound for the latitude in decimal degrees
     * @param lomax            upper bound for the longitude in decimal degrees
     * @param lamax            upper bound for the latitude in decimal degrees
     * @param selectedFeeder   Ausgewählter Feeder (oder 'AllFeeder')
     * @param fetchFromOpensky Boolean, ob Opensky angefragt werden soll
     * @param showIss          Boolean, ob ISS abgefragt werden soll
     * @return Collection<AircraftSuperclass>
     */
    @GetMapping(value = "/getAircraftList", produces = "application/json")
    public @ResponseBody
    Collection<AircraftSuperclass> getAircraftList(@RequestParam(value = "lomin") double lomin,
                                                   @RequestParam(value = "lamin") double lamin, @RequestParam(value = "lomax") double lomax,
                                                   @RequestParam(value = "lamax") double lamax, @RequestParam(value = "selectedFeeder") String selectedFeeder,
                                                   @RequestParam(value = "fetchFromOpensky") boolean fetchFromOpensky,
                                                   @RequestParam(value = "showIss") boolean showIss, HttpServletRequest httpRequest) {
        return feederService.getPlanesWithinExtent(lomin, lamin, lomax, lamax, selectedFeeder, fetchFromOpensky,
                showIss, httpRequest);
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
    @GetMapping(value = "/getAirportList", produces = "application/json")
    public @ResponseBody
    List<AirportData> getAirportList(@RequestParam(value = "lomin") double lomin,
                                     @RequestParam(value = "lamin") double lamin, @RequestParam(value = "lomax") double lomax,
                                     @RequestParam(value = "lamax") double lamax, @RequestParam(value = "zoomLevel") double zoomLevel) {
        return airportDataService.getAirportsInExtent(lomin, lamin, lomax, lamax, zoomLevel);
    }

    /**
     * Gibt alle Informationen über ein Flugzeug zurück (bis auf Trails)
     *
     * @param hex          String
     * @param registration String
     * @return Object[]
     */
    @GetMapping(value = "/getAllAircraftData", produces = "application/json")
    public @ResponseBody
    Object[] getAircraftData(@RequestParam(value = "hex") String hex,
                             @RequestParam(value = "registration") String registration,
                             @RequestParam(value = "isFromOpensky") boolean isFromOpensky) {

        if (isFromOpensky) {
            return openskyService.getAllAircraftData(hex, registration);
        } else if (!hex.equals("ISS")) {
            return localFeederService.getAllAircraftData(hex, registration);
        }
        return null;
    }

    /**
     * Holt die Trails zu einem Flugzeug mit einer hex aus der Datenbank. Aus
     * Kompatibilitätsgründen wird hier die Liste an Trails in ein Object[] gepackt
     *
     * @param hex            String
     * @param selectedFeeder String
     * @return Object[]
     */
    @GetMapping(value = "/getTrail", produces = "application/json")
    public @ResponseBody
    Object[] getTrail(@RequestParam(value = "hex") String hex,
                      @RequestParam(value = "selectedFeeder") String selectedFeeder) {

        // Baue jeweils Array als Rückgabewert
        if (hex.equals("ISS")) {
            List<SpacecraftTrail> trails = spacecraftTrailService.getAllTrails();
            return new Object[]{trails};
        } else {
            List<AircraftTrail> trails = aircraftTrailService.getAllTrailsToHexAndFeeder(hex, selectedFeeder);
            return new Object[]{trails};
        }
    }

    /**
     * Gibt eine Liste mit Range-Data, Start- und Endpunkt von Flugzeugen,
     * welche in dem Zeitslot empfangen wurden
     *
     * @param startTime long
     * @param endTime   long
     * @return List<RangeData>
     */
    @GetMapping(value = "/getRangeDataBetweenTimestamps", produces = "application/json")
    public @ResponseBody
    List<RangeData> getRangeDataBetweenTimestamps(
            @RequestParam(value = "startTime") long startTime, @RequestParam(value = "endTime") long endTime) {
        return rangeDataService.getRangeDataBetweenTimestamps(startTime, endTime);
    }

    /**
     * Gibt die vorhandenen Log-Dateien im Log-Verzeichnis (spezifiziert in application.properties) aus.
     * Diese werden formatiert, sodass auf diese geklickt werden kann
     *
     * @return String
     */
    @GetMapping(value = "/getLogs")
    public String getLogs() {
        return debugService.getLogs();
    }

    /**
     * Gibt eine bestimmte Log-Datei mit einem filename als String aus
     *
     * @param filename String
     * @return String
     */
    @GetMapping(value = "/getLog", produces = "text/plain")
    public String getSpecificLog(@RequestParam String filename) {
        return debugService.getSpecificLog(filename);
    }

    /**
     * Gibt die ISS direkt zurück, ohne das vorher mit einem Extent eine Datenbankabfrage geschieht
     *
     * @return AircraftSuperclass
     */
    @GetMapping(value = "/getIssWithoutExtent", produces = "application/json")
    public @ResponseBody
    AircraftSuperclass getIssWithoutExtent() {
        return spacecraftService.getIssWithoutExtent();
    }
}
