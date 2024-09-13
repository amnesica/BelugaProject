import Vector from 'ol/source/Vector';
import Collection from 'ol/Collection';
import { Layer } from 'ol/layer';
import { environment } from 'src/environments/environment';
import { Aircraft } from '../_classes/aircraft';
import VectorSource from 'ol/source/Vector';
import { Point } from 'ol/geom';

/**
 * Globale Variablen
 */
export class Globals {
  // Name, Version, Stage und Buildtime der App
  static appName: any;
  static appVersion: any;
  static appStage: any;
  static appBuildTime: any;

  // Allgemeine Location-Daten und Zoom-Level
  static latFeeder: number;
  static lonFeeder: number;
  static zoomLevel = 7;

  // Feeder-Position als Array mit [lonFeeder, latFeeder]
  // (Hinweis: In EPSG:3857 gespeichert!)
  static SitePosition;

  // Flugzeug-Icons als Features
  static PlaneIconFeatures = new Vector();

  // Flugzeug-Icons als Features (WebGL)
  static WebglFeatures = new Vector<Point>();

  // Liste mit Flugzeugen (sollte immer mit Planes synchron gehalten werden)
  static PlanesOrdered: Aircraft[] = [];

  // Group als Sammlung an Trails der Flugzeuge
  static trailGroup = new Collection<Layer>();

  // Group als Sammlung aller Trails
  static allTrailsGroup = new Collection<Layer>();

  // Cache der Icons
  static iconCache = {};
  static addToIconCache: any = [];

  // Anzahl der angezeigten Flugzeuge
  static amountDisplayedAircraft: any;

  // Helligkeitswert der Karte
  static luminosityValueMap = 0.26;

  // Boolean, ob großes Info-Fenster (Info-Box an sich) angezeigt werden soll
  // Hinweis: "kleines" Info-Fenster ist noch die Hover-Info-Box
  static displayAircraftInfoLarge = false;

  // Globale Skalierung der Flugzeug-Icons (WebGL & Non-WebGL)
  static globalScaleFactorIcons;

  // Skalierung der kleinen Flugzeug-Icons (WebGL & Non-WebGL)
  static smallScaleFactorIcons;

  // Default-Wert für globale Skalierung der Flugzeug-Icons (WebGL & Non-WebGL),
  // um Werte wieder zurückzusetzen auf Wert aus Configuration vom Server
  static defaultGlobalScaleFactorIcons;

  // Default-Wert für Skalierung der kleinen Flugzeug-Icons (WebGL & Non-WebGL),
  // um Werte wieder zurückzusetzen auf Wert aus Configuration vom Server
  static defaultSmallScaleFactorIcons;

  // Boolean, ob Flugzeug-Labels angezeigt werden sollen
  static showAircraftLabel: boolean = false;

  // Boolean, ob WebGL benutzt werden soll
  static webgl: boolean = false;

  // Boolean, ob WebGL beim Start der Anwendung genutzt werden soll
  static useWebglOnStartup: boolean;

  // Initiale Werte für WebGL-Icon ggf. anpassen
  static glIconSize = 72;
  static glImapWidth = 8;
  static glImapHeight = 36;

  // Shapes-Map vom Server (ehem. "shapes" in Markers)
  static shapesMap: any;

  // Category-Map vom Server (ehem. "CategoryIcons" in Markers)
  static catMap: any;

  // Types-Map vom Server (ehem. "TypeDesignatorIcons" in Markers)
  static typesMap: any;

  // Layer für POMD-Features
  static POMDFeatures = new Vector();

  // Boolean, ob POMD-Point angezeigt werden soll
  static showPOMDPoint: boolean;

  // IP-Adresse des Clients
  static clientIp: any;

  // Koordinaten, die den aktuellen Geräte-Standort markieren [lon, lat]
  // (im LocalStorage gespeichert) (Hinweis: In EPSG:3857 gespeichert!)
  static DevicePosition: any;

  // Boolean, ob die Geräte-Position für die Distanz-Berechnungen
  // genutzt werden soll
  static useDevicePositionForDistance: boolean;

  // Boolean, ob Opensky-Credentials gesetzt wurden
  static openskyCredentials: boolean = false;

  // Boolean, ob 3d-Map angezeigt werden soll (OL-Cesium)
  static display3dMap: Boolean = false;

  // Boolean, ob aircraft table sichtbar ist
  static aircraftTableIsVisible: boolean;

  // Server-Adresse
  static serverUrl = environment.baseUrl;

  // URL zum Server zum Aktualisieren der Flugzeuge von den Feedern
  static urlGetPlanes = 'http://' + Globals.serverUrl + ':8080/getAircraftList';

  // URL zum Server zum Aktualisieren der Flughäfen
  static urlGetAirports =
    'http://' + Globals.serverUrl + ':8080/getAirportList';

  // URL zum Server zum Holen aller Daten über ein Flugzeug aus der Datenbank
  static urlGetAircraftData =
    'http://' + Globals.serverUrl + ':8080/getAllAircraftData';

  // URL zum Server zum Senden des Flugzeugs für die Range-Daten
  static urlPostRangeData: string =
    'http://' + Globals.serverUrl + ':8080/postRangeData';

  // URL zum Server zum Holen von Range-Daten zwischen einem bestimmten Zeitraum
  static urlGetRangeDataBetweenTimestamps: string =
    'http://' + Globals.serverUrl + ':8080/getRangeDataBetweenTimestamps';

  // URL zum Server zum Holen von Konfigurations-Variablen
  static urlGetConfigurationData: string =
    'http://' + Globals.serverUrl + ':8080/getConfigurationData';

  // URL zum Server zum Holen der Trail-Daten eines Flugzeugs
  static urlGetTrailData: string =
    'http://' + Globals.serverUrl + ':8080/getTrail';

  // URL zum Server zum Holen der ISS ohne Extent
  static urlGetISSWithoutExtent: string =
    'http://' + Globals.serverUrl + ':8080/getIssWithoutExtent';

  // URL zum Server zum Holen der ISS ohne Extent
  static urlGetModelFromServer: string =
    'http://' + Globals.serverUrl + ':8080/get3dModel';

  // URL zum Server zum Holen aller Trails
  static urlGetAllTrailData: string =
    'http://' + Globals.serverUrl + ':8080/getAllTrails';

  // URL zum Server zum Fetchen von AIS-Daten
  static urlGetAisData = 'http://' + Globals.serverUrl + ':8080/getAisData';

  // URL zum Server zum Fetchen von AIS-Schiff-Foto-Urls
  static urlGetAisPhoto = 'http://' + Globals.serverUrl + ':8080/getAisPhoto';
}
