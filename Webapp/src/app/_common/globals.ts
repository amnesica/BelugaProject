import Vector from 'ol/source/Vector';
import Collection from 'ol/Collection';
import { Layer } from 'ol/layer';
import { environment } from 'src/environments/environment';

/**
 * Globale Variablen
 */
export class Globals {
  // Name und Version der App
  static appName: any;
  static appVersion: any;

  // Allgemeine Location-Daten und Zoom-Level
  static latFeeder: number;
  static lonFeeder: number;
  static zoomLevel = 7;

  // Feeder-Position als Array mit [lonFeeder, latFeeder]
  static SitePosition;

  // Flugzeug-Icons als Features
  static PlaneIconFeatures = new Vector();

  // Group als Sammlung an Trails der Flugzeuge
  static trailGroup = new Collection<Layer>();

  // Helligkeitswert der Karte
  static luminosityValueMap = 0.26;

  // Server-Adresse
  static serverUrl = environment.baseUrl;

  // URL zum Server zum Aktualisieren der Flugzeuge von den Feedern
  static urlGetAircrafts =
    'http://' + Globals.serverUrl + ':8080/getAircraftList';

  // URL zum Server zum Erhalten der Url für das Flugzeug-Foto
  static urlGetAircraftPhoto =
    'http://' + Globals.serverUrl + ':8080/getAircraftPhoto';

  // Boolean, ob großes Info-Fenster (Info-Box an sich) angezeigt werden soll
  // Hinweis: "kleines" Info-Fenster ist noch die Hover-Info-Box
  static displayAircraftInfoLarge = false;

  // Skalierung der Flugzeug-Icons
  static scaleIcons;

  // URL zum Server zum Aktualisieren der ISS
  static urlGetIss = 'http://' + Globals.serverUrl + ':8080/getIss';

  // URL zum Server zum Holen der Daten über ein Flugzeug aus der Datenbank
  static urlGetAircraftData =
    'http://' + Globals.serverUrl + ':8080/getAircraftData';

  // URL zum Server zum Holen der Daten über einen Flughafen aus der Datenbank
  static urlGetAirportData =
    'http://' + Globals.serverUrl + ':8080/getAirportData';

  // URL zum Server zum Holen der Daten über ein Land aus der Datenbank
  static urlGetCountryData =
    'http://' + Globals.serverUrl + ':8080/getCountryData';

  // URL zum Server zum Holen der Daten über einen Operator (Fluggesellschaft) aus der Datenbank
  static urlGetOperatorData =
    'http://' + Globals.serverUrl + ':8080/getOperatorData';

  // URL zum Server zum Holen der Daten über einen Reg-Code aus der Datenbank
  static urlGetRegcodeData =
    'http://' + Globals.serverUrl + ':8080/getRegcodeData';

  // URL zum Server zum Senden des Flugzeugs für die Range-Daten
  static urlPostRangeData: string =
    'http://' + Globals.serverUrl + ':8080/postRangeData';

  // URL zum Server zum Holen aller Range-Daten
  static urlGetAllRangeData: string =
    'http://' + Globals.serverUrl + ':8080/getAllRangeData';

  // URL zum Server zum Holen von Range-Daten zwischen einem bestimmten Zeitraum
  static urlGetRangeDataBetweenTimestamps: string =
    'http://' + Globals.serverUrl + ':8080/getRangeDataBetweenTimestamps';

  // URL zum Server zum Holen von Konfigurations-Variablen
  static urlGetConfigurationData: string =
    'http://' + Globals.serverUrl + ':8080/getConfigurationData';

  // Boolean, ob Flugzeug-Labels angezeigt werden sollen
  static showAircraftLabel: boolean = false;
}
