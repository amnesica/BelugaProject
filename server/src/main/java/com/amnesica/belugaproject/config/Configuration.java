package com.amnesica.belugaproject.config;

import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.core.io.FileSystemResource;
import org.springframework.validation.annotation.Validated;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Data
@Slf4j
@Validated
@org.springframework.context.annotation.Configuration
public class Configuration {

  @Autowired
  private Environment environment;

  // Name und Version der App
  private final String appName = "The Beluga Project";
  private final String appVersion = "4-0-0";

  // Angezeigte Feeder-Position auf der Karte
  @Value("${location.latitude}")
  private Double latFeeder;

  @Value("${location.longitude}")
  private Double lonFeeder;

  // Anzahl der Feeder
  @Value("${feeder.amount}")
  @Min(1)
  private Double amountFeeder;

  // Skalierung der Icons
  @Value("${scale.icons}")
  private Double scaleIcons;

  // Skalierung der kleinen Icons
  @Value("${scale.small.icons}")
  private Double smallScaleIcons;

  // Ip-Adressen der Feeder
  @Value("#{'${feeder.ip}'.split(',\\s*')}")
  private List<String> listIpFeeder;

  // Art der Feeder
  @Value("#{'${feeder.type}'.split(',\\s*')}")
  private List<String> listTypeFeeder;

  // Namen der Feeder
  @Value("#{'${feeder.name}'.split(',\\s*')}")
  private List<String> listNameFeeder;

  // Farben der Feeder
  @Value("#{'${feeder.color}'.split(',\\s*')}")
  private List<String> listColorFeeder;

  // Anzuzeigende Range Ringe
  @Value("#{'${circle.distance.of.rings}'.split(',\\s*')}")
  private List<Integer> listCircleDistancesInNm;

  @Value("${opensky.network.username}")
  private String openskyUsername;

  @Value("${opensky.network.password}")
  private char[] openskyPassword;

  // Url zur Photo-Suche einer Suchmaschine
  @Value("${search.engine.url}")
  private String searchEngineUrl;

  // IP-Adresse des produktiven Systems (test: localhost)
  @Value("#{'${prod.base.url.webapp}'}")
  private String prodBaseUrl;

  // API-Key für geoapify Karten
  @Value("${geoapify.api.key:}")
  private String geoapifyApiKey;

  // Access Token für Cesium Ion
  @Value("${cesium.ion.defaultAccessToken:}")
  private String cesiumIonDefaultAccessToken;

  // API-Key für Google Maps (Cesium 3d-Map)
  @Value("${cesium.googleMaps.api.key:}")
  private String cesiumGoogleMapsApiKey;

  // Directory für Config-Files (dev/prod)
  @Value("${config.files.directory:}")
  private String configFilesDirectory;

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
      feeder.setMapping(mapping);

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
  public FeederMapping getMappingsFromConfig(String typeFeederProperty) throws IOException {
    FeederMapping mapping = new FeederMapping();

    if (configFilesDirectory == null || configFilesDirectory.isEmpty()) {
      throw new IOException("Error: Directory for config files not found.");
    }

    final String pathToFeederMappings = configFilesDirectory + File.separator + "feederMappings" + File.separator;

    if (typeFeederProperty != null && !typeFeederProperty.isEmpty()) {
      Properties propsFeeder = readPropertiesFromResourcesFile(pathToFeederMappings + typeFeederProperty + ".config");

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
      if (propsFeeder.getProperty("roll") != null) {
        mapping.setRoll(propsFeeder.getProperty("roll"));
      }
    }
    return mapping;
  }

  /**
   * Gibt Properties-Objekt zurück, welches aus dem angegebenen path stammt
   *
   * @param path String
   * @return Properties
   * @throws IOException IOException
   */
  public Properties readPropertiesFromResourcesFile(final String path) throws IOException {
    Properties props = new Properties();

    if (path.contains("dev")) {
      // dev
      try (InputStream inputStream = this.getClass().getResourceAsStream(path)) {
        props.load(inputStream);
      }
    } else {
      // prod
      try (InputStream inputStream = new FileSystemResource(path).getInputStream()) {
        props.load(inputStream);
      }
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
   * Methode prüft, ob die IP-Adresse des produktiven Systems gesetzt wurde (oder 'localhost' gesetzt wurde)
   *
   * @return true, wenn IP-Adresse gesetzt wurde
   */
  public boolean prodBaseUrlIsValid() {
    if (prodBaseUrl == null || prodBaseUrl.isBlank()
        || prodBaseUrl.equals("TODO")) {
      exitProgram("ProdBaseUrl: IP-address for productive system has not been set in application.properties. For testing purpose 'localhost' can be used. Program will exit!");
      return false;
    } else return prodBaseUrl.matches("([0-9]+.[0-9]+.[0-9]+.[0-9]+)") || prodBaseUrl.equals("localhost");
  }

  /**
   * Programm wird nach Anzeige einer Meldung terminiert
   *
   * @param message String
   */
  private void exitProgram(final String message) {
    log.error(message);
    System.exit(0);
  }

  /**
   * Methode prüft, ob die Zugangsdaten für Opensky gesetzt wurden
   *
   * @return true, wenn Zugangsdaten gesetzt wurden
   */
  public boolean geoapifyApiKeyIsValid() {
    if (geoapifyApiKey == null || geoapifyApiKey.isBlank()
        || geoapifyApiKey.equals("TODO")) {
      log.info("Geoapify: API-Key is not present in application.properties and maps will not be available!");
      return false;
    } else {
      return true;
    }
  }

  /**
   * Methode prüft, ob der Access Token für Cesium Ion für Cesium-Komponente gesetzt wurde
   *
   * @return true, wenn Access Token gesetzt wurde
   */
  public boolean cesiumIonDefaultAccessTokenIsValid() {
    if (cesiumIonDefaultAccessToken == null || cesiumIonDefaultAccessToken.isBlank()
        || cesiumIonDefaultAccessToken.equals("TODO")) {
      log.info("Cesium Ion: Access Token is not present in application.properties and Cesium Ion 3D feature will not be available!");
      return false;
    } else {
      return true;
    }
  }
}
