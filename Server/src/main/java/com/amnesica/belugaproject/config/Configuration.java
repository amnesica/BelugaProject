package com.amnesica.belugaproject.config;

import com.amnesica.belugaproject.Application;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.event.EventListener;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Data
@Slf4j
@Validated
@ConstructorBinding
@EnableConfigurationProperties
@ConfigurationProperties("application")
@org.springframework.context.annotation.Configuration
public class Configuration {
    // Name und Version der App
    private final String appName = "The Beluga Project";
    private final String appVersion = "3-0-1";

    // Angezeigte Feeder-Position auf der Karte
    @Value("${latitudeLocation}")
    @NotNull(message = "latitudeLocation was not found in application.properties")
    private Double latFeeder;

    @Value("${longitudeLocation}")
    @NotNull(message = "longitudeLocation was not found in application.properties")
    private Double lonFeeder;

    // Anzahl der Feeder
    @Value("${amountFeeder}")
    @Min(1)
    @NotNull(message = "amountFeeder was not found in application.properties")
    private Double amountFeeder;

    // Skalierung der Icons
    @Value("${scaleIcons}")
    @NotNull(message = "scaleIcons was not found in application.properties")
    private Double scaleIcons;

    // Ip-Adressen der Feeder
    @Value("#{'${ipFeeder}'.split(',\\s*')}")
    private List<String> listIpFeeder;

    // Art der Feeder
    @Value("#{'${typeFeeder}'.split(',\\s*')}")
    private List<String> listTypeFeeder;

    // Namen der Feeder
    @Value("#{'${nameFeeder}'.split(',\\s*')}")
    private List<String> listNameFeeder;

    // Farben der Feeder
    @Value("#{'${colorFeeder}'.split(',\\s*')}")
    private List<String> listColorFeeder;

    // Anzuzeigende Range Ringe
    @Value("#{'${circleDistanceOfRings}'.split(',\\s*')}")
    private List<Integer> listCircleDistancesInNm;

    @Value("${opensky-network.username}")
    @NotNull(message = "opensky-network.username was not found in application.properties")
    private String openskyUsername;

    @Value("${opensky-network.password}")
    @NotNull(message = "opensky-network.password was not found in application.properties")
    private char[] openskyPassword;

    // Url zur Photo-Suche einer Suchmaschine
    @Value("${searchEngineUrl}")
    @NotNull(message = "searchEngineUrl was not found in application.properties")
    private String searchEngineUrl;

    // Liste mit Feedern aus der Konfigurationsdatei
    private List<Feeder> listFeeder;

    // Map mit typeDesignator als Key und ShapeData als Value
    private Map<String, Object> shapesMap = null;

    // Map mit category als Key und shapeDesignator plus shapeScale als Values
    private Map<String, Object[]> catMap = null;

    // Map mit typeDesignator als Key und shapeDesignator plus shapeScale als Values
    private Map<String, Object[]> typesMap = null;

    public void addFeederToList(Feeder feeder) {
        if (listFeeder == null) listFeeder = new ArrayList<>();
        listFeeder.add(feeder);
    }

    /**
     * Methode liest die Konfigurationseinstellungen aus der Datei "application.properties"
     * und erstellt Feeder-Objekte mit den jeweiligen Mappings
     *
     * @throws IOException IOException
     */
    @EventListener(ApplicationReadyEvent.class)
    public void init() throws IOException {
        // Zeigt einen Willkommensbanner auf der Konsole
        showWelcomeBannerAndVersion();

        // Erstelle Feeder-Objekte und weise Mappings zu
        createFeedersFromConfiguration();
    }

    /**
     * Erstellt die Feeder aus den Werten der Konfigurationsdatei
     *
     * @throws IOException IOException
     */
    private void createFeedersFromConfiguration() throws IOException {
        // Erstelle Feeder-Objekte und weise Mappings zu
        for (int i = 0; i < getListIpFeeder().size(); i++) {

            // Erstelle einen Feeder
            Feeder feeder = new Feeder(getListNameFeeder().get(i), getListIpFeeder().get(i),
                    getListTypeFeeder().get(i), getListColorFeeder().get(i));

            // Weise Feeder die Mappings von der jeweiligen Konfigurationsdatei zu
            FeederMapping mapping = getMappingsFromConfig(feeder.getType());
            if (mapping != null) {
                feeder.setMapping(mapping);
            } else {
                exitProgram(
                        "Server: Mappings could not be read from the configuration files. Program will be terminated!");
            }

            // Füge Feeder zur Liste an Feedern hinzu
            addFeederToList(feeder);
        }
    }

    /**
     * Zeigt einen Willkommens-Banner mit aktueller Version und Name der Anwendung
     * an
     */
    private void showWelcomeBannerAndVersion() {
        System.out.println("================================================================");
        System.out.println(" ____       _                   ____            _           _   \n"
                + "| __ )  ___| |_   _  __ _  __ _|  _ \\ _ __ ___ (_) ___  ___| |_ \n"
                + "|  _ \\ / _ \\ | | | |/ _` |/ _` | |_) | '__/ _ \\| |/ _ \\/ __| __|\n"
                + "| |_) |  __/ | |_| | (_| | (_| |  __/| | | (_) | |  __/ (__| |_ \n"
                + "|____/ \\___|_|\\__,_|\\__, |\\__,_|_|   |_|  \\___// |\\___|\\___|\\__|\n"
                + "                    |___/                    |__/   ");
        System.out.println(" :: " + getAppName() + " :: " + "			" + "Version: "
                + getAppVersion());
        System.out.println(" made by RexKramer1 and amnesica");
        System.out.println("================================================================");
    }

    /**
     * Gibt ein FeederMapping mit den Zuweisungen aus der Konfigurationsdatei mit
     * dem Namen aus typeFeederProperty
     *
     * @param typeFeederProperty String
     * @return FeederMapping
     * @throws IOException IOException
     */
    private FeederMapping getMappingsFromConfig(String typeFeederProperty) throws IOException {
        FeederMapping mapping = new FeederMapping();

        final String pathToFeederMappings = "config" + File.separator + "feederMappings" + File.separator;

        if (typeFeederProperty != null && !typeFeederProperty.isEmpty()) {
            Properties propsFeeder = readPropertiesFromResourcesFile(pathToFeederMappings + typeFeederProperty + ".config");

            if (propsFeeder != null) {
                if (propsFeeder.getProperty("hex") != null) {
                    mapping.setHex(propsFeeder.getProperty("hex"));
                }
                if (propsFeeder.getProperty("latitude") != null) {
                    mapping.setLatitude(propsFeeder.getProperty("latitude"));
                }
                if (propsFeeder.getProperty("longitude") != null) {
                    mapping.setLongitude(propsFeeder.getProperty("longitude"));
                }
                if (propsFeeder.getProperty("altitude") != null) {
                    mapping.setAltitude(propsFeeder.getProperty("altitude"));
                }
                if (propsFeeder.getProperty("track") != null) {
                    mapping.setTrack(propsFeeder.getProperty("track"));
                }
                if (propsFeeder.getProperty("type") != null) {
                    mapping.setType(propsFeeder.getProperty("type"));
                }
                if (propsFeeder.getProperty("registration") != null) {
                    mapping.setRegistration(propsFeeder.getProperty("registration"));
                }
                if (propsFeeder.getProperty("onGround") != null) {
                    mapping.setOnGround(propsFeeder.getProperty("onGround"));
                }
                if (propsFeeder.getProperty("speed") != null) {
                    mapping.setSpeed(propsFeeder.getProperty("speed"));
                }
                if (propsFeeder.getProperty("squawk") != null) {
                    mapping.setSquawk(propsFeeder.getProperty("squawk"));
                }
                if (propsFeeder.getProperty("flightId") != null) {
                    mapping.setFlightId(propsFeeder.getProperty("flightId"));
                }
                if (propsFeeder.getProperty("verticalRate") != null) {
                    mapping.setVerticalRate(propsFeeder.getProperty("verticalRate"));
                }
                if (propsFeeder.getProperty("rssi") != null) {
                    mapping.setRssi(propsFeeder.getProperty("rssi"));
                }
                if (propsFeeder.getProperty("category") != null) {
                    mapping.setCategory(propsFeeder.getProperty("category"));
                }
                if (propsFeeder.getProperty("temperature") != null) {
                    mapping.setTemperature(propsFeeder.getProperty("temperature"));
                }
                if (propsFeeder.getProperty("windSpeed") != null) {
                    mapping.setWindSpeed(propsFeeder.getProperty("windSpeed"));
                }
                if (propsFeeder.getProperty("windFromDirection") != null) {
                    mapping.setWindFromDirection(propsFeeder.getProperty("windFromDirection"));
                }
                if (propsFeeder.getProperty("destination") != null) {
                    mapping.setDestination(propsFeeder.getProperty("destination"));
                }
                if (propsFeeder.getProperty("origin") != null) {
                    mapping.setOrigin(propsFeeder.getProperty("origin"));
                }
                if (propsFeeder.getProperty("distance") != null) {
                    mapping.setDistance(propsFeeder.getProperty("distance"));
                }
                if (propsFeeder.getProperty("autopilotEngaged") != null) {
                    mapping.setAutopilotEngaged(propsFeeder.getProperty("autopilotEngaged"));
                }
                if (propsFeeder.getProperty("elipsoidalAltitude") != null) {
                    mapping.setElipsoidalAltitude(propsFeeder.getProperty("elipsoidalAltitude"));
                }
                if (propsFeeder.getProperty("selectedQnh") != null) {
                    mapping.setSelectedQnh(propsFeeder.getProperty("selectedQnh"));
                }
                if (propsFeeder.getProperty("selectedAltitude") != null) {
                    mapping.setSelectedAltitude(propsFeeder.getProperty("selectedAltitude"));
                }
                if (propsFeeder.getProperty("selectedHeading") != null) {
                    mapping.setSelectedHeading(propsFeeder.getProperty("selectedHeading"));
                }
                if (propsFeeder.getProperty("feeder") != null) {
                    mapping.setFeeder(propsFeeder.getProperty("feeder"));
                }
                if (propsFeeder.getProperty("lastSeen") != null) {
                    mapping.setLastSeen(propsFeeder.getProperty("lastSeen"));
                }
                if (propsFeeder.getProperty("source") != null) {
                    mapping.setSource(propsFeeder.getProperty("source"));
                }
            } else {
                exitProgram(
                        "Server: No configuration file with mappings of a feeder found. Program will be terminated!");
            }
        }
        return mapping;
    }

    /**
     * Gibt Properties-Objekt zurück, welches aus dem resources-Verzeichnis mit dem
     * Namen filename stammt
     *
     * @param filename String
     * @return Properties
     * @throws IOException IOException
     */
    private Properties readPropertiesFromResourcesFile(String filename) throws IOException {
        Properties props = new Properties();
        InputStream configStream = null;
        try {
            configStream = Application.class.getResourceAsStream("/" + filename);
            if (configStream != null) {
                props.load(configStream);
            }
        } finally {
            if (configStream != null) {
                configStream.close();
            }
            configStream = null;
        }

        return props;
    }

    /**
     * Methode prüft, ob die Zugangsdaten für Opensky gesetzt wurden
     *
     * @return true, wenn Zugangsdaten gesetzt wurden
     */
    public boolean openskyCredentialsAreValid() {
        if (openskyUsername == null || openskyUsername.isBlank()
                || openskyUsername.equals("TODO") || openskyPassword == null
                || openskyPassword.length == 0 ||
                Arrays.equals(openskyPassword, new char[]{'T', 'O', 'D', 'O'})) {
            log.info("Opensky: Credentials have not been set in application.properties. Opensky cannot be used!");
            return false;
        } else {
            return true;
        }
    }

    /**
     * Programm wird nach Anzeige einer Meldung terminiert
     *
     * @param message String
     */
    private void exitProgram(String message) {
        log.error(message);
        System.exit(0);
    }
}
