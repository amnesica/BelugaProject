package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.AircraftSuperclass;
import com.amnesica.belugaproject.entities.aircraft.Spacecraft;
import com.amnesica.belugaproject.repositories.aircraft.SpacecraftRepository;
import com.amnesica.belugaproject.services.helper.HelperService;
import com.amnesica.belugaproject.services.helper.NetworkHandlerService;
import com.amnesica.belugaproject.services.helper.Request;
import com.amnesica.belugaproject.services.trails.SpacecraftTrailService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Optional;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Slf4j
@EnableScheduling
@Service
public class SpacecraftService {
    @Autowired
    private SpacecraftTrailService spacecraftTrailService;

    @Autowired
    private AircraftService aircraftService;

    @Autowired
    private NetworkHandlerService networkHandler;

    @Autowired
    private SpacecraftRepository spacecraftRepository;

    // Konfigurationsdatei
    @Autowired
    private Configuration configuration;

    // Url zum Fetchen der Position der ISS
    final static String URL_ISS_POSITION_API = "http://api.open-notify.org/iss-now.json";

    // Name des Feeders (API) der ISS
    final static String FEEDER_NAME_ISS = "Open-Notify";

    // ISS als besonderes Flugzeug
    private Spacecraft iss;

    // Queue mit Anfragen an Open-Notify (ISS)
    private final BlockingQueue<Request> requestQueueIss = new LinkedBlockingQueue<>();

    /**
     * Methode aktualisiert die ISS-Position. Wird vom Server alle
     * INTERVAL_UPDATE_ISS Sekunden aufgerufen
     */
    @Scheduled(fixedRate = StaticValues.INTERVAL_UPDATE_ISS)
    private void getIssFromFeeder() {

        // Hole Request aus queue. Wenn kein Request vorhanden ist, wird null
        // zurückgegeben
        Request request = requestQueueIss.poll();

        if (request == null) {
            return;
        }

        // Suche und extrahiere den neuesten Request der IP-Addresse
        final Request copyRequest = request;
        Optional<Request> requestNewest = requestQueueIss.stream()
                .filter(r -> r.getIpAddressClient().equals(copyRequest.getIpAddressClient()) &&
                        r.getTimestamp() > copyRequest.getTimestamp()).max(Comparator.comparing(Request::getTimestamp));

        if (requestNewest.isPresent()) {
            // Ersetze ursprünglich gepollten Request durch neueren Request
            request = requestNewest.get();

            // Lösche alle bisherigen Requests derjenigen Ip-Adressse, welche älter sind als der herausgenommene Request
            requestQueueIss.removeIf(r -> r.getTimestamp() < requestNewest.get().getTimestamp() && r.getIpAddressClient().equals(copyRequest.getIpAddressClient()));
        }

        // Validiere Request
        if (request.getLomin() == null || request.getLamin() == null || request.getLomax() == null
                || request.getLamax() == null) {
            log.error("ISS: Request " + request + " is is not valid. Nothing to do");
            return;
        }

        // Initialisiere ISS, wenn nötig
        if (iss == null) {
            createNewIss();
        }

        // Anfrage an Feeder mit url
        String jsonStr = networkHandler.makeServiceCall(URL_ISS_POSITION_API);

        try {
            JSONObject jsonObject = new JSONObject(jsonStr);
            jsonObject = jsonObject.getJSONObject("iss_position");

            // Extrahiere Koordinaten der ISS aus JSON-Daten
            iss.setLongitude(jsonObject.getDouble("longitude"));
            iss.setLatitude(jsonObject.getDouble("latitude"));

            // Setze aktuelle Zeit als LastUpdate
            iss.setLastUpdate(System.currentTimeMillis());

            // Aktualisiere Trail des Flugzeugs mit neuer Position und Höhe
            spacecraftTrailService.addTrail(iss, FEEDER_NAME_ISS);

            // Berechne und setze distance
            double distance = HelperService.getDistanceBetweenPositions(iss.getLatitude(), iss.getLongitude(),
                    configuration.getLatFeeder(), configuration.getLonFeeder());
            iss.setDistance(distance);

            try {
                // Schreibe Flugzeug in spacecrafts-Tabelle
                spacecraftRepository.save(iss);
            } catch (Exception e) {
                throw new Exception(e);
            }

        } catch (Exception e) {
            log.error("Server - DB error when writing iss : Exception = " + e);
        }
    }

    /**
     * Erstellt eine neue ISS als Spacecraft-Objekt mit Informationen
     */
    private void createNewIss() {
        iss = new Spacecraft("ISS", 0.0, 0.0);

        // Setze weitere Infos über die ISS
        iss.setAltitude(1312336);
        iss.setOperatorCountry("Intl");
        iss.setCategory("B7");
        iss.setFeederList(new ArrayList<>(Collections.singletonList(FEEDER_NAME_ISS)));
        iss.setFlightId("ISS");
        iss.setHex("ISS");
        iss.setOnGround(false);
        iss.setOperatorName("NASA, Roskosmos, ESA, CSA, JAXA");
        iss.setType("ISS");
        iss.setFullType("International Space Station");
        iss.setSpeed(14903);
        iss.setFlightId("Alpha, Station");
        iss.setVerticalRate(0);
        iss.setWindSpeed(0);
        iss.setWindFromDirection(0);
        iss.setBuilt("1998");
        iss.setFirstFlightDate("1998");
        iss.setLineNumber("1");
        iss.setEngines("Photovoltaic solar arrays");

        // Setze Track, damit Marker im Frontend angezeigt wird
        iss.setTrack(0);

        // Setze Alter der ISS
        aircraftService.calcAndSetAge(iss, iss.getBuilt());

        // Setze Flagge der ISS
        String flagCodeConverted = HelperService.convertFlagCodeToHTML("U+1F6F0 U+FE0F");
        iss.setRegCodeNameFlag(flagCodeConverted);
        iss.setRegCodeName("Space");

        // Setze Zustand der ISS
        aircraftService.setAircraftState(iss);
    }

    /**
     * Methode gibt die ISS innerhalb eines Extents aus der Tabelle spacecraft
     * zurück
     *
     * @param lomin lower bound for the longitude in decimal degrees
     * @param lamin lower bound for the latitude in decimal degrees
     * @param lomax upper bound for the longitude in decimal degrees
     * @param lamax upper bound for the latitude in decimal degrees
     * @return AircraftSuperclass
     */
    public AircraftSuperclass getIssWithinExtent(double lomin, double lamin, double lomax, double lamax) {
        Spacecraft iss = null;
        try {
            iss = spacecraftRepository.findFirstWithinExtent(lomin, lamin, lomax, lamax);
        } catch (Exception e) {
            log.error("Server - DB error when fetching iss : Exception = " + e);
        }
        return iss;
    }

    /**
     * Fügt einen neuen Request zur Queue für ISS-Anfragen hinzu
     */
    public void addRequest(Request request) {
        requestQueueIss.add(request);
    }

    /**
     * Gibt die ISS direkt aus der Datenbank zurück
     *
     * @return AircraftSuperclass
     */
    public AircraftSuperclass getIssWithoutExtent() {
        Spacecraft iss = null;
        try {
            iss = spacecraftRepository.findByHex("ISS");
        } catch (Exception e) {
            log.error("Server - DB error when fetching iss : Exception = " + e);
        }
        return iss;
    }
}
