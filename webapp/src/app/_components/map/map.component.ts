import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';
import { Style, Fill, Stroke, Circle, Icon } from 'ol/style';
import OSM from 'ol/source/OSM';
import * as olProj from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import { Group as LayerGroup, WebGLPoints } from 'ol/layer';
import { ServerService } from 'src/app/_services/server-service/server-service.service';
import { Aircraft } from 'src/app/_classes/aircraft';
import { Globals } from 'src/app/_common/globals';
import { Helper } from 'src/app/_classes/helper';
import { Markers } from 'src/app/_classes/markers';
import { Title } from '@angular/platform-browser';
import Colorize from 'ol-ext/filter/Colorize';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import * as olInteraction from 'ol/interaction';
import * as olExtent from 'ol/extent';
import LineString from 'ol/geom/LineString';
import * as olExtSphere from 'ol-ext/geom/sphere';
import Polygon from 'ol/geom/Polygon';
import Overlay from 'ol/Overlay';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { Feeder } from 'src/app/_classes/feeder';
import { ToolbarService } from 'src/app/_services/toolbar-service/toolbar-service.service';
import {
  ScaleLine,
  defaults as defaultControls,
  Attribution,
} from 'ol/control';
import { AircraftTableService } from 'src/app/_services/aircraft-table-service/aircraft-table-service.service';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Subject, Subscription } from 'rxjs';
import { Styles } from 'src/app/_classes/styles';
import { Collection } from 'ol';
import { Draw } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import XYZ from 'ol/source/XYZ';
import { RainviewerService } from 'src/app/_services/rainviewer-service/rainviewer-service.service';
import { Maps } from 'src/app/_classes/maps';
import { CesiumService } from 'src/app/_services/cesium-service/cesium-service.component';
import { dummyParentAnimation } from 'src/app/_common/animations';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  animations: [dummyParentAnimation],
})
export class MapComponent implements OnInit {
  // Openlayers Karte
  OLMap: any;

  // Openlayers Layer auf Karte
  layers!: Collection<any>;

  // Layer für die OSM Map
  osmLayer: any;

  // Layer für Range Data
  rangeDataLayer!: VectorLayer<VectorSource<Geometry>>;

  // Layer für Flugzeuge (kein WebGL)
  planesLayer!: VectorLayer<VectorSource<Geometry>>;

  // Entfernungs-Ringe und Feeder-Position als Features
  StaticFeatures = new Vector();

  // Flughäfen als Features
  AirportFeatures = new Vector();

  // Route als Kurve zum Zielort als Features
  RouteFeatures = new Vector();

  // RangeData als Features
  RangeDataFeatures = new Vector();

  // Objekt mit allen Flugzeugen
  Planes: { [hex: string]: Aircraft } = {};

  // Aktuell angeklicktes Aircraft
  aircraft: Aircraft | null = null;

  // Aktuell gehovertes Aircraft
  hoveredAircraftObject: any;

  // Distanzen fuer darzustellende Ringe (in nm)
  circleDistancesInNm: number[] = [];

  // Array mit Feedern aus Konfiguration
  listFeeder: Feeder[] = [];

  // Info über Fehler, wenn Konfiguration nicht geladen
  // werden kann und das Programm nicht startet
  infoConfigurationFailureMessage;

  // Boolean, in welchem Modus sich die Anwendung befindet
  isDesktop!: boolean;

  // Ausgewählter Feeder im Select
  selectedFeederUpdate: string = 'AllFeeder';

  // Default-Werte für Fetch-Booleans
  showAirportsUpdate: boolean = true;
  showOpenskyPlanes: boolean = false;
  showIss: boolean = true;

  // Anzahl der momentan laufenden Fetches (Flugzeuge) an den Server
  pendingFetchesPlanes = 0;

  // Anzahl der momentan laufenden Fetches (Airports) an den Server
  pendingFetchesAirports = 0;

  // Boolean, ob DarkMode aktiviert ist
  darkMode: boolean = false;

  // Boolean, ob Flugzeug-Label angezeigt werden sollen
  toggleShowAircraftLabels: boolean = false;

  // Boolean, ob Flugzeug-Positionen angezeigt werden sollen
  toggleShowAircraftPositions: boolean = true;

  // Zeige Route zwischen Start-Flugzeug-Ziel an
  showRoute: any;

  // Gespeicherte Position und ZoomLevel des Mittelpunkts der Karte
  oldCenterPosition: any;
  oldCenterZoomLevel: any;

  // Boolean zum Anzeigen der ShortInfo beim Hovern
  public showSmallInfo = false;

  // Positions-Werte für die SmallInfoBox (initialisiert mit Default-Werten)
  public topValue = 60;
  public leftValue = 40;

  // RangeData vom Server
  rangeDataJSON: any;

  // Aktuell angeklickter RangeDataPoint (Feature)
  rangeDataPoint: any;

  // Boolean, ob Popup für RangeDataPoint angezeigt
  // werden soll nach Klick
  showPopupRangeDataPoint: boolean = false;

  // Positionswerte für das Popup zum Anzeigen der
  // RangeData-Informationen
  leftValueRangeData!: number;
  topValueRangeData!: number;

  // Popup für RangeData-Punkte
  rangeDataPopup: any;

  // Number-Array mit Timestamps (startTime, endTime)
  datesCustomRangeData!: number[];

  // Boolean, ob RangeData nach Feeder farblich sortiert sein soll
  bMarkRangeDataByFeeder: boolean = false;

  // Boolean, ob RangeData nach Höhe farblich sortiert sein soll
  bMarkRangeDataByHeight: boolean = false;

  // Bottom-Wert für RangeDataPopup
  // (wenn dieser angezeigt wird, soll dieser auf 10px gesetzt werden)
  rangeDataPopupBottomValue: any = 0;

  // Selektierte Feeder, nachdem Range Data selektiert werden soll
  selectedFeederRangeData: any;

  // Layer für WebGL-Features
  webglLayer: WebGLPoints<VectorSource<Point>> | undefined;

  private ngUnsubscribe = new Subject();

  // Boolean, ob POMD-Point angezeigt werden soll
  showPOMDPoint: boolean = false;

  // Boolean, ob Range-Data sichtbar ist
  rangeDataIsVisible: boolean = true;

  // Alte Kartenposition und Zoomlevel, wenn ISS im Zentrum angezeigt werden soll
  oldISSCenterPosition: any;
  oldISSCenterZoomLevel: any;

  // Layer zum Zeichnen der aktuellen Geräte-Position
  drawLayer: any;

  // Aktuelle Geräte-Position als Feature
  DrawFeature = new Vector();

  // Boolean, ob RainViewer (Rain) Data sichtbar ist
  showRainViewerRain: boolean = false;

  // Boolean, ob RainViewer (Clouds) Data sichtbar ist
  showRainViewerClouds: boolean = false;

  // Boolean, ob RainViewer Forecast (Rain) Data sichtbar ist
  showRainViewerRainForecast: boolean = false;

  // Layer für die Rainviewer Daten (Regen)
  rainviewerRainLayer: TileLayer<XYZ> = new TileLayer();

  // Layer für die Rainviewer Daten (Clouds)
  rainviewerCloudsLayer: TileLayer<XYZ> = new TileLayer();

  // Urls für RainViewer Forecast
  forecastRainPathAndTime: any[] = [];

  // Id des Refresh-Intervals für Rainviewer-Daten
  refreshIntervalIdRainviewer: any;

  // Id des Refresh-Intervals für Rainviewer-Daten (Forecast Animation)
  refreshIntervalIdRainviewerForecast: any;

  // Ids für timeouts zum Anzeigen der Forecast-Animation-Frames
  timeoutHandlerForecastAnimation: any;

  // Aktuell angeklickter AirportDataPoint (Feature)
  airportDataPoint: any;

  // Positionswerte für das Popup zum Anzeigen der
  // AirportData-Informationen
  leftValueAirporteData!: number;
  topValueAirportData!: number;

  // Popup für AirportData-Punkte
  airportDataPopup: any;

  // Bottom-Wert für AirportDataPopup
  // (wenn dieser angezeigt wird, soll dieser auf 10px gesetzt werden)
  airportDataPopupBottomValue: any = 0;

  // Layer für Airports
  airportLayer!: VectorLayer<VectorSource<Geometry>>;

  // Liste an verfügbaren Map-Stilen
  listAvailableMaps: any;

  // API-Key für Geoapify
  geoapifyApiKey: any;

  // Aktuell ausgewählter Map-Stil
  currentSelectedMapStyle: any;

  // Boolean, ob Map gedimmt werden soll
  dimMap: boolean = true;

  // Boolean, ob dunkle Range Ringe und dunkles Antenna-Icon gezeigt werden soll
  darkStaticFeatures: boolean = true;

  // Access Token für Cesium Ion für 3d-Komponente
  cesiumIonDefaultAccessToken: any;

  // API-Key für Google Maps
  cesiumGoogleMapsApiKey: any;

  // Boolean, ob Map gerade bewegt wird
  mapIsBeingMoved: boolean = false;

  // Subscriptions
  subscriptions: Subscription[] = [];

  // Boolean, um große Info-Box beim Klick anzuzeigen (in Globals, da ein
  // Klick auf das "X" in der Komponente die Komponente wieder ausgeblendet
  // werden soll und der Aufruf aus der Info-Komponente geschehen soll)
  get displayAircraftInfo() {
    return Globals.displayAircraftInfoLarge;
  }

  // Boolean, um 3d-Map anzuzeigen (in Globals, da ein
  // Klick auf das "X" in der Komponente die Komponente wieder ausgeblendet
  // werden soll und der Aufruf aus der 3d-Map-Komponente geschehen soll)
  get display3dMap() {
    return Globals.display3dMap;
  }

  constructor(
    private serverService: ServerService,
    private titleService: Title,
    public breakpointObserver: BreakpointObserver,
    private settingsService: SettingsService,
    private toolbarService: ToolbarService,
    private aircraftTableService: AircraftTableService,
    private snackBar: MatSnackBar,
    private rainviewerService: RainviewerService,
    private cesiumService: CesiumService
  ) {}

  /**
   * Einstiegspunkt
   */
  ngOnInit(): void {
    // Hole Konfiguration vom Server, wenn diese nicht vorhanden ist, breche ab
    this.getConfiguration();
  }

  /**
   * Initiierung der Abonnements
   */
  initSubscriptions() {
    // Zeige Range-Data zwischen Zeitstempeln
    let sub1 = this.settingsService.timesAsTimestamps$
      .pipe()
      .subscribe((timesAsTimestamps) => {
        if (timesAsTimestamps) {
          this.datesCustomRangeData = timesAsTimestamps;
          this.receiveShowAllCustomRangeData();
        }
      });
    this.subscriptions.push(sub1);

    // Toggle verstecke Range-Data
    let sub2 = this.settingsService.toggleHideRangeData$
      .pipe()
      .subscribe((toggleHideRangeData) => {
        this.rangeDataIsVisible = !toggleHideRangeData;
        this.hideRangeDataOverlay(toggleHideRangeData);
      });
    this.subscriptions.push(sub2);

    // Toggle markiere Range-Data nach Feeder
    let sub3 = this.settingsService.toggleMarkRangeDataByFeeder$
      .pipe()
      .subscribe((toggleMarkRangeDataByFeeder) => {
        this.bMarkRangeDataByFeeder = toggleMarkRangeDataByFeeder;
        this.markRangeDataByFeeder();
      });
    this.subscriptions.push(sub3);

    // Toggle markiere Range-Data nach Höhe
    let sub4 = this.settingsService.toggleMarkRangeDataByHeight$
      .pipe()
      .subscribe((toggleMarkRangeDataByHeight) => {
        this.bMarkRangeDataByHeight = toggleMarkRangeDataByHeight;
        this.markRangeDataByHeight();
      });
    this.subscriptions.push(sub4);

    // Toggle zeige Flugzeug-Labels
    let sub5 = this.settingsService.toggleShowAircraftLabels$
      .pipe()
      .subscribe((toggleShowAircraftLabels) => {
        this.toggleShowAircraftLabels = toggleShowAircraftLabels;
        this.receiveToggleShowAircraftLabels();
      });
    this.subscriptions.push(sub5);

    // Filtere Range-Data nach selektiertem Feeder
    let sub6 = this.settingsService.selectedFeeder$
      .pipe()
      .subscribe((selectedFeederArray) => {
        this.selectedFeederRangeData = selectedFeederArray;
        this.filterRangeDataBySelectedFeeder();
      });
    this.subscriptions.push(sub6);

    // Markiere/Entmarkiere ein Flugzeug, wenn es in der Tabelle ausgewählt wurde
    let sub7 = this.aircraftTableService.hexMarkUnmarkAircraft$
      .pipe()
      .subscribe((hexMarkUnmarkAircraft) => {
        this.markUnmarkAircraftFromAircraftTable(hexMarkUnmarkAircraft);
      });
    this.subscriptions.push(sub7);

    // Zeige Flugzeuge nach selektiertem Feeder an
    let sub8 = this.settingsService.selectedFeederUpdate$
      .pipe()
      .subscribe((selectedFeederUpdate) => {
        this.selectedFeederUpdate = selectedFeederUpdate;
        this.showAircraftFromFeeder(selectedFeederUpdate);
      });
    this.subscriptions.push(sub8);

    // Toggle Flughäfen auf der Karte
    let sub9 = this.settingsService.showAirportsUpdate$
      .pipe()
      .subscribe((showAirportsUpdate) => {
        this.showAirportsUpdate = showAirportsUpdate;

        if (this.showAirportsUpdate) {
          this.updateAirportsFromServer();
        } else {
          // Lösche alle Flughäfen-Features
          this.AirportFeatures.clear();
        }
      });
    this.subscriptions.push(sub9);

    // Zeige Opensky Flugzeuge und Flugzeuge nach selektiertem Feeder an
    let sub10 = this.settingsService.showOpenskyPlanes$
      .pipe()
      .subscribe((showOpenskyPlanes) => {
        this.showOpenskyPlanes = showOpenskyPlanes;

        if (this.showOpenskyPlanes) {
          // Aktualisiere Flugzeuge vom Server
          this.updatePlanesFromServer(
            this.selectedFeederUpdate,
            this.showOpenskyPlanes,
            this.showIss
          );

          // Aktualisiere Daten des markierten Flugzeugs
          if (this.aircraft) {
            this.getAllAircraftData(this.aircraft);
          }
        } else {
          // Lösche alle bisherigen Opensky-Flugzeuge
          this.removeAllOpenskyPlanes();
        }
      });
    this.subscriptions.push(sub10);

    // Zeige ISS und Opensky Flugzeuge und Flugzeuge nach selektiertem Feeder an
    let sub11 = this.settingsService.showISS$.pipe().subscribe((showIss) => {
      this.showIss = showIss;

      // Wenn ISS nicht mehr angezeigt werden soll, entferne sie von Liste
      if (!this.showIss) {
        this.removeISSFromPlanes();
      }

      // Aktualisiere Flugzeuge vom Server
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showOpenskyPlanes,
        this.showIss
      );

      // Aktualisiere Daten des markierten Flugzeugs
      if (this.aircraft) {
        this.getAllAircraftData(this.aircraft);
        this.getTrailToAircraft(this.aircraft, this.selectedFeederUpdate);
      }
    });
    this.subscriptions.push(sub11);

    // Toggle DarkMode
    let sub12 = this.settingsService.showDarkMode$
      .pipe()
      .subscribe((showDarkMode) => {
        this.darkMode = showDarkMode;
        this.setCenterOfRangeRings(Globals.useDevicePositionForDistance);
      });
    this.subscriptions.push(sub12);

    // Toggle POMD-Point
    let sub13 = this.settingsService.showPOMDPoint$
      .pipe()
      .subscribe((showPOMDPoint) => {
        this.showPOMDPoint = showPOMDPoint;
        this.receiveToggleShowPOMDPoints();
      });
    this.subscriptions.push(sub13);

    // Toggle WebGL
    let sub14 = this.settingsService.useWebgl$.pipe().subscribe((webgl) => {
      // Setze globalen WebGL-Boolean
      Globals.webgl = webgl;

      // Initialisiert oder deaktiviert WebGL
      // Deaktiviert WegGL, wenn Initialisierung fehlschlägt
      Globals.webgl = this.initWebgl();
    });
    this.subscriptions.push(sub14);

    let sub15 = this.settingsService.centerMapOnIssSource$
      .pipe()
      .subscribe((centerMapOnIss) => {
        // Zentriere Karte auf die ISS oder gehe zur
        // vorherigen Position zurück
        this.receiveCenterMapOnIss(centerMapOnIss);
      });
    this.subscriptions.push(sub15);

    // Bestimme aktuellen Geräte-Standort
    let sub16 = this.settingsService.setCurrentDevicePositionSource$
      .pipe()
      .subscribe((setDevicePosition) => {
        if (setDevicePosition) {
          this.setCurrentDevicePosition();
        } else {
          this.deleteDevicePosition();
        }
      });
    this.subscriptions.push(sub16);

    // Toggle Geräte-Standort als Basis für versch. Berechnungen (Zentrum für Range-Ringe,
    // Distance- und POMD-Feature-Berechnungen (default: Site-Position ist Zentrum der Range-Ringe)
    let sub17 = this.settingsService.devicePositionAsBasisSource$
      .pipe()
      .subscribe((devicePositionAsBasis) => {
        // Setze Boolean für Distanz-Berechnungen
        Globals.useDevicePositionForDistance = devicePositionAsBasis;

        // Setze Zentrum der Range-Ringe
        this.setCenterOfRangeRings(devicePositionAsBasis);
      });
    this.subscriptions.push(sub17);

    // Toggle Rainviewer (Rain)
    let sub18 = this.settingsService.rainViewerRain$
      .pipe()
      .subscribe((rainViewerRain) => {
        // Setze showRainViewerRain-Boolean
        this.showRainViewerRain = rainViewerRain;

        // Zeigt oder versteckt RainViewer (Rain)
        this.createOrHideRainViewerRain();
      });
    this.subscriptions.push(sub18);

    // Toggle Rainviewer (Clouds)
    let sub19 = this.settingsService.rainViewerClouds$
      .pipe()
      .subscribe((rainViewerClouds) => {
        // Setze showRainViewerClouds-Boolean
        this.showRainViewerClouds = rainViewerClouds;

        // Zeigt oder versteckt RainViewer (Clouds)
        this.createOrHideRainViewerClouds();
      });
    this.subscriptions.push(sub19);

    // Toggle Rainviewer Forecast (Rain)
    let sub20 = this.settingsService.rainViewerRainForecast$
      .pipe()
      .subscribe((rainViewerRainForecast) => {
        // Setze showRainViewerRainForecast-Boolean
        this.showRainViewerRainForecast = rainViewerRainForecast;

        // Zeigt oder versteckt RainViewer Forecast (Rain)
        this.createOrHideRainViewerRain();
      });
    this.subscriptions.push(sub20);

    // Toggle zeige/verstecke Flugzeug-Positionen
    let sub21 = this.settingsService.toggleShowAircraftPositions$
      .pipe()
      .subscribe((toggleShowAircraftPositions) => {
        this.toggleShowAircraftPositions = toggleShowAircraftPositions;
        this.receiveToggleShowAircraftPositions();
      });
    this.subscriptions.push(sub21);

    // Callback für anderen Map-Stil
    let sub22 = this.settingsService.selectMapStyleSource$
      .pipe()
      .subscribe((selectedMapStyle) => {
        this.saveMapStyleInLocalStorage(selectedMapStyle);
        this.createBaseLayer();
      });
    this.subscriptions.push(sub22);

    // Toggle dimme Map
    let sub23 = this.settingsService.dimMapSource$
      .pipe()
      .subscribe((dimMap) => {
        this.dimMap = dimMap;
        this.dimMapOrRemoveFilter();
      });
    this.subscriptions.push(sub23);

    // Toggle dunkle Range Ringe und dunkles Antenna-Icon
    let sub24 = this.settingsService.darkStaticFeaturesSource$
      .pipe()
      .subscribe((darkStaticFeatures) => {
        this.darkStaticFeatures = darkStaticFeatures;
        this.createRangeRingsAndSitePos(
          Globals.DevicePosition ? Globals.DevicePosition : Globals.SitePosition
        );
        this.toggleDarkModeInRangeData();
      });
    this.subscriptions.push(sub24);

    // Setze Global icon size der Planes
    let sub25 = this.settingsService.setIconGlobalSizeSource$
      .pipe()
      .subscribe((globalIconSizeFactor) => {
        Globals.globalScaleFactorIcons = globalIconSizeFactor;
        this.setNewIconSizeScaleAndRedrawPlanes(
          Globals.globalScaleFactorIcons,
          Globals.smallScaleFactorIcons
        );
      });
    this.subscriptions.push(sub25);

    // Setze icon size für small Planes
    let sub26 = this.settingsService.setIconSmallSizeSource$
      .pipe()
      .subscribe((smallIconSizeFactor) => {
        Globals.smallScaleFactorIcons = smallIconSizeFactor;
        this.setNewIconSizeScaleAndRedrawPlanes(
          Globals.globalScaleFactorIcons,
          Globals.smallScaleFactorIcons
        );
      });
    this.subscriptions.push(sub26);

    // Zeige oder verstecke Altitude-Chart
    let sub27 = this.settingsService.showAltitudeChartSource$
      .pipe()
      .subscribe((showAltitudeChart) => {
        document.getElementById('altitude_chart')!.style.visibility =
          showAltitudeChart ? 'visible' : 'hidden';
      });
    this.subscriptions.push(sub27);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  startProgram() {
    // Initiiere Abonnements
    this.initSubscriptions();

    // Initialisiere Dark- oder Light-Mode
    this.initDarkMode();

    // Initialisiere Map
    this.initMap();

    // Initialisiere Beobachtung
    // des Anwendungsmoduses
    this.initBreakPointObserver();

    // Initialisiere WebGL beim Start der Anwendung
    this.initWebglOnStartup();

    // Initialisiere Update-Aircraft-Funktion
    this.initAircraftFetching();

    // Initiiere Fetch-Funktion vom Server,
    // nachdem die Karte bewegt wurde
    this.fetchAircraftAfterMapMove();

    // Initialisiere Single-Click auf Aircraft
    this.initClickOnMap();

    // Initialisiere Hover über Aircraft
    this.initHoverOverAircraftIcon();

    // Sende initiale Informationen an Settings-Komponente
    this.sendInformationToSettings();
  }

  /**
   * Holt die Konfiguration vom Server und intialisiert wichtige
   * Variable wie anzuzeigende Position. Wenn alle erforderlichen
   * Variablen vorhanden und gesetzt sind, starte das eigentliche
   * Programm
   */
  getConfiguration() {
    this.serverService
      .getConfigurationData()
      .pipe()
      .subscribe(
        (configuration) => {
          // Setze Werte aus Konfiguration
          Globals.latFeeder = configuration.latFeeder;
          Globals.lonFeeder = configuration.lonFeeder;
          Globals.globalScaleFactorIcons = configuration.scaleIcons;
          Globals.smallScaleFactorIcons = configuration.smallScaleIcons;

          // Setze App-Name und App-Version
          Globals.appName = configuration.appName;
          Globals.appVersion = configuration.appVersion;

          // Setze SitePosition aus neu zugewiesenen Werten
          Globals.SitePosition = [Globals.lonFeeder, Globals.latFeeder];

          // Setze shapesMap, catMap, typesMap
          Globals.shapesMap = configuration.shapesMap;
          Globals.catMap = configuration.catMap;
          Globals.typesMap = configuration.typesMap;

          // Setze IP-Adresse des Clients
          Globals.clientIp = configuration.clientIp;

          // Setze Boolean, ob Opensky-Credentials vorhanden sind
          Globals.openskyCredentials = configuration.openskyCredentials;

          // Konvertiere circleDistancesInNm aus JSON richtig in Array
          if (configuration.circleDistancesInNm) {
            this.circleDistancesInNm = [];

            let jsonArray: number[] = configuration.circleDistancesInNm;
            for (let i = 0; i < jsonArray.length; i++) {
              this.circleDistancesInNm[i] = jsonArray[i];
            }
          }

          // Erstelle Feeder aus Konfiguration, damit Farbe in Statistiken richtig gesetzt wird
          if (configuration.listFeeder) {
            this.listFeeder = [];
            for (let i = 0; i < configuration.listFeeder.length; i++) {
              this.listFeeder.push(
                new Feeder(
                  configuration.listFeeder[i].name,
                  configuration.listFeeder[i].type,
                  configuration.listFeeder[i].color
                )
              );
            }
          }

          // Setze Geoapify-API-Key (nicht mandatory)
          if (configuration.geoapifyApiKey) {
            this.geoapifyApiKey = configuration.geoapifyApiKey;
          }

          // Setze Cesium Ion-Default Access Token (nicht mandatory)
          if (configuration.cesiumIonDefaultAccessToken) {
            this.cesiumIonDefaultAccessToken =
              configuration.cesiumIonDefaultAccessToken;
          }

          // Setze Cesium.GoogleMaps-API-Key (nicht mandatory)
          if (configuration.cesiumGoogleMapsApiKey) {
            this.cesiumGoogleMapsApiKey = configuration.cesiumGoogleMapsApiKey;
          }
        },
        (error) => {
          console.log(
            'Configuration could not be loaded. Is the server online? Program will not be executed further.'
          );
          this.infoConfigurationFailureMessage =
            'Configuration could not be loaded. Is the server online? Program will not be executed further.';
        },
        () => {
          // Überprüfe gesetzte Werte und starte Programm
          if (
            (Globals.latFeeder,
            Globals.lonFeeder,
            Globals.globalScaleFactorIcons,
            Globals.SitePosition,
            Globals.appName,
            Globals.appVersion,
            this.circleDistancesInNm.length != 0,
            this.listFeeder.length != 0,
            Globals.shapesMap,
            Globals.catMap,
            Globals.typesMap,
            Globals.clientIp)
          ) {
            this.startProgram();
          } else {
            this.infoConfigurationFailureMessage =
              'Configuration could not be loaded. Is the server online? Program will not be executed further.';
          }
        }
      );
  }

  /**
   * Initialisiert die Karte mit RangeRingen,
   * Feeder-Position und Layern
   */
  initMap(): void {
    // Erstelle Basis OSM-Layer
    this.createBaseLayer();

    // Erstelle Layer
    this.createLayer();

    // Erstelle Map
    this.createBaseMap();

    // Erstelle Entfernungs-Ringe und Feeder-Position
    // (Default-Zentrum: Site-Position)
    this.createRangeRingsAndSitePos(Globals.SitePosition);
  }

  /**
   * Erstellt den Basis OSM-Layer
   */
  createBaseLayer() {
    this.currentSelectedMapStyle = this.getMapStyleFromLocalStorage();

    if (this.layers == undefined) {
      this.layers = new Collection();
    }

    if (this.layers.getLength() > 0) {
      // Remove old osmLayer to improve performance when changing maps
      this.layers.removeAt(0);
    }

    this.osmLayer = new TileLayer({
      source: new OSM({
        url: this.currentSelectedMapStyle.url,
        attributions: this.currentSelectedMapStyle.attribution,
      }),
      preload: 0,
      useInterimTilesOnError: false,
    });

    this.dimMapOrRemoveFilter();

    this.layers.insertAt(0, this.osmLayer);
  }

  /**
   * Beobachtet den Modus der Anwendung (Desktop/Mobile)
   * und setzt die Variable isDesktop entsprechend
   */
  initBreakPointObserver() {
    let sub = this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe()
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          // Setze Variable auf 'Mobile'
          this.isDesktop = false;

          // Ändere Modus der Flugzeug-Tabelle
          this.aircraftTableService.updateWindowMode(this.isDesktop);
        } else {
          // Setze Variable auf 'Desktop'
          this.isDesktop = true;

          // Ändere Modus der Flugzeug-Tabelle
          this.aircraftTableService.updateWindowMode(this.isDesktop);
        }
      });
    this.subscriptions.push(sub);
  }

  /**
   * Initialisiert den Dark- oder Light-Modus und setzt die ent-
   * sprechende Variable. Auch ein Listener wird initialisiert, damit
   * der Modus gewechselt wird, wenn die System-Theme geändert wird
   */
  initDarkMode() {
    // Detekte dunklen Modus und setze Variable initial
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // dark mode
      this.darkMode = true;
    } else {
      // light mode
      this.darkMode = false;
    }

    // Initialisiere Listener, um auf System-Veränderungen reagieren zu können
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => {
        if (event.matches) {
          // dark mode
          this.darkMode = true;
        } else {
          // light mode
          this.darkMode = false;
        }
      });
  }

  /**
   * Erstellt die Entfernungs-Ringe sowie die
   * Anzeige der Feeder-Postion
   */
  createRangeRingsAndSitePos(lonLatPosition: []) {
    if (lonLatPosition === null) return;

    this.StaticFeatures.clear();

    // Erstelle fuer jede CircleDistance einen Kreis
    for (let i = 0; i < this.circleDistancesInNm.length; i++) {
      // nautical
      let conversionFactor = 1852.0;

      let distance = this.circleDistancesInNm[i] * conversionFactor;
      let circle = Helper.makeGeodesicCircle(lonLatPosition, distance, 180);
      circle.transform('EPSG:4326', 'EPSG:3857');
      let featureCircle = new Feature(circle);

      // Style des Rings
      let circleStyle = new Style({
        stroke: new Stroke({
          color: this.darkStaticFeatures ? 'black' : 'white',
          width: this.darkStaticFeatures ? 1 : 0.4,
        }),
      });

      // Fuege Ring zu StaticFeatures hinzu
      featureCircle.setStyle(circleStyle);
      this.StaticFeatures.addFeature(featureCircle);
    }

    // Erstelle Marker an Feeder-Position und
    // fuege Marker zu StaticFeatures hinzu
    const antennaStyle = new Style({
      image: new Icon({
        src: this.darkStaticFeatures
          ? '../../assets/antenna.svg'
          : '../../assets/antenna_dark.svg',
        offset: [0, 0],
        opacity: 1,
        scale: 0.7,
      }),
    });

    let feature = new Feature(
      new Point(olProj.fromLonLat(Globals.SitePosition))
    );
    feature.setStyle(antennaStyle);
    this.StaticFeatures.addFeature(feature);

    // Erstelle Feature für den aktuellen Geräte-Standort
    this.drawDevicePositionFromLocalStorage();
  }

  /**
   * Erstellt die Map mit der aktuellen Feeder-Position
   * als Mittelpunkt
   */
  createBaseMap() {
    // Verhindere Rotation beim Pinch to Zoom-Gesten
    let interactions = olInteraction.defaults({
      altShiftDragRotate: false,
      pinchRotate: false,
    });

    // Erstelle Maßstabs-Anzeige mit nautischen Meilen
    let control = new ScaleLine({
      units: 'nautical',
    });

    // Erstelle eingeklappte Attribution
    const attribution: Attribution = new Attribution({
      collapsible: true,
      collapsed: true,
      tipLabel:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>  contributors.',
    });

    // Initialisiere OL Map
    this.OLMap = new Map({
      interactions: interactions,
      controls: defaultControls({ attribution: false }).extend([
        control,
        attribution,
      ]),
      target: 'map_canvas',
      layers: this.layers,
      maxTilesLoading: 16,
      view: new View({
        center: olProj.fromLonLat(Globals.SitePosition),
        zoom: Globals.zoomLevel,
        multiWorld: true,
      }),
    });
  }

  /**
   * Erstellt die einzelnen Layer für die Maps
   */
  createLayer() {
    const renderBuffer = 80;

    // Fuege Layer fuer Icons der Flugzeuge hinzu
    this.planesLayer = new VectorLayer({
      source: Globals.PlaneIconFeatures,
      zIndex: 200,
      declutter: false,
      renderOrder: undefined,
      renderBuffer: renderBuffer,
    });
    this.planesLayer.set('name', 'ac_positions');
    this.planesLayer.set('type', 'overlay');
    this.planesLayer.set('title', 'Aircraft positions');
    this.layers.push(this.planesLayer);

    // Erstelle layer fuer Trails der
    // Flugzeuge als Layer-Group
    // Layer der Trails
    let trailLayers = new LayerGroup({
      layers: Globals.trailGroup,
      zIndex: 150,
    });
    trailLayers.set('name', 'ac_trail');
    trailLayers.set('title', 'aircraft trails');
    trailLayers.set('type', 'overlay');
    this.layers.push(trailLayers);

    // Fuege Layer fuer POMDs hinzu
    let pomdLayer: VectorLayer<VectorSource<Geometry>> = new VectorLayer({
      source: Globals.POMDFeatures,
      zIndex: 130,
    });
    pomdLayer.set('name', 'pomd_positions');
    pomdLayer.set('type', 'overlay');
    pomdLayer.set('title', 'pomd positions');
    this.layers.push(pomdLayer);

    // Fuege Layer fuer Linie vom Zielort
    // zum Flugzeug und vom Flugzeug zum
    // Herkunftsort hinzu
    let routeLayer: VectorLayer<VectorSource<Geometry>> = new VectorLayer({
      source: this.RouteFeatures,
      renderOrder: undefined,
      style: new Style({
        stroke: new Stroke({
          color: '#EAE911',
          width: 2,
          lineDash: [0.2, 5],
        }),
      }),
      zIndex: 125,
    });
    routeLayer.set('name', 'ac_route');
    routeLayer.set('type', 'overlay');
    this.layers.push(routeLayer);

    // Fuege Layer zum Zeichnen der
    // Geräte-Position hinzu
    this.drawLayer = new VectorLayer({
      source: this.DrawFeature,
      style: new Style({}),
      renderOrder: undefined,
      zIndex: 110,
    });
    this.drawLayer.set('name', 'device_position');
    this.drawLayer.set('type', 'overlay');
    this.drawLayer.set('title', 'airport positions');
    this.layers.push(this.drawLayer);

    // Fuege Layer fuer Range-Ringe
    // und Feeder-Position hinzu
    let staticFeaturesLayer: VectorLayer<VectorSource<Geometry>> =
      new VectorLayer({
        source: this.StaticFeatures,
        zIndex: 100,
        renderBuffer: renderBuffer,
        renderOrder: undefined,
      });
    staticFeaturesLayer.set('name', 'site_pos');
    staticFeaturesLayer.set('type', 'overlay');
    staticFeaturesLayer.set('title', 'site position and range rings');
    this.layers.push(staticFeaturesLayer);

    // Fuege Layer fuer Range Data hinzu
    this.rangeDataLayer = new VectorLayer({
      source: this.RangeDataFeatures,
      zIndex: 50,
      renderBuffer: renderBuffer,
      renderOrder: undefined,
    });
    routeLayer.set('name', 'range_data');
    routeLayer.set('type', 'overlay');
    this.layers.push(this.rangeDataLayer);

    // Fuege Layer fuer Icons der Flughäfen hinzu
    this.airportLayer = new VectorLayer({
      source: this.AirportFeatures,
      renderOrder: undefined,
      zIndex: 10,
    });
    this.airportLayer.set('name', 'ap_positions');
    this.airportLayer.set('type', 'overlay');
    this.airportLayer.set('title', 'airport positions');
    this.layers.push(this.airportLayer);
  }

  /**
   * Initialisiert WebGL beim Start der Anwendung,
   * wenn WebGL vom Browser unterstützt wird
   */
  initWebglOnStartup() {
    if (Globals.useWebglOnStartup) {
      Globals.webgl = Globals.useWebglOnStartup;
      // Initialisiert oder deaktiviert WebGL
      // Deaktiviert WebGL, wenn Initialisierung fehlschlägt
      Globals.webgl = this.initWebgl();
    }
  }

  /**
   * Initialisiert den WebGL-Layer oder deaktiviert und
   * löscht den WebGL-Layer. Sollte die Initialisierung
   * fehlschlagen, wird false zurückgegeben
   */
  initWebgl() {
    let initSuccessful = false;

    if (Globals.webgl) {
      if (this.webglLayer) {
        return true;
      } else {
        // Versuche WebGL-Layer hinzuzufügen
        initSuccessful = this.addWebglLayer();
      }
    } else {
      // Entferne webglLayer and leere webglFeatures
      Globals.WebglFeatures.clear();

      if (this.webglLayer) {
        // Entferne WebGL-Layer von den Layern
        this.layers.remove(this.webglLayer);
      }

      this.webglLayer = undefined;

      // Lösche glMarker von jedem Flugzeug
      for (let i in Globals.PlanesOrdered) {
        const aircraft = Globals.PlanesOrdered[i];
        delete aircraft.glMarker;
      }
    }

    return initSuccessful;
  }

  /**
   * Fügt den WebGL-Layer zu den Layers hinzu.
   * Sollte ein Error auftreten, wird der Layer
   * wieder entfernt.
   * @returns boolean, wenn Initialisierung
   *          erfolgreich war
   */
  addWebglLayer(): boolean {
    let success = false;

    try {
      // Definiere WebGL-Style
      let glStyle = {
        symbol: {
          symbolType: 'image',
          src: '../../../assets/beluga_sprites.png',
          size: ['get', 'size'],
          offset: [0, 0],
          textureCoord: [
            'array',
            ['get', 'cx'],
            ['get', 'cy'],
            ['get', 'dx'],
            ['get', 'dy'],
          ],
          color: ['color', ['get', 'r'], ['get', 'g'], ['get', 'b'], 1],
          rotateWithView: false,
          rotation: ['get', 'rotation'],
        },
      };

      // Erstelle WebGL-Layer
      this.webglLayer = new WebGLPointsLayer({
        source: Globals.WebglFeatures,
        zIndex: 200,
        style: glStyle,
      });
      this.webglLayer.set('name', 'webgl_ac_positions');
      this.webglLayer.set('type', 'overlay');
      this.webglLayer.set('title', 'WebGL Aircraft positions');

      // Wenn Layer oder Renderer nicht vorhanden ist, returne false
      if (!this.webglLayer || !this.webglLayer.getRenderer()) return false;

      // Füge WebGL-Layer zu den Layern hinzu
      this.layers.push(this.webglLayer);

      this.OLMap.renderSync();

      success = true;
    } catch (error) {
      try {
        // Bei Error entferne WebGL-Layer von den Layern
        this.layers.remove(this.webglLayer);
      } catch (error) {
        console.error(error);
      }

      console.error(error);
      success = false;
    }

    return success;
  }

  /**
   * Aktualisiert den Icon-Cache
   */
  updateIconCache() {
    let item;
    let tryAgain: any = [];
    while ((item = Globals.addToIconCache.pop())) {
      let svgKey = item[0];
      let element = item[1];
      if (Globals.iconCache[svgKey] != undefined) {
        continue;
      }
      if (!element) {
        element = new Image();
        element.src = item[2];
        item[1] = element;
        tryAgain.push(item);
        continue;
      }
      if (!element.complete) {
        console.log('moep');
        tryAgain.push(item);
        continue;
      }

      Globals.iconCache[svgKey] = element;
    }
    Globals.addToIconCache = tryAgain;
  }

  /**
   * Initialisieren der Auto-Fetch Methoden mit Intervall
   */
  initAircraftFetching() {
    // Entfernen aller nicht geupdateten Flugzeuge alle 30 Sekunden
    window.setInterval(this.removeNotUpdatedPlanes, 30000, this);

    // Aufruf der Update-Methode für Flugzeuge alle zwei Sekunden
    window.setInterval(() => {
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showOpenskyPlanes,
        this.showIss
      );
    }, 2000);

    // Update des Icon-Caches alle 850 ms
    window.setInterval(this.updateIconCache, 850);
  }

  /**
   * Initiiere Fetch vom Server, nachdem die Karte bewegt wurde
   */
  fetchAircraftAfterMapMove() {
    if (this.OLMap) {
      this.OLMap.on('movestart', () => {
        this.mapIsBeingMoved = true;

        Globals.webgl &&
          Globals.amountDisplayedAircraft > 2000 &&
          this.webglLayer?.setOpacity(0.25);
      });

      this.OLMap.on('moveend', () => {
        this.mapIsBeingMoved = false;

        Globals.webgl && this.webglLayer?.setOpacity(1);

        // Aktualisiere Flugzeuge auf der Karte
        this.updatePlanesFromServer(
          this.selectedFeederUpdate,
          this.showOpenskyPlanes,
          this.showIss
        );

        if (this.showAirportsUpdate) {
          // Aktualisiere Flughäfen auf der Karte
          this.updateAirportsFromServer();
        }
      });
    }
  }

  myExtent(extent): any {
    let bottomLeft = olProj.toLonLat([extent[0], extent[1]]);
    let topRight = olProj.toLonLat([extent[2], extent[3]]);

    return {
      extent: extent,
      minLon: bottomLeft[0],
      maxLon: topRight[0],
      minLat: bottomLeft[1],
      maxLat: topRight[1],
    };
  }

  getRenderExtent(extra): any {
    extra || (extra = 0);
    let renderBuffer = 60;
    const mapSize = this.OLMap.getSize();
    const over = renderBuffer + extra;
    const size = [mapSize[0] + over, mapSize[1] + over];
    return this.myExtent(this.OLMap.getView().calculateExtent(size));
  }

  calcCurrentMapExtent(): any {
    const size = this.OLMap.getSize();
    let extent = this.getRenderExtent(80);

    let minLon = extent.minLon.toFixed(6);
    let maxLon = extent.maxLon.toFixed(6);
    const minLat = extent.minLat.toFixed(6);
    const maxLat = extent.maxLat.toFixed(6);

    if (Math.abs(extent.extent[2] - extent.extent[0]) > 40075016) {
      // Alle Longitudes im View
      minLon = -180;
      maxLon = 180;
      return [minLon, minLat, maxLon, maxLat];
    }

    // Checke 180 Longitude Übergang und wähle größeren Bereich bis +-180
    if (+minLon > +maxLon) {
      let d1 = 180 - +minLon;
      let d2 = +maxLon + 180;

      if (d1 > d2) {
        maxLon = 180;
      } else {
        minLon = -180;
      }
    }

    return [minLon, minLat, maxLon, maxLat];
  }

  /**
   * Aktualisiert die Flughäfen vom Server
   */
  updateAirportsFromServer() {
    // Wenn noch auf Fetches gewartet wird, breche ab
    if (this.pendingFetchesAirports > 0 || this.mapIsBeingMoved) return;

    // Berechne extent und zoomLevel
    let extent = this.calcCurrentMapExtent();
    let zoomLevel = this.OLMap.getView().getZoom();

    // Wenn keine OLMap oder kein Extent vorhanden ist, breche ab
    if (!this.OLMap && !extent) return;

    // Starte Fetch
    this.pendingFetchesAirports += 1;

    // Server-Aufruf
    this.serverService
      .getAirportsInExtent(
        extent[0],
        extent[1],
        extent[2],
        extent[3],
        zoomLevel
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (airportsJSONArray) => {
          if (this.showAirportsUpdate) {
            // Leere Airports vor jeder Iteration
            this.AirportFeatures.clear();

            if (airportsJSONArray != null) {
              for (let i = 0; i < airportsJSONArray.length; i++) {
                let airport = airportsJSONArray[i];

                // Erstelle einen Point
                let airportPoint = new Point(
                  olProj.fromLonLat([
                    airport.longitude_deg,
                    airport.latitude_deg,
                  ])
                );

                // Erstelle Feature
                let airportFeature: any = new Feature(airportPoint);
                airportFeature.longitude = airport.longitude_deg;
                airportFeature.latitude = airport.latitude_deg;
                airportFeature.elevation_ft = airport.elevation_ft;
                airportFeature.icao = airport.ident;
                airportFeature.iata = airport.iata_code;
                airportFeature.name = airport.name;
                airportFeature.city = airport.municipality;
                airportFeature.type = airport.type;
                airportFeature.featureName = 'AirportDataPoint';

                // Setze Style des Features
                if (airport.type) {
                  let style = this.getStyleOfAirportFeature(airport.type);
                  airportFeature.setStyle(style);
                }

                // Füge Feature zu AirportFeatures hinzu
                this.AirportFeatures.addFeature(airportFeature);
              }
            }
          }
          // Fetch wurde erfolgreich durchgeführt und ist nicht mehr 'pending'
          this.pendingFetchesAirports--;
        },
        (error) => {
          console.log(
            'Error updating the airports from the server. Is the server running?'
          );
          this.openSnackbar(
            'Error updating the airports from the server. Is the server running?',
            2000
          );

          // Fetch wurde erfolgreich durchgeführt und ist nicht mehr 'pending'
          this.pendingFetchesAirports--;
        }
      );
  }

  /**
   * Öffnet eine Snackbar mit einem Text
   * @param message Text, der als Titel angezeigt werden soll
   */
  openSnackbar(message: string, duration: number) {
    this.snackBar.open(message, 'OK', {
      duration: duration,
    });
  }

  /**
   *  Setze Style des Features entsprechend des Typs des Flughafens
   */
  getStyleOfAirportFeature(type: any): any {
    switch (type) {
      case 'large_airport': {
        return Styles.LargeAirportStyle;
      }
      case 'medium_airport': {
        return Styles.MediumAirportStyle;
      }
      case 'small_airport': {
        return Styles.SmallAirportStyle;
      }
      case 'heliport': {
        return Styles.HeliportStyle;
      }
      case 'seaplane_base': {
        return Styles.SeaplaneBaseStyle;
      }
      case 'closed': {
        return Styles.ClosedAirportStyle;
      }
      default: {
        return Styles.DefaultPointStyle;
      }
    }
  }

  /**
   * Entfernt alle nicht geupdateten Flugzeuge aus
   * verschiedenen Listen und Datenstrukturen
   */
  removeNotUpdatedPlanes(that: any) {
    if (this.mapIsBeingMoved) return;

    let timeNow = new Date().getTime();
    let aircraft: Aircraft | undefined;
    let length = Globals.PlanesOrdered.length;

    for (let i = 0; i < length; i++) {
      aircraft = Globals.PlanesOrdered.shift();
      if (aircraft == null || aircraft == undefined) continue;

      // Wenn mehr als 20 Sekunden kein Update mehr kam,
      // wird das Flugzeug entfernt (Angabe in Millisekunden)
      if (!aircraft.isMarked && timeNow - aircraft.lastUpdate > 20000) {
        // Entferne Flugzeug
        that.removeAircraft(aircraft);
      } else {
        // Behalte Flugzeug und pushe es zurück in die Liste
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  /**
   * Aktualisiere die Flugzeuge, indem eine Anfrage
   * an den Server gestellt wird
   */
  updatePlanesFromServer(
    selectedFeeder: any,
    fetchFromOpensky: boolean,
    showIss: boolean
  ) {
    // Wenn noch auf Fetches gewartet wird, breche ab
    if (this.pendingFetchesPlanes > 0 || this.mapIsBeingMoved) return;

    // Berechne extent
    let extent = this.calcCurrentMapExtent();

    // Wenn keine OLMap oder kein Extent vorhanden ist, breche ab
    if (!this.OLMap && !extent) return;

    // Starte Fetch
    this.pendingFetchesPlanes += 1;

    // Mache Server-Aufruf und subscribe (0: lomin, 1: lamin, 2: lomax, 3: lamax)
    this.serverService
      .getPlanesUpdate(
        extent[0],
        extent[1],
        extent[2],
        extent[3],
        selectedFeeder,
        fetchFromOpensky,
        showIss,
        this.aircraft ? this.aircraft.hex : null // hex des markierten Flugzeugs
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (planesJSONArray) => {
          if (planesJSONArray == null) {
            this.pendingFetchesPlanes--;
            this.updatePlanesCounter(0);
            return;
          }

          // Wenn eine Route angezeigt wird, aktualisiere nur das ausgewählte Flugzeug
          if (this.showRoute) {
            planesJSONArray = planesJSONArray.filter(
              (a) => a.hex === this.aircraft?.hex
            );
            if (planesJSONArray == undefined) {
              this.pendingFetchesPlanes--;
              this.updatePlanesCounter(0);
              return;
            }
          }

          // Mache Update der angezeigten Flugzeuge
          this.processPlanesUpdate(planesJSONArray);

          // Entferne alle nicht ausgewählten Flugzeuge, wenn eine Route angezeigt wird
          if (this.showRoute) {
            this.removeAllNotSelectedPlanes();
          } else {
            this.removePlanesNotInCurrentExtent(extent);
          }

          // Aktualisiere Flugzeug-Tabelle mit der globalen Flugzeug-Liste
          if (Globals.aircraftTableIsVisible)
            this.aircraftTableService.updateAircraftList(Globals.PlanesOrdered);

          // Aktualisiere angezeigte Flugzeug-Zähler
          this.updatePlanesCounter(Globals.PlanesOrdered.length);

          // Fetch wurde erfolgreich durchgeführt und ist nicht mehr 'pending'
          this.pendingFetchesPlanes--;
        },
        (error) => {
          console.log(
            'Error updating the planes from the server. Is the server running?'
          );
          this.openSnackbar(
            'Error updating the planes from the server. Is the server running?',
            2000
          );

          // Aktualisiere angezeigte Flugzeug-Zähler
          this.updatePlanesCounter(0);

          // Fetch hat nicht funktioniert und ist nicht mehr 'pending'
          this.pendingFetchesPlanes--;
        }
      );
  }

  /**
   * Aktualisiert den Flugzeug-Zähler oben im Tab mit der
   * Anzahl der gefetchten Flugzeuge
   * @param amountFetchedPlanes number
   */
  updatePlanesCounter(amountFetchedPlanes: number) {
    // Zähler der momentan angezeigten Flugzeuge auf der Karte
    Globals.amountDisplayedAircraft = amountFetchedPlanes;

    // Zeige die Anzahl der getrackten Flugzeuge im Fenster-Titel an
    this.titleService.setTitle(
      'Beluga Project  - ' + Globals.amountDisplayedAircraft
    );

    // Aktualisiere Flugzeug-Zähler
    this.toolbarService.updateAircraftCounter(Globals.amountDisplayedAircraft);
  }

  /**
   * Triggert das erstellen oder aktualisieren aller
   * Flugzeuge in dem JSON Array an Flugzeugen
   * @param planesJSONArray Aircraft[]
   */
  processPlanesUpdate(planesJSONArray: Aircraft[]) {
    for (let i = 0; i < planesJSONArray.length; i++) {
      this.processAircraft(planesJSONArray[i]);
    }
  }

  /**
   * Erstellt oder aktualisiert ein Flugzeug aus JSON-Daten
   * @param planesJSONArray Aircraft
   */
  processAircraft(aircraftJSON: Aircraft) {
    // Boolean, ob Flugzeug bereits existiert hat
    let bNewAircraft: boolean = false;

    // Extrahiere hex aus JSON
    let hex = aircraftJSON.hex;
    if (!hex) return;

    let aircraft: Aircraft = this.Planes[hex];

    // Erstelle neues Flugzeug
    if (!aircraft) {
      aircraft = Aircraft.createNewAircraft(aircraftJSON);

      // Fuege Flugzeug zu "Liste" an Objekten hinzu
      this.Planes[hex] = aircraft;
      Globals.PlanesOrdered.push(aircraft);

      // Flugzeug ist neu, setze boolean
      bNewAircraft = true;
    } else {
      // Aktualisiere Daten des Flugzeugs
      aircraft.updateData(aircraftJSON);
    }

    // Erstelle oder aktualisiere bestehenden Marker
    if (bNewAircraft) {
      aircraft.updateMarker(false);
    } else {
      aircraft.updateMarker(true);
    }

    // Wenn Flugzeug das aktuell ausgewählte/markierte Flugzeug ist
    if (this.aircraft && aircraft.hex == this.aircraft.hex) {
      // Aktualisiere Trail mit momentaner Position, nur wenn alle Feeder
      // ausgewählt sind und bereits Trails vom Server bezogen wurden
      this.aircraft.updateTrail(this.selectedFeederUpdate);

      // Update Route, da sich Flugzeug bewegt hat
      this.updateShowRoute();

      // Update Daten des Altitude Charts mit aktueller Altitude
      this.updateAltitudeChart();

      // Kontaktiere Cesium für Update der Camera, wenn nötig
      this.updateCameraInCesium();
    }

    // Wenn Flugzeug das ist, worüber die Mouse hovert
    if (
      this.hoveredAircraftObject &&
      aircraft.hex == this.hoveredAircraftObject.hex
    ) {
      this.createHoveredAircraft(aircraft);
    }
  }

  /**
   * Holt alle Daten über ein Flugzeug vom Server
   * @param aircraft Flugzeug
   */
  getAllAircraftData(aircraft: Aircraft) {
    if (aircraft) {
      this.serverService
        .getAllAircraftData(
          aircraft.hex,
          aircraft.registration,
          aircraft.isFromOpensky
        )
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          (aircraftDataJSONObject) => {
            // Weise neue Werte zu
            let allAircraftData = aircraftDataJSONObject;

            if (
              allAircraftData &&
              this.aircraft &&
              this.aircraft.hex == aircraft.hex
            ) {
              // Schreibe alle Informationen an markiertes Flugzeug
              if (allAircraftData[0]) {
                this.aircraft.updateData(allAircraftData[0]);
              }

              // Filtere Information über Herkunfts-Ort und Ziel-Ort heraus
              let originJSONInfo;
              let destinationJSONInfo;

              if (allAircraftData[1]) {
                originJSONInfo = allAircraftData[1];
              }

              if (allAircraftData[2]) {
                destinationJSONInfo = allAircraftData[2];
              }

              // Setze Information über Herkunfts-Ort
              if (originJSONInfo) {
                if (originJSONInfo.municipality) {
                  // Wenn Stadt ein '/' enthält, setze nur den erste Teil als Stadt
                  this.aircraft.originFullTown =
                    originJSONInfo.municipality.split(' /')[0];
                }

                if (originJSONInfo.iata_code) {
                  this.aircraft.originIataCode = originJSONInfo.iata_code;
                }

                // Setze Information über Position des Herkunfts-Flughafen
                if (
                  originJSONInfo.latitude_deg &&
                  originJSONInfo.longitude_deg
                ) {
                  this.aircraft.positionOrg = [
                    originJSONInfo.longitude_deg,
                    originJSONInfo.latitude_deg,
                  ];
                }
              }

              // Setze Information über Ziel-Ort
              if (destinationJSONInfo) {
                if (destinationJSONInfo.municipality) {
                  // Wenn Stadt ein '/' enthält, setze nur den erste Teil als Stadt
                  this.aircraft.destinationFullTown =
                    destinationJSONInfo.municipality.split(' /')[0];
                }

                if (destinationJSONInfo.iata_code) {
                  this.aircraft.destinationIataCode =
                    destinationJSONInfo.iata_code;
                }

                // Setze Information über Position des Herkunfts-Flughafen
                if (
                  destinationJSONInfo.latitude_deg &&
                  destinationJSONInfo.longitude_deg
                ) {
                  this.aircraft.positionDest = [
                    destinationJSONInfo.longitude_deg,
                    destinationJSONInfo.latitude_deg,
                  ];
                }
              }

              // Setze Information über gesamte Länge der Strecke
              this.aircraft.calcFlightPathLength();
            }
          },
          (error) => {
            console.log(
              'Error fetching further aircraft information from the server. Is the server running?'
            );
            this.openSnackbar(
              'Error fetching further aircraft information from the server. Is the server running?',
              2000
            );
          }
        );
    }
  }

  /**
   * Holt den Trail zu einem Flugzeug vom Server,
   * wenn es kein Flugzeug von Opensky ist
   * @param aircraft Aircraft
   * @param selectedFeeder Ausgewählter Feeder
   */
  getTrailToAircraft(aircraft: Aircraft, selectedFeeder: any) {
    if (aircraft) {
      this.serverService
        .getTrail(aircraft.hex, selectedFeeder, aircraft.isFromOpensky)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          (trailDataJSONObject) => {
            // Weise neue Werte zu (aircraftDataJSONObject[0] = trail data)
            let trailData = trailDataJSONObject;

            if (
              trailData &&
              this.aircraft &&
              this.aircraft.hex == aircraft.hex
            ) {
              // Weise Trail-Liste zu, erstelle Trails und mache diese sichtbar
              if (trailData[0]) {
                this.aircraft.aircraftTrailList = trailData[0];
                this.aircraft.makeTrail();
                this.aircraft.setTrailVisibility2d(true);
                this.updateAltitudeChart();
                this.updateCesiumComponentWithAircraft();
              }
            }
          },
          (error) => {
            console.log(
              'Error fetching trail of aircraft from the server. Is the server running?'
            );

            this.openSnackbar(
              'Error fetching trail of aircraft from the server. Is the server running?',
              2000
            );
          }
        );
    }
  }

  /**
   * Update Daten des Altitude Charts mit Daten des aktuell markierten Flugzeugs
   */
  updateAltitudeChart() {
    if (this.aircraft) {
      this.settingsService.sendAircraftAltitudeData(
        this.aircraft.aircraftTrailAltitudes
      );
    }
  }

  /**
   * Setzt alle Trails auf unsichtbar
   */
  resetAllTrails() {
    Globals.trailGroup.forEach((f) => {
      f.set('visible', false);
    });
  }

  /**
   * Initialisiert die Klicks auf die Karte, bspw. wenn
   * auf ein Flugzeug oder einen RangePoint geklickt wird
   */
  initClickOnMap(): void {
    // Markiere Flugzeug bei Single-Click
    this.OLMap.on('click', (evt: any) => {
      // Hole hex von Feature (bei Flugzeugen)
      // Suche nur in planesLayer oder webglLayer
      const hex = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        (feature) => {
          return feature.hex;
        },
        {
          layerFilter: (layer) =>
            layer == this.planesLayer || layer == this.webglLayer,
          hitTolerance: 5,
        }
      );

      // Hole Feature zur Bestimmung eines RangePoints
      let rangePoint;
      if (this.rangeDataIsVisible) {
        rangePoint = evt.map.forEachFeatureAtPixel(
          evt.pixel,
          function (feature: any) {
            return feature;
          },
          {
            layerFilter: (layer) => layer == this.rangeDataLayer,
            hitTolerance: 5,
          }
        );
      }

      // Hole Feature zur Bestimmung eines AirportPoints
      let airportPoint;
      airportPoint = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        function (feature: any) {
          return feature;
        },
        {
          layerFilter: (layer) => layer == this.airportLayer,
          hitTolerance: 5,
        }
      );

      // Setze Boolean 'showRoute' auf false zurück
      this.showRoute = false;

      if (hex) {
        this.markOrUnmarkAircraft(hex, false);
      } else if (rangePoint && rangePoint.name == 'RangeDataPoint') {
        this.createAndShowRangeDataPopup(rangePoint, evt);
      } else if (
        airportPoint &&
        airportPoint.featureName == 'AirportDataPoint'
      ) {
        this.createAndShowAirportDataPopup(airportPoint, evt);
      } else {
        this.resetAllMarkedPlanes();
        this.resetAllTrails();
        this.resetAllDrawnCircles();
        this.hideLargeAircraftInfoComponent();
        this.resetRangeDataPopup();
        this.unselectAllPlanesInTable();
        this.resetAllDrawnPOMDPoints();
        this.resetAirportDataPopup();
        this.show3dMap(false);
      }
    });
  }

  /**
   * Entferne Markierung bei allen selektierten Flugzeugen in der Tabelle
   */
  unselectAllPlanesInTable() {
    this.aircraftTableService.unselectAllPlanesInTable();
  }

  /**
   * Markiert ein Flugzeug, zeigt dessen Trail und zeigt
   * Info-Fenster an. Wenn Flugzeug bereits ausgewählt
   * ist, wird das Flugzeug nicht mehr als ausgewählt
   * dargestellt und die Info-Komponente und der Trail
   * verschwinden. Wenn die Anfrage nicht von der Tabelle
   * kommt, muss das Tabellen-Zeile noch markiert/entmarkiert werden
   * @param hex String
   * @param isRequestFromTable: boolean
   */
  markOrUnmarkAircraft(hex: string, isRequestFromTable: boolean) {
    let aircraft: Aircraft = this.Planes[hex];

    if (aircraft) {
      if (aircraft.isMarked) {
        // Setze Anzeige der Route zurück
        this.showRoute = false;

        // Setze Zustand auf 'unmarkiert'
        this.resetAllMarkedPlanes();
        this.resetAllTrails();
        this.resetAllDrawnCircles();
        this.resetAllDrawnPOMDPoints();

        // Verstecke große Info-Component
        this.hideLargeAircraftInfoComponent();
      } else {
        // Setze Zustand auf 'unmarkiert'
        this.resetAllMarkedPlanes();
        this.resetAllTrails();
        this.resetAllDrawnCircles();
        this.resetAllDrawnPOMDPoints();

        // Toggle markiere Flugzeug
        aircraft.toggleMarkPlane();

        // Setze aktuelles Flugzeug als markiertes Flugzeug
        this.aircraft = aircraft;

        // Prüfe, ob Photo-Url bereits vorhanden ist,
        // wenn nicht starte Anfrage an Server
        if (!this.aircraft.allDataWasRequested && this.aircraft.hex != 'ISS') {
          // Setze intiales Flugzeug-Photo
          this.aircraft.urlPhotoDirect =
            '../../../assets/placeholder_loading_aircraft_photo.jpg';

          // Mache Server-Aufruf um alle Flugzeug-Informationen zu erhalten
          this.getAllAircraftData(aircraft);

          // Hole Trail und update 3d-Komponente
          this.getTrailToAircraft(aircraft, this.selectedFeederUpdate);

          // Merke am Flugzeug, dass Aufruf bereits getätigt wurde
          this.aircraft.allDataWasRequested = true;
        } else {
          // Hole nur Trail und update 3d-Komponente
          this.getTrailToAircraft(aircraft, this.selectedFeederUpdate);
        }

        // Mache großes Info-Fenster sichtbar
        this.showLargeAircraftInfoComponent();
      }

      // Wenn Anfrage zum Markieren des Flugzeugs nicht
      // von der Tabelle kam, markiere Flugzeug in Tabelle
      if (!isRequestFromTable) {
        this.aircraftTableService.selectOrUnselectAircraftInTable(aircraft);
      } else {
        // Zentriere Map-Ansicht auf das ausgewählte Flugzeug,
        // wenn Flugzeug durch die Tabelle markiert wurde
        if (aircraft.isMarked) {
          this.centerMap(
            aircraft.longitude,
            aircraft.latitude,
            Globals.zoomLevel
          );
        }
      }
    }
  }

  /**
   * Erstellt zu einem rangePoint ein Popup-Fenster mit
   * Informationen über diesen RangePoint
   */
  createAndShowRangeDataPopup(rangePoint: any, evt: any) {
    // Formatiere Timestamp in deutschen LocaleString
    let dateFromTimestamp = new Date(rangePoint.timestamp);
    let dateToShow = dateFromTimestamp.toLocaleString('de-DE', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Erstelle aktuell angeklicktes RangeDataPoint aus Feature
    this.rangeDataPoint = {
      flightId:
        typeof rangePoint.flightId !== 'undefined'
          ? rangePoint.flightId
          : 'N/A',
      hex:
        typeof rangePoint.hexAircraft !== 'undefined'
          ? rangePoint.hexAircraft
          : 'N/A',
      attributes: [
        {
          key: 'Latitude',
          value:
            typeof rangePoint.x !== 'undefined' ? rangePoint.x + '°' : 'N/A',
        },
        {
          key: 'Longitude',
          value:
            typeof rangePoint.y !== 'undefined' ? rangePoint.y + '°' : 'N/A',
        },
        {
          key: 'Type',
          value:
            typeof rangePoint.type !== 'undefined' ? rangePoint.type : 'N/A',
        },
        {
          key: 'Category',
          value:
            typeof rangePoint.category !== 'undefined'
              ? rangePoint.category
              : 'N/A',
        },
        {
          key: 'Registration',
          value:
            typeof rangePoint.xregistration !== 'undefined'
              ? rangePoint.registration
              : 'N/A',
        },
        {
          key: 'Altitude',
          value:
            typeof rangePoint.altitude !== 'undefined'
              ? rangePoint.altitude + ' ft'
              : 'N/A',
        },
        {
          key: 'Distance',
          value:
            typeof rangePoint.distance !== 'undefined'
              ? rangePoint.distance + ' km'
              : 'N/A',
        },
        {
          key: 'Feeder',
          value:
            typeof rangePoint.feederList !== 'undefined'
              ? rangePoint.feederList
              : 'N/A',
        },
        {
          key: 'Source',
          value:
            typeof rangePoint.sourceList !== 'undefined'
              ? rangePoint.sourceList
              : 'N/A',
        },
        {
          key: 'Timestamp',
          value:
            typeof rangePoint.timestamp !== 'undefined' ? dateToShow : 'N/A',
        },
      ],
    };

    // Weise popup als overlay zu (Hinweis: Hier ist 'document.getElementById'
    // nötig, da mit OpenLayers Overlays gearbeitet werden muss, damit Popup
    // an einer Koordinaten-Position bleibt)
    this.rangeDataPopup = new Overlay({
      element: document.getElementById('rangeDataPopup')!,
    });

    // Setze Position des Popups und füge Overlay zur Karte hinzu
    const coordinate = rangePoint.getGeometry().getCoordinates();
    this.rangeDataPopup.setPosition([
      coordinate[0] + Math.round(evt.coordinate[0] / 40075016) * 40075016,
      coordinate[1],
    ]);
    this.OLMap.addOverlay(this.rangeDataPopup);

    // Verändere Bottom-Wert für Popup,
    // damit dieser richtig angezeigt wird
    this.rangeDataPopupBottomValue = '10px';

    // Zeige RangeData-Popup an
    this.showPopupRangeDataPoint = true;
  }

  createAndShowAirportDataPopup(airportPoint: any, evt: any) {
    if (airportPoint == undefined) return;

    // Erstelle aktuell angeklicktes AirportDataPoint aus Feature
    let elevation;

    if (typeof airportPoint.elevation_ft !== 'undefined') {
      elevation =
        airportPoint.elevation_ft +
        ' ft / ' +
        (airportPoint.elevation_ft * 0.328084).toFixed(0) +
        ' m';
    }

    this.airportDataPoint = {
      icao:
        typeof airportPoint.icao !== 'undefined' ? airportPoint.icao : 'N/A',
      featureName: airportPoint.featureName,
      attributes: [
        {
          key: 'Elevation',
          value: typeof elevation !== 'undefined' ? elevation : 'N/A',
        },
        {
          key: 'IATA',
          value:
            typeof airportPoint.iata !== 'undefined'
              ? airportPoint.iata
              : 'N/A',
        },
        {
          key: 'City',
          value:
            typeof airportPoint.city !== 'undefined'
              ? airportPoint.city
              : 'N/A',
        },
        {
          key: 'Type',
          value:
            typeof airportPoint.type !== 'undefined'
              ? airportPoint.type
              : 'N/A',
        },
        {
          key: 'Name',
          value:
            typeof airportPoint.name !== 'undefined'
              ? airportPoint.name
              : 'N/A',
        },
      ],
    };

    // Weise popup als overlay zu (Hinweis: Hier ist 'document.getElementById'
    // nötig, da mit OpenLayers Overlays gearbeitet werden muss, damit Popup
    // an einer Koordinaten-Position bleibt)
    this.airportDataPopup = new Overlay({
      element: document.getElementById('airportDataPopup')!,
    });

    const coordinate = airportPoint.getGeometry().getCoordinates();
    this.airportDataPopup.setPosition([
      coordinate[0] + Math.round(evt.coordinate[0] / 40075016) * 40075016,
      coordinate[1],
    ]);
    this.OLMap.addOverlay(this.airportDataPopup);

    // Verändere Bottom-Wert für Popup,
    // damit dieser richtig angezeigt wird
    this.airportDataPopupBottomValue = '10px';
  }

  resetAirportDataPopup() {
    if (this.airportDataPopup) {
      this.airportDataPopup.setPosition(undefined);
      this.airportDataPopup.dispose();
      this.airportDataPoint = undefined;
    }

    // Verändere Bottom-Wert für Popup,
    // damit dieser wieder ausgeblendet wird
    this.airportDataPopupBottomValue = '0px';
  }

  /**
   * Setzt RangeData-Popups zurück und versteckt diese
   */
  resetRangeDataPopup() {
    if (this.rangeDataPopup) {
      this.rangeDataPopup.setPosition(undefined);
      this.rangeDataPopup.dispose();
      this.rangeDataPopup = undefined;
    }

    // Verändere Bottom-Wert für Popup,
    // damit dieser wieder ausgeblendet wird
    this.rangeDataPopupBottomValue = '0px';

    this.showPopupRangeDataPoint = false;
  }

  /**
   * Macht das große Info-Fenster mit Flugzeugdaten sichtbar
   */
  showLargeAircraftInfoComponent() {
    Globals.displayAircraftInfoLarge = true;
  }

  /**
   * Macht das große Info-Fenster mit Flugzeugdaten unsichtbar
   */
  hideLargeAircraftInfoComponent() {
    Globals.displayAircraftInfoLarge = false;
  }

  /**
   * Setzt alle markierten Flugzeuge auf 'unmarkiert' zurueck
   */
  resetAllMarkedPlanes() {
    for (var hex of Object.keys(this.Planes)) {
      if (this.Planes[hex].isMarked) {
        this.Planes[hex].toggleMarkPlane();
      }
    }
    this.aircraft = null;
  }

  /**
   * Veraendere Maus-Cursor, wenn sich dieser ueber einem Flugzeug befindet
   */
  initHoverOverAircraftIcon() {
    this.OLMap.on('pointermove', (evt: any) => {
      // Verhindere Hovering, wenn Anwendung mobil genutzt wird
      if (evt.dragging || !this.isDesktop) {
        return;
      }

      // Hole hex von Feature (bei Flugzeugen)
      // Suche nur in planesLayer oder webglLayer
      const feature = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        (feature) => {
          return feature;
        },
        {
          layerFilter: (layer) =>
            layer == this.planesLayer || layer == this.webglLayer,
          hitTolerance: 5,
        }
      );

      if (feature && feature.hex) {
        const hex = feature.hex;

        this.OLMap.getTargetElement().style.cursor = hex ? 'pointer' : '';

        // Finde gehovertes Flugzeug aus Liste mit Hex
        let aircraft: Aircraft = this.Planes[hex];

        // Zeige Daten des aktuellen Flugzeugs in Small Info-Box
        if (aircraft) {
          // Setze Flugzeug als das aktuell gehoverte
          this.createHoveredAircraft(aircraft);

          // Berechne richtige Position, wenn andere Welt gehovert wird
          const featureCoordinates = feature.getGeometry().getCoordinates();
          const coordinatesNormalized = [
            featureCoordinates[0] +
              Math.round(evt.coordinate[0] / 40075016) * 40075016,
            featureCoordinates[1],
          ];

          const markerPosition = this.OLMap.getPixelFromCoordinate(
            coordinatesNormalized
          );
          if (!markerPosition) return;

          // Setze richtige Position
          let mapSize = this.OLMap.getSize();
          if (markerPosition[0] + 200 < mapSize[0])
            this.leftValue = markerPosition[0] + 20;
          else this.leftValue = markerPosition[0] - 200;
          if (markerPosition[1] + 250 < mapSize[1])
            this.topValue = markerPosition[1] + 50;
          else this.topValue = markerPosition[1] - 250;

          // Zeige kleine Info-Box
          this.showSmallInfo = true;
        }
      } else {
        // Setze Cursor auf 'normal' zurück
        this.OLMap.getTargetElement().style.cursor = '';

        this.hoveredAircraftObject = undefined;

        // Verstecke kleine Info-Box
        this.showSmallInfo = false;
      }
    });
  }

  createHoveredAircraft(aircraft: Aircraft) {
    this.hoveredAircraftObject = {
      flightId:
        typeof aircraft.flightId !== 'undefined' ? aircraft.flightId : 'N/A',
      hex: typeof aircraft.hex !== 'undefined' ? aircraft.hex : 'N/A',
      attributes: [
        {
          key: 'Altitude',
          value:
            typeof aircraft.altitude !== 'undefined'
              ? aircraft.altitude + ' ft'
              : 'N/A',
        },
        {
          key: 'Speed',
          value:
            typeof aircraft.speed !== 'undefined'
              ? aircraft.speed + ' kn'
              : 'N/A',
        },
        { key: 'Type', value: aircraft.type ? aircraft.type : 'N/A' },
        {
          key: 'Registration',
          value: aircraft.registration ? aircraft.registration : 'N/A',
        },
        {
          key: 'Track',
          value:
            typeof aircraft.track !== 'undefined'
              ? aircraft.track + '°'
              : 'N/A',
        },
        {
          key: 'Last Seen',
          value:
            typeof aircraft.lastSeen !== 'undefined'
              ? aircraft.lastSeen + ' s'
              : 'N/A',
        },
        {
          key: 'Feeder',
          value: aircraft.feederList ? aircraft.feederList : 'N/A',
        },
      ],
    };

    if (Globals.useDevicePositionForDistance && Globals.DevicePosition) {
      this.hoveredAircraftObject.attributes.push({
        key: 'Dist. (Dev)',
        value: aircraft.distanceDevicePos
          ? aircraft.distanceDevicePos + ' km'
          : 'N/A',
      });
    } else {
      this.hoveredAircraftObject.attributes.push({
        key: 'Dist. (Ant)',
        value:
          typeof aircraft.distance !== 'undefined'
            ? aircraft.distance + ' km'
            : 'N/A',
      });
    }
  }

  /**
   * Erstellt oder löscht eine Route vom Startort
   * zum Flugzeug und vom Flugzeug zum Zielort.
   * Auslöser zum Aufruf dieser Methode ist der
   * Button "Route" der Info-Komponente
   * @param $event Boolean, ob Route gezeigt
   *               werden soll oder nicht
   */
  receiveToggleShowAircraftRoute($event) {
    this.showRoute = $event;

    if (this.showRoute) {
      // Erstelle Route
      this.createAndShowRoute();
    } else {
      // Lösche alle gesetzten Circles
      this.resetAllDrawnCircles();

      // Setze Center der Map auf die gespeicherte
      // Position zurueck
      if (!this.oldCenterPosition || !this.oldCenterZoomLevel) return;
      this.centerMap(
        this.oldCenterPosition[0],
        this.oldCenterPosition[1],
        this.oldCenterZoomLevel
      );
    }
  }

  /**
   * Zeigt eine Route vom Startort zum Flugzeug
   * und vom Flugzeug zum Zielort. Indem der
   * Viewport der Karte veraendert wird, kann
   * die komplette Route angesehen werden
   */
  createAndShowRoute() {
    // Prüfe, ob Positionen des Herkunfts- und
    // Zielorts bekannt sind
    if (
      this.aircraft &&
      this.aircraft.positionOrg &&
      this.aircraft.positionDest
    ) {
      // Speichere alte View-Position und ZoomLevel der Karte ab
      this.oldCenterPosition = olProj.transform(
        this.OLMap.getView().getCenter(),
        'EPSG:3857',
        'EPSG:4326'
      );

      this.oldCenterZoomLevel = this.OLMap.getView().getZoom();

      // Lösche alle gesetzten Circles
      this.resetAllDrawnCircles();

      // Zeichne Route von Herkunftsort zu Flugzeug
      // und vom Flugzeug zum Zielort
      this.drawGreatDistanceCirclesThroughAircraft();

      // Erweitere Karte, damit beide Koordinaten
      // (Herkunfts- und Zielort) angezeigt werden können
      this.extentMapViewToFitCoordiates(
        this.aircraft.positionOrg,
        this.aircraft.positionDest
      );
    }
  }

  /**
   * Erstelle gekruemmte Kurve zwischen Start- und Zielort durch Flugzeug
   * @param positionOrg
   * @param positionDest
   */
  drawGreatDistanceCirclesThroughAircraft() {
    if (
      this.aircraft &&
      this.aircraft.position &&
      this.aircraft.positionOrg &&
      this.aircraft.positionDest
    ) {
      // Linie von Herkunftsort -> Flugzeug
      this.createAndAddCircleToFeature(
        this.aircraft.positionOrg,
        this.aircraft.position
      );
      // Linie von Flugzeug -> Zielsort
      this.createAndAddCircleToFeature(
        this.aircraft.position,
        this.aircraft.positionDest
      );
    }
  }

  /**
   * Erstellt eine gekruemmte Linie zwischen
   * startPosition und endPosition
   * @param startPosition Array mit long, lat
   * @param endPosition Array mit long, lat
   */
  createAndAddCircleToFeature(startPosition: number[], endPosition: number[]) {
    // Erstelle GreatCircle-Linie
    let greatCircleLine = new LineString(
      olExtSphere.greatCircleTrack(startPosition, endPosition)
    );
    greatCircleLine.transform(
      'EPSG:4326',
      this.OLMap.getView().getProjection()
    );

    // Füge GreatCircle-Linie als neues Feature
    // zu DestCircleFeatures hinzu
    this.RouteFeatures.addFeature(new Feature(greatCircleLine));
  }

  /**
   * Setze neuen Center-Punkt der Karte. Veraendere Sichtbereich,
   * damit Start- und Ziel gut zu erkennen sind. Nach Sichtbereichs-
   * veraenderung wird Zoom-Level noch verringert, damit Punkte gut
   * zu sehen sind
   * @param   positionOrg Array mit Koordinaten
   *          lon, lat der Herkunft des Flugzeugs
   * @param   positionDest Array mit Koordinaten
   *          lon, lat des Ziels des Flugzeugs
   */
  extentMapViewToFitCoordiates(positionOrg: [], positionDest: []) {
    // Setze neuen Center der Karte
    let boundingExtent = olExtent.boundingExtent([positionOrg, positionDest]);
    let source: any = olProj.get('EPSG:4326');
    let destination: any = olProj.get('EPSG:3857');

    boundingExtent = olProj.transformExtent(
      boundingExtent,
      source,
      destination
    );
    this.OLMap.getView().fit(boundingExtent, this.OLMap.getSize());

    // Beziehe aktuelles Zoom-Level nach View-Ausdehnung
    // zum boundingExtent
    let currentZoomLevel = this.OLMap.getView().getZoom();

    // Verringere dieses Zoom-Level, damit genug Platz
    // zwischen Kartenrand und boundingExtent-Raendern ist
    this.OLMap.getView().setZoom(currentZoomLevel - 1);
  }

  /**
   * Setzt den Mittelpunkt der Karte auf die
   * Werte long, lat
   * @param long number
   * @param lat number
   * @param zoomLevel number
   */
  centerMap(long: number, lat: number, zoomLevel: number) {
    this.OLMap.getView().setCenter(
      olProj.transform([long, lat], 'EPSG:4326', 'EPSG:3857')
    );
    this.OLMap.getView().setZoom(zoomLevel);
  }

  /**
   * Loescht alle Linien zwischen
   * Start-Flugzeug-Ziel
   */
  resetAllDrawnCircles() {
    this.RouteFeatures.clear();
  }

  /**
   * Löscht alle Features aus Globals.POMDFeatures und
   * entfernt bei jedem Flugzeug den POMD-Point
   */
  resetAllDrawnPOMDPoints() {
    for (var hex of Object.keys(this.Planes)) {
      let aircraft: Aircraft = this.Planes[hex];
      aircraft.clearPOMDPoint();
    }
    Globals.POMDFeatures.clear();
  }

  /**
   * Aktualisiere Route, wenn Flugzeug sich bewegt hat
   */
  updateShowRoute() {
    if (this.showRoute) {
      // Prüfe, ob Positionen des Herkunfts- und
      // Zielorts bekannt sind
      if (
        this.aircraft &&
        this.aircraft.positionOrg &&
        this.aircraft.positionDest
      ) {
        // Lösche alle gesetzten Circles
        this.resetAllDrawnCircles();

        // Zeichne Route von Herkunftsort zu Flugzeug
        // und vom Flugzeug zum Zielort
        this.drawGreatDistanceCirclesThroughAircraft();
      }
    }
  }

  /**
   * Sortiert und zeichnet alle Range-Data-Objekte in rangeDataJSON auf der
   * Karte als Polygon und als einzelne Punkte zum anklicken
   * @param rangeDataJSON rangeDataJSON
   */
  drawRangeDataJSONOnMap(rangeDataJSON: any) {
    // Array an Point-Objekten
    let points: any = [];

    // Selektiere Feeder, wenn selectedFeederRangeData gesetzt ist und
    // formatiere JSON-Data in arrayOfObjectPoints, damit Sortier-Algorithmus
    // von https://stackoverflow.com/a/54727356 genutzt werden kann
    if (
      this.selectedFeederRangeData == undefined ||
      this.selectedFeederRangeData.length == 0
    ) {
      // Zeige Range-Data aller Feeder an
      for (let i = 0; i < rangeDataJSON.length; i++) {
        points.push({
          x: rangeDataJSON[i].longitude,
          y: rangeDataJSON[i].latitude,
          timestamp: rangeDataJSON[i].timestamp,
          feederList: rangeDataJSON[i].feederList,
          sourceList: rangeDataJSON[i].sourceList,
          altitude: rangeDataJSON[i].altitude,
          hex: rangeDataJSON[i].hex,
          distance: rangeDataJSON[i].distance,
          flightId: rangeDataJSON[i].flightId,
          registration: rangeDataJSON[i].registration,
          type: rangeDataJSON[i].type,
          category: rangeDataJSON[i].category,
        });
      }
    } else {
      // Selektiere nach ausgewählten Feedern
      for (let feeder of this.selectedFeederRangeData) {
        for (let i = 0; i < rangeDataJSON.length; i++) {
          if (rangeDataJSON[i].feederList.includes(feeder)) {
            points.push({
              x: rangeDataJSON[i].longitude,
              y: rangeDataJSON[i].latitude,
              timestamp: rangeDataJSON[i].timestamp,
              feederList: rangeDataJSON[i].feederList,
              sourceList: rangeDataJSON[i].sourceList,
              altitude: rangeDataJSON[i].altitude,
              hex: rangeDataJSON[i].hex,
              distance: rangeDataJSON[i].distance,
              flightId: rangeDataJSON[i].flightId,
              registration: rangeDataJSON[i].registration,
              type: rangeDataJSON[i].type,
              category: rangeDataJSON[i].category,
            });
          }
        }
      }
    }

    // Berechne das Zentrum (mean value) mittels reduce
    const center = points.reduce(
      (acc, { x, y }) => {
        acc.x += x / points.length;
        acc.y += y / points.length;
        return acc;
      },
      { x: 0, y: 0 }
    );

    // Füge eine angle-Property zu jedem point hinzu,
    // indem tan(angle) = y/x genutzt wird
    const angles = points.map(
      ({
        x,
        y,
        timestamp,
        feederList,
        sourceList,
        altitude,
        hex,
        distance,
        flightId,
        registration,
        type,
        category,
      }) => {
        return {
          x,
          y,
          angle: (Math.atan2(y - center.y, x - center.x) * 180) / Math.PI,
          timestamp,
          feederList,
          sourceList,
          altitude,
          hex,
          distance,
          flightId,
          registration,
          type,
          category,
        };
      }
    );

    // Sortiere Punkte nach Grad (angle)
    const pointsSorted = angles.sort((a, b) => a.angle - b.angle);

    // Leere RangeDataFeatures
    this.resetAllDrawnRangeDataPoints();

    // Erzeuge reines number[][], damit Polygon aus sortierten
    // Objekten gebildet werden kann
    let pointsForPolygon: number[][] = [];
    for (let j = 0; j < pointsSorted.length; j++) {
      pointsForPolygon.push([pointsSorted[j].x, pointsSorted[j].y]);
    }

    // Erzeuge und transformiere Polygon mit [number[][]]
    let polygon = new Polygon([pointsForPolygon]);
    polygon.transform('EPSG:4326', 'EPSG:3857');

    // Erzeuge feature, damit Polygon den RangeDataFeatures
    // hinzugefügt werden kann
    let feature = new Feature(polygon);
    feature.set('name', 'RangeDataPolygon');
    feature.setStyle(
      this.darkStaticFeatures
        ? Styles.RangeDataPolygonStyle
        : Styles.RangeDataPolygonStyleWhite
    );
    this.RangeDataFeatures.addFeature(feature);

    // Zum kontrollieren des Polygons können mit folgendem Code
    // die abgespeicherten Punkte angezeigt werden
    for (let i = 0; i < pointsSorted.length; i++) {
      if (pointsSorted[i]) {
        let point = new Point(
          olProj.fromLonLat([pointsSorted[i].x, pointsSorted[i].y])
        );
        let feature: any = new Feature(point);
        feature.x = pointsSorted[i].x;
        feature.y = pointsSorted[i].y;
        feature.name = 'RangeDataPoint';
        feature.timestamp = pointsSorted[i].timestamp;
        feature.feederList = pointsSorted[i].feederList;
        feature.sourceList = pointsSorted[i].sourceList;
        feature.altitude = pointsSorted[i].altitude;
        feature.hexAircraft = pointsSorted[i].hex;
        feature.distance = pointsSorted[i].distance;
        feature.flightId = pointsSorted[i].flightId;
        feature.registration = pointsSorted[i].registration;
        feature.type = pointsSorted[i].type;
        feature.category = pointsSorted[i].category;

        // Setze Style RangeDataPointStyle
        feature.setStyle(
          this.darkStaticFeatures
            ? Styles.RangeDataPointStyle
            : Styles.RangeDataPointStyleWhite
        );

        // Füge Feature zu RangeDataFeatures hinzu
        this.RangeDataFeatures.addFeature(feature);
      }
    }

    // Ändere Styling der Points, je nach gesetzten Boolean für Feeder und Höhe
    if (this.bMarkRangeDataByFeeder) {
      this.markRangeDataByFeeder();
    }

    if (this.bMarkRangeDataByHeight) {
      this.markRangeDataByHeight();
    }
  }

  /**
   * Loescht alle Punkte des RangeData-Layers
   */
  resetAllDrawnRangeDataPoints() {
    this.RangeDataFeatures.clear();
  }

  /**
   * Fragt alle Range-Data-Datensätze innerhalb einer Zeitspanne
   * vom Server ab und stellt diese dar
   */
  receiveShowAllCustomRangeData() {
    if (this.datesCustomRangeData) {
      this.serverService
        .getRangeDataBetweenTimestamps(
          this.datesCustomRangeData[0],
          this.datesCustomRangeData[1]
        )
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          (rangeDataJSON) => {
            this.rangeDataJSON = rangeDataJSON;
          },
          (error) => {
            console.log(
              'Error fetching custom Range-Data from the server. Is the server running?'
            );
            this.openSnackbar(
              'Error fetching custom Range-Data from the server. Is the server running?',
              2000
            );
          },
          () => {
            // Stelle gefundene Range-Data auf der Karte dar
            if (this.rangeDataJSON) {
              this.drawRangeDataJSONOnMap(this.rangeDataJSON);
            }
          }
        );
    }
  }

  /**
   * Methode versteckt oder zeigt den Layer mit den RangeData-Points
   * Hinweis: Boolean wird hier invertiert, da "versteckt" true ist
   * @param toggleHideRangeData boolean
   */
  hideRangeDataOverlay(toggleHideRangeData: boolean) {
    // Wenn die Sichtbarkeit der gewünschten bereits entspricht, tue nichts
    if (this.rangeDataLayer.get('visible') === !toggleHideRangeData) {
      return;
    }

    // Verändere Sichtbarkeit des Layers
    // Hinweis: Daten des Layers werden hier nur versteckt und nicht gelöscht!
    this.rangeDataLayer.set('visible', !toggleHideRangeData);
  }

  /**
   * Methode zeigt die RangeData-Points der Feeder unterschiedlich an
   */
  markRangeDataByFeeder() {
    // Setze neue Stylings, wenn toggleFilterRangeDataByFeeder true ist
    if (this.bMarkRangeDataByFeeder && this.rangeDataLayer) {
      var RangeDataFeatures = this.rangeDataLayer.getSource()!.getFeatures();

      for (var i in RangeDataFeatures) {
        var feature: any = RangeDataFeatures[i];

        let feederStyle;
        // Finde zum Feature zugehörigen Feeder
        for (let i = 0; i < this.listFeeder.length; i++) {
          if (
            feature.feederList &&
            feature.feederList.includes(this.listFeeder[i].name)
          ) {
            feederStyle = this.listFeeder[i].styleFeederPoint;
          }
        }

        if (feederStyle) {
          // Setze Style für den jeweiligen Feeder
          feature.setStyle(feederStyle);
        }
      }
    }

    // Setze default-Styling, wenn toggleFilterRangeDataByFeeder false ist
    if (!this.bMarkRangeDataByFeeder && this.rangeDataLayer) {
      var RangeDataFeatures = this.rangeDataLayer.getSource()!.getFeatures();
      for (var i in RangeDataFeatures) {
        var feature: any = RangeDataFeatures[i];

        // Überspringe Polygon-Style, damit dieses nicht geändert wird
        if (feature.name && feature.name != 'RangeDataPolygon') {
          // Setze Default-Style für alle Range-Data-Features
          feature.setStyle(Styles.RangeDataPointStyle);
        }
      }
    }
  }

  /**
   * Methode zeigt die RangeData-Points nach Höhe unterschiedlich an
   */
  markRangeDataByHeight() {
    // Setze neue Stylings, wenn bfilterRangeDataByHeight true ist
    if (this.bMarkRangeDataByHeight && this.rangeDataLayer) {
      var RangeDataFeatures = this.rangeDataLayer.getSource()!.getFeatures();

      for (var i in RangeDataFeatures) {
        var feature: any = RangeDataFeatures[i];

        let altitude = feature.altitude;

        if (altitude) {
          // Hinweis: Parameter "onGround" ist hier irrelevant
          let color = Markers.getColorFromAltitude(
            altitude,
            false,
            true,
            false
          );

          // Style mit neuer Farbe nach Höhe
          let styleWithHeightColor = new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color: color,
              }),
              stroke: new Stroke({
                color: 'white',
                width: 1,
              }),
            }),
          });

          feature.setStyle(styleWithHeightColor);
        }
      }
    }

    // Setze default-Styling, wenn bfilterRangeDataByHeight false ist
    if (!this.bMarkRangeDataByHeight && this.rangeDataLayer) {
      var RangeDataFeatures = this.rangeDataLayer.getSource()!.getFeatures();
      for (var i in RangeDataFeatures) {
        var feature: any = RangeDataFeatures[i];

        // Überspringe Polygon-Style, damit dieses nicht geändert wird
        if (feature.name && feature.name != 'RangeDataPolygon') {
          // Setze Default-Style für alle Range-Data-Features
          feature.setStyle(Styles.RangeDataPointStyle);
        }
      }
    }
  }

  /**
   * Zeigt die RangeData-Points und das Polygon im Dark- oder Light-Mode an
   */
  toggleDarkModeInRangeData() {
    if (this.rangeDataLayer) {
      this.RangeDataFeatures.getFeatures().forEach((feature) => {
        if (feature.get('name') != 'RangeDataPolygon') {
          feature.setStyle(
            this.darkStaticFeatures
              ? Styles.RangeDataPointStyle
              : Styles.RangeDataPointStyleWhite
          );
        } else if (feature.get('name') == 'RangeDataPolygon') {
          feature.setStyle(
            this.darkStaticFeatures
              ? Styles.RangeDataPolygonStyle
              : Styles.RangeDataPolygonStyleWhite
          );
        }
      });

      if (this.bMarkRangeDataByHeight) {
        this.markRangeDataByHeight();
      }

      if (this.bMarkRangeDataByFeeder) {
        this.markRangeDataByFeeder();
      }
    }
  }

  /**
   * Erstellt und zeigt die Flugzeug-Label an,
   * je nach Wert des Booleans toggleShowAircraftLabels
   */
  receiveToggleShowAircraftLabels() {
    if (this.toggleShowAircraftLabels) {
      Globals.showAircraftLabel = true;

      // Erstelle für jedes Flugzeug aus Planes das Label
      for (var hex of Object.keys(this.Planes)) {
        this.Planes[hex].showLabel();
      }
    } else {
      Globals.showAircraftLabel = false;
      // Verstecke für jedes Flugzeug aus Planes das Label
      for (var hex of Object.keys(this.Planes)) {
        this.Planes[hex].hideLabel();
      }
    }
  }

  /**
   * Erstellt und zeigt einen POMD-Point an, je nach Wert des
   * Booleans Globals.showPOMDPoint. Wenn der Boolean false ist,
   * werden alle POMD-Points gelöscht
   */
  receiveToggleShowPOMDPoints() {
    if (this.showPOMDPoint) {
      Globals.showPOMDPoint = true;

      // Erstelle für das ausgewählte Flugzeug aus Planes den Point
      if (this.aircraft) {
        this.aircraft.updatePOMDMarker(false);
      }
    } else {
      Globals.showPOMDPoint = false;
      // Entferne für alle Flugzeuge aus Planes den Point
      this.resetAllDrawnPOMDPoints();
    }
  }

  /**
   * Sendet die Liste mit Feedern, die App-Version, den Namen
   * der App, die IP-Adresse des Clients sowie den Boolean,
   * ob es Opensky-Credentials gibt an die Settings-Komponente,
   * damit die Einstellungen angezeigt werden können
   */
  sendInformationToSettings() {
    this.settingsService.sendReceiveListFeeder(this.listFeeder);
    this.settingsService.sendReceiveAppNameAndVersion([
      Globals.appName,
      Globals.appVersion,
    ]);
    this.settingsService.sendReceiveClientIp(Globals.clientIp);
    this.settingsService.sendReceiveOpenskyCredentialsExist(
      Globals.openskyCredentials
    );
    this.sendAvailableMapsToSettings();
  }

  /**
   * Prüfe auf Geoapify-API-Key und gebe Liste an verfügbaren Maps
   * an Settings weiter
   */
  sendAvailableMapsToSettings() {
    this.listAvailableMaps = Maps.listAvailableFreeMaps;
    if (this.geoapifyApiKey) {
      let listGeoapifyWithApiKey: any[] = [];
      for (let i = 0; i < Maps.listAvailableGeoapifyMaps.length; i++) {
        let element = Maps.listAvailableGeoapifyMaps[i];
        element.url = element.url.concat(this.geoapifyApiKey);
        listGeoapifyWithApiKey.push(element);
      }
      this.listAvailableMaps.push(...listGeoapifyWithApiKey);
    }
    this.markSelectedMapInAvailableMaps(this.listAvailableMaps);
    this.settingsService.sendReceiveListAvailableMaps(this.listAvailableMaps);
  }

  markSelectedMapInAvailableMaps(listMaps: any) {
    for (let i = 0; i < listMaps.length; i++) {
      let element = listMaps[i];
      if (this.currentSelectedMapStyle.name == element.name)
        element.isSelected = true;
    }
  }

  /**
   * Zeigt die Range-Data der selektierten Feeder an
   */
  filterRangeDataBySelectedFeeder() {
    if (this.selectedFeederRangeData) {
      this.drawRangeDataJSONOnMap(this.rangeDataJSON);
    }
  }

  /**
   * Markiert ein Flugzeug auf der Karte, wenn es in der Tabelle
   * ausgewählt wurde. Die Info-Komponente wird dabei im Desktop-
   * Modus angezeigt und der Trail dargestellt.
   * @param hexSelectedAircraft Hex des ausgewählten Flugzeugs
   */
  markUnmarkAircraftFromAircraftTable(hexSelectedAircraft: string) {
    if (hexSelectedAircraft) {
      this.markOrUnmarkAircraft(hexSelectedAircraft, true);
    }
  }

  /**
   * Entfernt ein Flugzeug aus allen Datenstrukturen
   * (bis auf Globals.PlanesOrdered) und zerstört
   * es am Ende
   * @param aircraft Aircraft
   */
  removeAircraft(aircraft: Aircraft): void {
    // Entferne Flugzeug aus Planes
    delete this.Planes[aircraft.hex];

    // Entferne Flugzeug als aktuell markiertes Flugzeug, wenn es dieses ist
    if (this.aircraft?.hex == aircraft.hex) this.aircraft = null;

    // Zerstöre Flugzeug
    aircraft.destroy();
  }

  /**
   * Entfernt alle Flugzeuge von Opensky
   */
  removeAllOpenskyPlanes() {
    let length = Globals.PlanesOrdered.length;
    let aircraft: Aircraft | undefined;
    for (let i = 0; i < length; i++) {
      aircraft = Globals.PlanesOrdered.shift();
      if (aircraft == null || aircraft == undefined) continue;

      // Wenn Flugzeug von Opensky ist, wird das Flugzeug entfernt
      if (!aircraft.isMarked && aircraft.isFromOpensky) {
        // Entferne Flugzeug
        this.removeAircraft(aircraft);
      } else {
        // Behalte Flugzeug und pushe es zurück in die Liste
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  /**
   * Entfernt alle Flugzeuge, welche nicht vom dem
   * ausgewählten Feeder stammen
   * @param selectedFeeder string
   */
  removeAllNotSelectedFeederPlanes(selectedFeeder: string) {
    let length = Globals.PlanesOrdered.length;
    let aircraft: Aircraft | undefined;
    for (let i = 0; i < length; i++) {
      aircraft = Globals.PlanesOrdered.shift();
      if (aircraft == null || aircraft == undefined) continue;

      // Wenn Flugzeug nicht vom gewählten Feeder ist, entferne das Flugzeug
      if (!aircraft.isMarked && !aircraft.feederList.includes(selectedFeeder)) {
        // Entferne Flugzeug
        this.removeAircraft(aircraft);
      } else {
        // Behalte Flugzeug und pushe es zurück in die Liste
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  /**
   * Entfernt die ISS
   */
  removeISSFromPlanes() {
    let length = Globals.PlanesOrdered.length;
    let aircraft: Aircraft | undefined;
    for (let i = 0; i < length; i++) {
      aircraft = Globals.PlanesOrdered.shift();
      if (aircraft == null || aircraft == undefined) continue;

      // Wenn Flugzeug ISS ist, entferne das Flugzeug
      if (!aircraft.isMarked && aircraft.hex == 'ISS') {
        // Entferne Flugzeug
        this.removeAircraft(aircraft);
      } else {
        // Behalte Flugzeug und pushe es zurück in die Liste
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  /**
   * Entfernt alle nicht markierten Flugzeuge
   */
  removeAllNotSelectedPlanes() {
    let length = Globals.PlanesOrdered.length;
    let aircraft: Aircraft | undefined;
    for (let i = 0; i < length; i++) {
      aircraft = Globals.PlanesOrdered.shift();
      if (aircraft == null || aircraft == undefined) continue;

      // Wenn Flugzeug nicht ausgewählt ist, wird das Flugzeug entfernt
      if (!aircraft.isMarked) {
        // Entferne Flugzeug
        this.removeAircraft(aircraft);
      } else {
        // Behalte Flugzeug und pushe es zurück in die Liste
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  /**
   * Entfernt alle nicht markierten Flugzeuge, die
   * nicht im momentanen Extent sind
   */
  removePlanesNotInCurrentExtent(extent) {
    let length = Globals.PlanesOrdered.length;
    let aircraft: Aircraft | undefined;
    for (let i = 0; i < length; i++) {
      aircraft = Globals.PlanesOrdered.shift();
      if (aircraft == null || aircraft == undefined) continue;

      // Wenn Flugzeug nicht im momentanem extent ist, wird das Flugzeug entfernt
      if (!aircraft.isMarked && !this.planeInView(aircraft.position, extent)) {
        // Entferne Flugzeug
        this.removeAircraft(aircraft);
      } else {
        // Behalte Flugzeug und pushe es zurück in die Liste
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  planeInView(position: number[], extent: any): boolean {
    if (position == null) return false;

    let lon = position[0];
    let lat = position[1];

    let minLon = extent[0];
    let minLat = extent[1];
    let maxLon = extent[2];
    let maxLat = extent[3];

    if (lat < minLat || lat > maxLat) return false;

    if (extent[2] - extent[0] > 40075016) {
      // all longtitudes in view, only check latitude
      return true;
    } else if (minLon < maxLon) {
      // no wraparound: view not crossing 179 to -180 transition line
      return lon > minLon && lon < maxLon;
    } else {
      // wraparound: view crossing 179 to -180 transition line
      return lon > minLon || lon < maxLon;
    }
  }

  /**
   * Zentriert die Karte über der ISS wenn centerMapOnIss true ist.
   * Ansonsten wird die vorherige Kartenposition als Zentrum genommen
   * @param centerMapOnIss boolean
   */
  receiveCenterMapOnIss(centerMapOnIss: boolean) {
    if (!this.showIss) {
      return;
    }

    if (centerMapOnIss) {
      // Hole ISS vom Server
      this.getISSFromServer();
    } else {
      // Setze Center der Map auf die gespeicherte Position zurueck
      if (!this.oldISSCenterPosition || !this.oldISSCenterZoomLevel) return;
      this.centerMap(
        this.oldISSCenterPosition[0],
        this.oldISSCenterPosition[1],
        this.oldISSCenterZoomLevel
      );
    }
  }

  /**
   * Holt die ISS vom Server und stellt sie im Zentrum der Karte dar
   */
  getISSFromServer() {
    // Mache Server-Aufruf
    this.serverService
      .getISSWithoutExtent()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (IssJSONObject) => {
          // Mache Update der angezeigten Flugzeuge
          this.processPlanesUpdate([IssJSONObject]);

          // Aktualisiere Flugzeug-Tabelle mit der globalen Flugzeug-Liste
          this.aircraftTableService.updateAircraftList(Globals.PlanesOrdered);

          let iss: Aircraft = this.Planes['ISS'];

          let issPosition = iss.position;
          if (issPosition == undefined) return;

          // Speichere alte View-Position der Karte ab
          this.oldISSCenterPosition = olProj.transform(
            this.OLMap.getView().getCenter(),
            'EPSG:3857',
            'EPSG:4326'
          );
          this.oldISSCenterZoomLevel = this.OLMap.getView().getZoom();

          // Zentriere Karte auf ISS
          this.centerMap(issPosition[0], issPosition[1], Globals.zoomLevel);

          // Merke am Flugzeug, dass Aufruf bereits getätigt wurde (ISS ist Sonderfall)
          iss.allDataWasRequested = true;
        },
        (error) => {
          console.log(
            'Error updating the iss without extent from the server. Is the server running?'
          );
          this.openSnackbar(
            'Error updating the iss without extent from the server. Is the server running?',
            2000
          );
        }
      );
  }

  /**
   * Erstellt eine Interaktion mit der der aktuelle Geräte-Standort
   * ausgewählt werden kann. Nach einer Auswahl wird die Interaktion
   * wieder gelöscht
   */
  setCurrentDevicePosition() {
    // Erstelle Interaktion, um einen Point zu zeichnen
    let draw = new Draw({
      source: this.DrawFeature,
      type: 'Point',
      style: Styles.DevicePositionStyle,
    });
    this.OLMap.addInteraction(draw);

    // Nach Zeichnen eines Points entferne Interaktion wieder
    draw.on('drawend', (evt) => {
      this.OLMap.removeInteraction(draw);

      // Speichere Koordinaten des erstellten Points im LocalStorage ab
      let point = <Point>evt.feature.getGeometry();
      let coordinates = point.getCoordinates();

      // Transformiere Koordinaten in EPSG:3857
      Globals.DevicePosition = olProj.toLonLat(coordinates, 'EPSG:3857');

      localStorage.setItem(
        'coordinatesDevicePosition',
        JSON.stringify(Globals.DevicePosition)
      );

      this.DrawFeature.clear();

      this.drawDevicePositionFromLocalStorage();
    });
  }

  /**
   * Markiert den aktuellen Geräte-Standort auf der Karte
   */
  drawDevicePositionFromLocalStorage() {
    // Schaue im LocalStorage nach bereits gespeicherten Geräte-Standort
    // nach und erstelle Feature
    if (
      Globals.DevicePosition !== null ||
      localStorage.getItem('coordinatesDevicePosition') !== null
    ) {
      let coordinates;

      if (localStorage.getItem('coordinatesDevicePosition') !== null) {
        let coordinatesDevicePositionString = localStorage.getItem(
          'coordinatesDevicePosition'
        );
        if (coordinatesDevicePositionString === null) return;

        coordinates = JSON.parse(coordinatesDevicePositionString);

        // Speichere Koordinaten in globaler Variable ab (lon, lat)
        Globals.DevicePosition = coordinates;
      } else if (Globals.DevicePosition !== null) {
        coordinates = Globals.DevicePosition;
      }

      if (coordinates === undefined) return;

      // Lösche bisherige Geräte-Position, wenn diese existiert
      this.removeDevicePositionFromStaticFeatures();

      let feature = new Feature(new Point(olProj.fromLonLat(coordinates)));
      feature.setStyle(Styles.DevicePositionStyle);
      feature.set('name', 'devicePosition');
      this.StaticFeatures.addFeature(feature);
    }
  }

  deleteDevicePosition() {
    if (
      Globals.DevicePosition !== null ||
      localStorage.getItem('coordinatesDevicePosition') !== null
    ) {
      // Lösche bisherige Geräte-Position, wenn diese existiert
      this.removeDevicePositionFromStaticFeatures();

      localStorage.removeItem('coordinatesDevicePosition');

      // reset
      Globals.DevicePosition = null;
    }
  }

  removeDevicePositionFromStaticFeatures() {
    if (
      Globals.DevicePosition !== null ||
      localStorage.getItem('coordinatesDevicePosition') !== null
    ) {
      // Lösche bisherige Geräte-Position, wenn diese existiert
      let staticFeatures = this.StaticFeatures.getFeatures();
      for (let i in staticFeatures) {
        let feature: any = staticFeatures[i];

        if (
          feature != undefined &&
          feature.get('name') != undefined &&
          feature.get('name') === 'devicePosition'
        ) {
          this.StaticFeatures.removeFeature(feature);
        }
      }
    }
  }

  /**
   * Erstellt die Range-Ringe mit dem aktuellen Geräte-Standort als
   * Zentrum oder der Antennen-Position als Zentrum (Site-Position)
   * @param rangeRingsToDevicePosition boolean
   */
  setCenterOfRangeRings(rangeRingsToDevicePosition: boolean) {
    if (rangeRingsToDevicePosition === true) {
      // Benutze Geräte-Position als Zentrum
      if (Globals.DevicePosition) {
        this.createRangeRingsAndSitePos(Globals.DevicePosition);
      }
    } else {
      // Benutze Antennen-Position als Zentrum (Site-Position)
      this.createRangeRingsAndSitePos(Globals.SitePosition);
    }
  }

  /**
   * Setzt den Light- oder Dark-Mode auf der Map mittels Filter
   */
  setLightDarkModeInMap() {
    if (!this.osmLayer) return;
    this.resetCurrentCSSFilter();
    this.createNewLuminosityFilter(Globals.luminosityValueMap.toString());
  }

  private createNewLuminosityFilter(brightnessValue: string) {
    var filter = new Colorize();
    filter.setFilter({
      operation: 'luminosity',
      value: brightnessValue,
    });
    this.osmLayer.addFilter(filter);
  }

  enableDisableCurrentFilters(filters: [], enable: boolean) {
    for (let i = 0; i < filters.length; i++) {
      this.osmLayer.getFilters()[i].setActive(enable);
    }
  }

  createOrHideRainViewerRain() {
    if (this.showRainViewerRain || this.showRainViewerRainForecast) {
      this.createRainViewerRainLayer();

      if (this.refreshIntervalIdRainviewer == undefined) {
        this.initUpdateRainViewerData();
      }

      // initial data request
      this.makeRequestRainviewerApi();
    } else {
      this.removeRainViewerRainLayer();
    }

    // Stoppe forecast animation
    if (!this.showRainViewerRainForecast) {
      this.stopRainForecastAnimation();
    }

    // Stoppe requests nach rainviewer, wenn weder rain noch clouds angezeigt werden sollen
    if (
      !this.showRainViewerRain &&
      !this.showRainViewerClouds &&
      !this.showRainViewerRainForecast
    ) {
      this.stopRequestsToRainviewer();
    }

    this.rainviewerRainLayer?.set(
      'visible',
      this.showRainViewerRain || this.showRainViewerRainForecast
    );
  }

  createOrHideRainViewerClouds() {
    if (this.showRainViewerClouds) {
      this.createRainViewerCloudsLayer();

      if (this.refreshIntervalIdRainviewer == undefined) {
        this.initUpdateRainViewerData();
      }

      // initial data request
      this.makeRequestRainviewerApi();
    } else {
      this.removeRainViewerCloudsLayer();
    }

    // Stoppe requests nach rainviewer, wenn weder rain noch clouds angezeigt werden sollen
    if (!this.showRainViewerRain && !this.showRainViewerClouds) {
      this.stopRequestsToRainviewer();
    }

    this.rainviewerCloudsLayer?.set('visible', this.showRainViewerClouds);
  }

  removeRainViewerCloudsLayer() {
    this.layers?.remove(this.rainviewerCloudsLayer);
  }

  createRainViewerCloudsLayer() {
    if (this.layers == undefined) return;

    this.rainviewerCloudsLayer = new TileLayer({
      source: new XYZ({
        url: '',
      }),
      opacity: 0.4,
    });

    this.layers.push(this.rainviewerCloudsLayer);
  }

  initUpdateRainViewerData() {
    // Update der Rainviewer-Daten alle zwanzig Sekunden automatisch,
    // auch wenn sich Map nicht bewegt
    this.refreshIntervalIdRainviewer = window.setInterval(() => {
      this.makeRequestRainviewerApi();
    }, 20000);
  }

  stopRequestsToRainviewer() {
    clearInterval(this.refreshIntervalIdRainviewer);
    this.refreshIntervalIdRainviewer = undefined;
  }

  createRainViewerRainLayer() {
    if (this.layers == undefined) return;

    this.rainviewerRainLayer = new TileLayer({
      source: new XYZ({
        url: '',
      }),
      opacity: 0.4,
    });

    this.layers.push(this.rainviewerRainLayer);
  }

  removeRainViewerRainLayer() {
    this.layers?.remove(this.rainviewerRainLayer);
  }

  makeRequestRainviewerApi() {
    this.rainviewerService
      .getRainviewerUrlData()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (rainviewerUrlData) => {
          if (rainviewerUrlData === undefined) return;

          // rain
          let pastRadar: Array<any> = rainviewerUrlData.radar.past;
          // rain (forecast)
          let nowcastRadar: Array<any> = rainviewerUrlData.radar.nowcast;
          // clouds
          let infraredSatellite: Array<any> =
            rainviewerUrlData.satellite.infrared;

          // reset array
          this.forecastRainPathAndTime = [];

          let nowRain;
          if (pastRadar) {
            // rain
            let lastIndex = pastRadar.length - 1;
            nowRain = pastRadar[lastIndex];
            const updatedUrlRainNow = this.buildRainViewerUrlRain(nowRain.path);

            if (this.showRainViewerRain) {
              this.rainviewerRainLayer.getSource()?.setUrl(updatedUrlRainNow);
            }
          }

          if (pastRadar && nowcastRadar) {
            // rain (past + forecast)
            for (let i = 0; i < pastRadar.length; i++) {
              this.forecastRainPathAndTime.push(pastRadar[i]);
            }

            for (let j = 0; j < nowcastRadar.length; j++) {
              this.forecastRainPathAndTime.push(nowcastRadar[j]);
            }

            if (this.showRainViewerRainForecast) {
              this.stopRainForecastAnimation();
              this.updateRainViewerRainForecastLayerUrl();
            }
          }

          if (infraredSatellite) {
            // clouds
            let lastIndex = infraredSatellite.length - 1;
            let newestTimestampCloudsUrl = infraredSatellite[lastIndex].path;

            const updatedUrlClouds = this.buildRainViewerUrlClouds(
              newestTimestampCloudsUrl
            );
            this.rainviewerCloudsLayer.getSource()?.setUrl(updatedUrlClouds);
          }
        },
        (error) => {
          console.log('Error loading rainviewer data');
          this.openSnackbar('Error loading rainviewer data', 2000);
        }
      );
  }

  buildRainViewerUrlRain(pathFromApi: string) {
    return this.buildRainViewerUrl(pathFromApi, 512, 4, 1, 1);
  }

  buildRainViewerUrlClouds(pathFromApi: string) {
    return this.buildRainViewerUrl(pathFromApi, 512, 0, 0, 0);
  }

  buildRainViewerUrl(
    pathFromApi: string,
    size: number,
    color: number,
    smoothImage: number,
    displaySnowInSeperateColor: number
  ) {
    const baseUrl = 'https://tilecache.rainviewer.com';
    return (
      baseUrl +
      pathFromApi +
      '/' +
      size +
      '/{z}/{x}/{y}/' +
      color +
      '/' +
      smoothImage +
      '_' +
      displaySnowInSeperateColor +
      '.png'
    );
  }

  updateRainViewerRainForecastLayerUrl() {
    if (this.showRainViewerRainForecast && this.forecastRainPathAndTime) {
      // initial
      this.playRainViewerForecastAnimation();

      this.refreshIntervalIdRainviewerForecast = window.setInterval(() => {
        this.playRainViewerForecastAnimation();
      }, 18000);
    }
  }

  async playRainViewerForecastAnimation() {
    this.timeoutHandlerForecastAnimation = [];
    const intervalMs = 1000;

    for (let i = 0; i < this.forecastRainPathAndTime.length; i++) {
      let timeoutHandler = window.setTimeout(
        () =>
          this.showRainViewerForecastAnimationFrame(
            this.forecastRainPathAndTime[i]
          ),
        i * intervalMs
      );
      this.timeoutHandlerForecastAnimation.push(timeoutHandler);
    }
  }

  showRainViewerForecastAnimationFrame(forecastRainPathAndTimeFrame) {
    if (this.showRainViewerRainForecast && this.forecastRainPathAndTime) {
      this.rainviewerRainLayer
        .getSource()
        ?.setUrl(
          this.buildRainViewerUrlRain(forecastRainPathAndTimeFrame.path)
        );
      this.showForecastHintSnackbar(forecastRainPathAndTimeFrame.time);
    }
  }

  showForecastHintSnackbar(timestampUTC: any) {
    this.openSnackbar(new Date(timestampUTC * 1000).toLocaleTimeString(), 1000);
  }

  stopRainForecastAnimation() {
    clearInterval(this.refreshIntervalIdRainviewerForecast);
    this.refreshIntervalIdRainviewerForecast = undefined;
    if (this.timeoutHandlerForecastAnimation) {
      for (let i = 0; i < this.timeoutHandlerForecastAnimation.length; i++) {
        clearInterval(this.timeoutHandlerForecastAnimation[i]);
      }
      this.timeoutHandlerForecastAnimation = [];
    }
  }

  receiveToggleShowAircraftPositions() {
    if (this.OLMap && this.layers && (this.planesLayer || this.webglLayer)) {
      if (this.planesLayer)
        this.planesLayer.setVisible(!this.planesLayer.getVisible());
      if (this.webglLayer)
        this.webglLayer.setVisible(!this.webglLayer.getVisible());
    }
  }

  /**
   * Hole gewünschte Karte aus LocalStorage, ansonsten nehme default
   * @returns object mit MapStyle
   */
  getMapStyleFromLocalStorage() {
    let mapStyle = localStorage.getItem('mapStyle');
    return mapStyle !== null
      ? JSON.parse(mapStyle)[0] // ist object in array
      : Maps.listAvailableFreeMaps[0];
  }

  /**
   * Speichere gewünschte Karte in LocalStorage
   */
  saveMapStyleInLocalStorage(selectedMapStyle: any) {
    let mapStyle = this.listAvailableMaps.filter(
      (mapStyle) => mapStyle.name == selectedMapStyle
    );
    localStorage.setItem('mapStyle', JSON.stringify(mapStyle));
  }

  resetCurrentCSSFilter() {
    var currentFilters = this.osmLayer.getFilters();
    this.enableDisableCurrentFilters(currentFilters, false);
  }

  dimMapOrRemoveFilter() {
    if (this.dimMap) {
      this.setLightDarkModeInMap();
    } else {
      this.resetCurrentCSSFilter();
    }
  }

  showAircraftFromFeeder(selectedFeederUpdate: string) {
    // Entferne alle Flugzeuge, die nicht vom ausgewählten Feeder kommen
    if (this.selectedFeederUpdate != 'AllFeeder') {
      this.removeAllNotSelectedFeederPlanes(selectedFeederUpdate);
    }

    // Aktualisiere Flugzeuge vom Server
    this.updatePlanesFromServer(
      this.selectedFeederUpdate,
      this.showOpenskyPlanes,
      this.showIss
    );

    // Aktualisiere Daten des markierten Flugzeugs
    if (this.aircraft) {
      this.getAllAircraftData(this.aircraft);
      this.getTrailToAircraft(this.aircraft, this.selectedFeederUpdate);
    }
  }

  // TODO test method for changing icon scale dynamically
  setNewIconSizeScaleAndRedrawPlanes(
    globalIconSizeFactor: number,
    smallIconScaleFactor: number
  ) {
    // Leere webglFeatures
    if (Globals.webgl) {
      Globals.WebglFeatures.clear();
    }

    // Erstelle Marker neu von jedem Flugzeug
    for (let i in Globals.PlanesOrdered) {
      const aircraft = Globals.PlanesOrdered[i];
      aircraft.clearMarker();
      aircraft.updateMarker(false);
    }
  }

  /**
   * Triggert das Zeigen oder Verstecken der 3d-Map aus der Info-Komponente heraus
   */
  receiveToggleShow3dMap() {
    let show3dMap = !this.display3dMap;
    if (show3dMap && !this.cesiumIonDefaultAccessToken) {
      this.openSnackbar(
        `Cesium Ion Default Access Token is not available. 3D-Map cannot be used!`,
        3000
      );
      show3dMap = !this.display3dMap;
      return;
    }
    this.show3dMap(show3dMap);
  }

  /**
   * Zeigt oder versteckt die 3d-Map, indem globaler Boolean gesetzt wird
   */
  show3dMap(show: boolean) {
    Globals.display3dMap = show;
  }

  /**
   * Update Aircraft in der Cesium-Component, nachdem der Trail geholt wurde
   */
  updateCesiumComponentWithAircraft() {
    if (this.aircraft && Globals.display3dMap) {
      this.cesiumService.updateAircraft(this.aircraft);
    }
  }

  updateCameraInCesium() {
    if (this.aircraft && Globals.display3dMap) {
      this.cesiumService.updateView(this.aircraft);
    }
  }
}
