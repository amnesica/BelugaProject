package com.amnesica.belugaproject.config;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import com.amnesica.belugaproject.Application;

public class AppProperties {
	// Name der Konfigurationsdatei
	static final String filename = "app.config";

	// Zugreifbare Properties-Variable
	public static final Properties prop = new Properties();

	// Zu erstellende Konfigurationsdatei mit zu setzenden Variablen
	public static Configuration configuration;

	/**
	 * Methode liest die Konfigurationseinstellungen aus der Datei "app.config" und
	 * speichert sie an der prop-Variable für einen öffentlichen Zugriff
	 * 
	 * @throws IOException IOException
	 */
	public static void readPropertiesFromConfig() throws IOException {
		// Versuch die interne Konfigurationsdatei zu lesen (für Debug-Modus)
		readPropertiesFromResourcesAppConfig();

		// Versuch die externe Konfigurationsdatei zu lesen (überschreibt bei Erfolg die
		// interne!)
		readPropertiesFromProductionAppConfig();

		// Prüfe, ob alle benötigten Konfigurationen vorhanden sind,
		// ansonsten breche Programm ab
		checkPropertiesInConfig();

		// Erstelle eigentliche Konfigurationsdatei
		createConfiguration();

		// Zeigt einen Willkommensbanner auf der Konsole
		showWelcomeBannerAndVersion();
	}

	private static void createConfiguration() throws IOException {
		double latitudeLocation = 0;
		double longitudeLocation = 0;
		boolean showIss = false;
		int amountFeeder = 0;
		double scaleIcons = 0;
		int numberOfRangeRings = 0;
		int[] circleDistancesInNm = null;

		// Ermittle Position
		if (!prop.getProperty("latitudeLocation").isEmpty() && !prop.getProperty("latitudeLocation").equals("0")
				&& !prop.getProperty("longitudeLocation").isEmpty()
				&& !prop.getProperty("longitudeLocation").equals("0")) {
			latitudeLocation = Double.valueOf(prop.getProperty("latitudeLocation"));
			longitudeLocation = Double.valueOf(prop.getProperty("longitudeLocation"));
		} else {
			exitProgram("Server: Configurations have invalid values. Program will be terminated!");
		}

		// Ermittle Boolean, ob ISS angezeigt werden soll
		if (prop.getProperty("showIss").equals("true") || prop.getProperty("showIss").equals("false")) {
			showIss = Boolean.parseBoolean(prop.getProperty("showIss"));
		} else {
			exitProgram("Server: Configurations have invalid values. Program will be terminated!");
		}

		// Ermittle Skalierung der Flugzeug-Icons
		if (!prop.getProperty("scaleIcons").isEmpty() && !prop.getProperty("scaleIcons").equals("0")
				&& !prop.getProperty("scaleIcons").equals("0.0")) {
			scaleIcons = Double.valueOf(prop.getProperty("scaleIcons"));
		} else {
			exitProgram("Server: Configurations have invalid values. Program will be terminated!");
		}

		// Ermittle Anzahl der Range-Ringe
		if (!prop.getProperty("numberOfRangeRings").isEmpty()) {
			numberOfRangeRings = Integer.parseInt(prop.getProperty("numberOfRangeRings"));
		}

		// Ermittle Distanzen der Range-Ringe und befülle circleDistancesInNm-Array
		if (numberOfRangeRings == 0) {
			circleDistancesInNm = null;
		} else if (numberOfRangeRings > 0) {
			// Initialisiere circleDistancesInNm-Array mit Anzahl der Range-Ringe
			circleDistancesInNm = new int[numberOfRangeRings];

			for (int i = 1; i < numberOfRangeRings + 1; i++) {
				String nameCircleDistanceProperty = "circleDistanceOfRing" + i;
				if (prop.getProperty(nameCircleDistanceProperty) != null
						&& !prop.getProperty(nameCircleDistanceProperty).isEmpty()) {
					// Befülle circleDistancesInNm-Array mit richtigem Index
					circleDistancesInNm[i - 1] = Integer.parseInt(prop.getProperty(nameCircleDistanceProperty));
				} else {
					exitProgram("Server: Configurations have invalid values. Program will be terminated!");
				}
			}
		}

		// Ermittle Anzahl der Feeder
		if (!prop.getProperty("amountFeeder").isEmpty() && !prop.getProperty("amountFeeder").equals("0")) {
			amountFeeder = Integer.parseInt(prop.getProperty("amountFeeder"));
		} else {
			exitProgram("Server: Configurations have invalid values. Program will be terminated!");
		}

		// Initialisiere neue Configuration
		configuration = new Configuration(latitudeLocation, longitudeLocation, amountFeeder, showIss, scaleIcons,
				circleDistancesInNm);

		if (amountFeeder > 0) {
			// Erstelle Feeder-Objekte nach Anzahl amountFeeder und weise Mappings zu
			// (Hinweis: Zählung beginnt bei 1)
			for (int i = 1; i < amountFeeder + 1; i++) {
				String nameFeederProperty = "nameFeeder" + i;
				String ipFeederProperty = "ipFeeder" + i;
				String typeFeederProperty = "typeFeeder" + i;
				String colorFeederProperty = "colorFeeder" + i;
				if (prop.getProperty(nameFeederProperty) != null && !prop.getProperty(nameFeederProperty).isEmpty()
						&& prop.getProperty(ipFeederProperty) != null && !prop.getProperty(ipFeederProperty).isEmpty()
						&& prop.getProperty(typeFeederProperty) != null
						&& !prop.getProperty(typeFeederProperty).isEmpty()
						&& prop.getProperty(colorFeederProperty) != null
						&& !prop.getProperty(colorFeederProperty).isEmpty()) {
					// Erstelle einen Feeder
					Feeder feeder = new Feeder(prop.getProperty(nameFeederProperty), prop.getProperty(ipFeederProperty),
							prop.getProperty(typeFeederProperty), prop.getProperty(colorFeederProperty));

					// Weise Feeder die Mappings von der jeweiligen Konfigurationsdatei zu
					FeederMapping mapping = getMappingsFromConfig(feeder.getType());
					if (mapping != null) {
						feeder.setMapping(mapping);
					} else {
						exitProgram(
								"Server: Mappings could not be read from the configuration files. Program will be terminated!");
					}

					// Füge Feeder zur Liste an Feedern hinzu
					configuration.addFeederToList(feeder);
				}
			}
		}
	}

	/**
	 * Zeigt einen Willkommens-Banner mit aktueller Version und Name der Anwendung
	 * an
	 */
	private static void showWelcomeBannerAndVersion() {
		System.out.println("================================================================");
		System.out.println(" ____       _                   ____            _           _   \n"
				+ "| __ )  ___| |_   _  __ _  __ _|  _ \\ _ __ ___ (_) ___  ___| |_ \n"
				+ "|  _ \\ / _ \\ | | | |/ _` |/ _` | |_) | '__/ _ \\| |/ _ \\/ __| __|\n"
				+ "| |_) |  __/ | |_| | (_| | (_| |  __/| | | (_) | |  __/ (__| |_ \n"
				+ "|____/ \\___|_|\\__,_|\\__, |\\__,_|_|   |_|  \\___// |\\___|\\___|\\__|\n"
				+ "                    |___/                    |__/   ");
		System.out.println(" :: " + configuration.getAppName() + " :: " + "			" + "Version: "
				+ configuration.getAppVersion());
		System.out.println(" made by RexKramer1 and amnesica");
		System.out.println("================================================================");
	}

	/**
	 * Prüfe, ob alle minimal benötigten Konfigurationen vorhanden sind, ansonsten
	 * breche Programm ab
	 * 
	 * @throws IOException
	 */
	private static void checkPropertiesInConfig() throws IOException {
		if (prop == null) {
			exitProgram("Server: Configurations not available. Program will be terminated!");
		}

		// Prüfe minimale Konfiguration
		if (prop.getProperty("latitudeLocation") == null || prop.getProperty("longitudeLocation") == null
				|| prop.getProperty("ipFeeder1") == null || prop.getProperty("typeFeeder1") == null
				|| prop.getProperty("nameFeeder1") == null || prop.getProperty("colorFeeder1") == null
				|| prop.getProperty("amountFeeder") == null || prop.getProperty("showIss") == null
				|| prop.getProperty("scaleIcons") == null || prop.getProperty("numberOfRangeRings") == null) {
			exitProgram("Server: Minimum required configurations not available. Program will be terminated!");
		}
	}

	/**
	 * Gibt ein FeederMapping mit den Zuweisungen aus der Konfigurationsdatei mit
	 * dem Namen aus typeFeederProperty
	 * 
	 * @param typeFeederProperty String
	 * @return FeederMapping
	 * @throws IOException IOException
	 */
	private static FeederMapping getMappingsFromConfig(String typeFeederProperty) throws IOException {
		FeederMapping mapping = new FeederMapping();

		if (typeFeederProperty != null && !typeFeederProperty.isEmpty()) {
			Properties propsFeeder = readPropertiesFromResourcesFile(typeFeederProperty + ".config");

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
	 * Gibt Properties-Objekt der app.config zurück, welches aus dem
	 * Produktions-Verzeichnis stammt
	 * 
	 * @throws IOException IOException
	 */
	private static void readPropertiesFromProductionAppConfig() throws IOException {
		InputStream configStream = null;
		try {
			final File configFile = new File(filename);
			if (configFile.isFile()) {
				configStream = new FileInputStream(configFile);
				prop.load(configStream);
			}
		} finally {
			if (configStream != null) {
				configStream.close();
			}
		}
	}

	/**
	 * Gibt Properties-Objekt der app.config zurück, welches aus dem
	 * resources-Verzeichnis stammt
	 * 
	 * @throws IOException IOException
	 */
	private static void readPropertiesFromResourcesAppConfig() throws IOException {
		InputStream configStream = null;
		try {
			configStream = Application.class.getResourceAsStream("/" + filename);
			if (configStream != null) {
				prop.load(configStream);
			}
		} finally {
			if (configStream != null) {
				configStream.close();
			}
			configStream = null;
		}
	}

	/**
	 * Gibt Properties-Objekt zurück, welches aus dem resources-Verzeichnis mit dem
	 * Namen filename stammt
	 * 
	 * @param filename String
	 * @return Properties
	 * @throws IOException IOException
	 */
	private static Properties readPropertiesFromResourcesFile(String filename) throws IOException {
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
	 * Programm wird nach Anzeige einer Meldung terminiert
	 * 
	 * @param message String
	 */
	private static void exitProgram(String message) {
		System.out.println(message);
		System.exit(0);
	}
}
