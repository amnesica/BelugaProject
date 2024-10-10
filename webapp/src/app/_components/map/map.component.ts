import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';
import { Style, Fill, Stroke, Circle, Icon, Text } from 'ol/style';
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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
import {
  dummyParentAnimation,
  slideInOutRight,
} from 'src/app/_common/animations';
import { Storage } from 'src/app/_classes/storage';
import { Trail } from 'src/app/_classes/trail';
import { Ship } from 'src/app/_classes/ship';
import BaseLayer from 'ol/layer/Base';
import { StyleLike } from 'ol/style/Style';
import { LiteralStyle } from 'ol/style/literal';

@Component({
  selector: 'app-map',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  animations: [dummyParentAnimation, slideInOutRight],
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

  // Entfernungs-Ringe und Feeder-Position als Features
  StaticFeatures = new Vector();

  // Flughäfen als Features
  AirportFeatures = new Vector();

  // Schiffe als Features
  AisFeatures = new Vector();

  // Schiff-Labels als Features
  AisLabelFeatures = new Vector();

  // Schiff-Outlines als Features
  AisOutlineFeatures = new Vector();

  // Route als Kurve zum Zielort als Features
  RouteFeatures = new Vector();

  // RangeData als Features
  RangeDataFeatures = new Vector();

  // Objekt mit allen Flugzeugen
  Planes: { [hex: string]: Aircraft } = {};

  // Flugzeug-Labels als Features
  PlaneLabelFeatures = new Vector();

  // Layer für Flugzeug-Labels
  planeLabelFeatureLayer!: VectorLayer<Vector<Geometry>>;

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
  selectedFeederUpdate: string[] = [];

  // Default-Werte für Fetch-Booleans
  showAirportsUpdate: boolean = true;
  showOpenskyPlanes: boolean = false;
  showAirplanesLivePlanes: boolean = false;
  showAisData: boolean = false;
  showIss: boolean = true;
  showOnlyMilitary: boolean = false;

  // Anzahl der momentan laufenden Fetches (Flugzeuge) an den Server
  pendingFetchesPlanes = 0;

  // Anzahl der momentan laufenden Fetches (Airports) an den Server
  pendingFetchesAirports = 0;

  // Boolean, ob DarkMode aktiviert ist
  darkMode: boolean = false;

  // Boolean, ob Flugzeug-Label angezeigt werden sollen
  showAircraftLabel: boolean = false;

  // Boolean, ob Flugzeug-Positionen angezeigt werden sollen
  showAircraftPositions: boolean = true;

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
  markRangeDataByFeeder: boolean = false;

  // Boolean, ob RangeData nach Höhe farblich sortiert sein soll
  markRangeDataByHeight: boolean = false;

  // Bottom-Wert für RangeDataPopup
  // (wenn dieser angezeigt wird, soll dieser auf 10px gesetzt werden)
  rangeDataPopupBottomValue: any = 0;

  // Selektierte Feeder, nachdem Range Data selektiert werden soll
  selectedFeederRangeData: string[] = [];

  // Layer für WebGL-Features
  webglLayer: WebGLPoints<VectorSource<Point>> | undefined;

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

  // Actual Outline Layer
  actualOutlineFeatureLayer!: VectorLayer<Vector<Geometry>>;
  ActualOutlineFeatures = new Vector();

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

  // Aktuell angeklickter AisDataPoint (Feature)
  aisDataPoint: any;

  // Positionswerte für das Popup zum Anzeigen der
  // AirportData-Informationen
  leftValueAirporteData!: number;
  topValueAirportData!: number;

  // Popup für AirportData-Punkte
  airportDataPopup: any;

  // Popup für AisData-Punkte
  aisDataPopup: any;

  // Bottom-Wert für AirportDataPopup
  // (wenn dieser angezeigt wird, soll dieser auf 10px gesetzt werden)
  airportDataPopupBottomValue: any = 0;

  aisDataPopupBottomValue: any = 0;

  // Layer für Airports
  airportLayer!: VectorLayer<VectorSource<Geometry>>;

  // Layer für AIS Features
  aisFeatureLayer!: VectorLayer<VectorSource<Geometry>>;

  // Layer für AIS Labels
  aisLabelFeatureLayer!: VectorLayer<VectorSource<Geometry>>;

  // Layer für AIS Outline (Shape) Features
  aisOutlineFeaturesLayer!: VectorLayer<VectorSource<Geometry>>;

  // Liste an verfügbaren Map-Stilen
  listAvailableMaps: any;

  // API-Key für Geoapify
  geoapifyApiKey: any;

  // API-Key für aisstream.io
  aisstreamApiKeyExists: boolean = false;

  // Aktuell ausgewählter Map-Stil
  currentSelectedMapStyle: any;

  // Boolean, ob Map gedimmt werden soll
  shouldDimMap: boolean = true;

  // Boolean, ob dunkle Range Ringe und dunkles Antenna-Icon gezeigt werden soll
  darkStaticFeatures: boolean = true;

  // Access Token für Cesium Ion für 3d-Komponente
  cesiumIonDefaultAccessToken: any;

  // API-Key für Google Maps
  cesiumGoogleMapsApiKey: any;

  // Boolean, ob Map gerade bewegt wird
  mapIsBeingMoved: boolean = false;

  // Breite der Cesium-Map-Komponente
  cesiumMapWidth: string = '';

  // Boolean, um alle gespeicherten Trails anzuzeigen
  showTrailData: boolean = false;

  // Layer für alle Trails vom Server
  allTrailsLayer: LayerGroup | undefined;

  // Boolean, ob Altitude Chart angezeigt werden soll
  showAltitudeChart: boolean = true;

  // Interval-ID für fetch AIS Funktion
  fetchAisIntervalId: number = 0;

  static aisSpritesAll: string =
    'data:image/png;base64,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';

  // Open Sea Map Layer
  openSeaMapLayer: TileLayer<OSM> | undefined;

  // Min-Zoom für Sichtbarkeit der AIS Outlines
  minZoomAisOutlines: number = 11.5;

  // Boolean, ob actual range outline angezeigt werden soll
  showActualRangeOutline: boolean = true;

  // Interval-ID zum Fetchen der Outline
  fetchActualOutlineIntervalId: number = 0;

  private ngUnsubscribe = new Subject<void>();

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
    // Initiiere Default-Settings
    Storage.setDefaultSettingsValues();

    // Hole Konfiguration vom Server, wenn diese nicht vorhanden ist, breche ab
    this.getConfiguration();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Holt die Konfiguration vom Server und intialisiert wichtige
   * Variable wie anzuzeigende Position. Wenn alle erforderlichen
   * Variablen vorhanden und gesetzt sind, starte das eigentliche
   * Programm
   */
  private getConfiguration() {
    this.serverService
      .getConfigurationData()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (configuration) => this.setConfigurationValues(configuration),
        (error) => {
          console.error(
            'Configuration could not be loaded. Is the server online? Program will not be executed further.'
          );
          this.infoConfigurationFailureMessage =
            'Configuration could not be loaded. Is the server online? Program will not be executed further.';
        },
        () =>
          // Überprüfe gesetzte Werte, WebGl-Support und starte Programm
          this.startProgramOrThrowError()
      );
  }

  private setConfigurationValues(configuration: any) {
    // Setze Werte aus Konfiguration
    Globals.latFeeder = configuration.latFeeder;
    Globals.lonFeeder = configuration.lonFeeder;
    Globals.globalScaleFactorIcons = configuration.scaleIcons;
    Globals.smallScaleFactorIcons = configuration.smallScaleIcons;

    // Setze App-Daten (App-Name, App-Version, App-Stage (dev/Master) und App-Buildtime
    Globals.appName = configuration.appName;
    Globals.appVersion = configuration.appVersion;
    Globals.appStage = configuration.appStage;
    Globals.appBuildTime = configuration.appBuildTime;

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
      this.selectedFeederUpdate = this.listFeeder.map((f) => f.name);
      this.selectedFeederRangeData = this.listFeeder.map((f) => f.name);
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

    // Setze aisstream-API-Key (nicht mandatory)
    if (configuration.aisstreamApiKeyExist) {
      this.aisstreamApiKeyExists = configuration.aisstreamApiKeyExist;
    }

    if (localStorage.getItem('globalIconSize') == null) {
      Storage.savePropertyInLocalStorage(
        'globalIconSize',
        Globals.globalScaleFactorIcons
      );
    }

    Globals.defaultGlobalScaleFactorIcons = Globals.globalScaleFactorIcons;

    if (localStorage.getItem('smallIconSize') == null) {
      Storage.savePropertyInLocalStorage(
        'smallIconSize',
        Globals.smallScaleFactorIcons
      );
    }

    Globals.defaultSmallScaleFactorIcons = Globals.smallScaleFactorIcons;
  }

  private startProgramOrThrowError() {
    if (
      (Globals.latFeeder,
      Globals.lonFeeder,
      Globals.globalScaleFactorIcons,
      Globals.SitePosition,
      Globals.appName,
      Globals.appVersion,
      Globals.appStage,
      Globals.appBuildTime,
      this.circleDistancesInNm.length != 0,
      this.listFeeder.length != 0,
      Globals.shapesMap,
      Globals.catMap,
      Globals.typesMap,
      Globals.clientIp,
      this.browserSupportsWebGl())
    ) {
      this.startProgram();
    } else {
      this.infoConfigurationFailureMessage =
        'Configuration could not be loaded. Is the server online? Program will not be executed further.';
    }
  }

  private startProgram() {
    this.initSubscriptions();
    this.initDarkMode();
    this.initMap();
    this.initBreakPointObserver();
    this.initWebglOnStartup();
    if (!Globals.webgl) return;
    this.initAircraftFetching();
    this.fetchAircraftAfterMapMove();
    this.initClickOnMap();
    this.initHoverOverAircraftIcon();
    this.sendInitialSettingsToSettings();
  }

  private initSubscriptions() {
    this.initRangeDataSubscriptions();
    this.initDataAndVisibilitySubscriptions();
    this.initMapToggleSubscriptions();
    this.initWeatherSubscriptions();
    this.initHistorySubscriptions();
  }

  private initHistorySubscriptions() {
    // Zeige oder verstecke alle Trails auf der Karte
    this.settingsService.showTrailDataSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showTrailData) => this.toggleShowTrailData(showTrailData));
  }

  private initMapToggleSubscriptions() {
    // Toggle zeige Flugzeug-Labels
    this.settingsService.toggleShowAircraftLabels$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAircraftLabel) =>
        this.toggleShowAircraftLabels(showAircraftLabel)
      );

    // Toggle Flughäfen auf der Karte
    this.settingsService.showAirportsUpdate$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAirportsUpdate) =>
        this.toggleAirportsUpdate(showAirportsUpdate)
      );

    // Zeige nur militärische Flugzeuge an
    this.settingsService.showOnlyMilitaryPlanesSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showMilitaryPlanes) =>
        this.toggleShowMilitaryPlanes(showMilitaryPlanes)
      );

    // Toggle DarkMode
    this.settingsService.showDarkMode$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showDarkMode) => this.toggleDarkMode(showDarkMode));

    // Toggle POMD-Point
    this.settingsService.showPOMDPoint$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showPOMDPoint) => this.toggleShowPOMDPoints(showPOMDPoint));

    // Toggle WebGL
    this.settingsService.useWebgl$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((webgl) => this.toggleWebGl(webgl));

    // Zentriere Karte auf die ISS oder gehe zur vorherigen Position zurück
    this.settingsService.centerMapOnIssSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((centerMapOnIss) => this.toggleCenterMapOnIss(centerMapOnIss));

    // Bestimme aktuellen Geräte-Standort
    this.settingsService.setCurrentDevicePositionSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((setDevicePosition) =>
        this.toggleSetCurrentDevicePosition(setDevicePosition)
      );

    // Toggle Geräte-Standort als Basis für versch. Berechnungen (Zentrum für Range-Ringe,
    // Distance- und POMD-Feature-Berechnungen (default: Site-Position ist Zentrum der Range-Ringe)
    this.settingsService.devicePositionAsBasisSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((devicePositionAsBasis) =>
        this.toggleDevicePositionAsBasis(devicePositionAsBasis)
      );

    // Toggle zeige/verstecke Flugzeug-Positionen
    this.settingsService.toggleShowAircraftPositions$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAircraftPositions) =>
        this.toggleShowAircraftPositions(showAircraftPositions)
      );

    // Callback für anderen Map-Stil
    this.settingsService.selectMapStyleSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedMapStyle) => this.setMapStyle(selectedMapStyle));

    // Toggle dimme Map
    this.settingsService.dimMapSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((dimMap) => this.toggleDimMap(dimMap));

    // Toggle dunkle Range Ringe und dunkles Antenna-Icon
    this.settingsService.darkStaticFeaturesSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((darkStaticFeatures) =>
        this.toggleDarkStaticFeatures(darkStaticFeatures)
      );

    // Setze Global icon size der Planes
    this.settingsService.setIconGlobalSizeSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((globalIconSizeFactor) =>
        this.setGlobalIconSize(globalIconSizeFactor)
      );

    // Setze icon size für small Planes
    this.settingsService.setIconSmallSizeSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((smallIconSizeFactor) =>
        this.setSmallIconSize(smallIconSizeFactor)
      );

    // Zeige oder verstecke Altitude-Chart
    this.settingsService.showAltitudeChartSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAltitudeChart) =>
        this.showHideAltitudeChartElement(showAltitudeChart)
      );

    // Setze Min-Zoom für AIS Outlines
    this.settingsService.aisOutlineMinZoomSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (minZoomAisOutlines) => (this.minZoomAisOutlines = minZoomAisOutlines)
      );

    // Resette Map mit gespeicherter SitePosition vom Server
    this.settingsService.resetMapPositionSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => this.setMapCenterFromSitePosition());
  }

  private initWeatherSubscriptions() {
    // Toggle Rainviewer (Rain)
    this.settingsService.rainViewerRain$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showRainViewerRain) =>
        this.createOrHideRainViewerRain(showRainViewerRain)
      );

    // Toggle Rainviewer (Clouds)
    this.settingsService.rainViewerClouds$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showRainViewerClouds) =>
        this.createOrHideRainViewerClouds(showRainViewerClouds)
      );

    // Toggle Rainviewer Forecast (Rain)
    this.settingsService.rainViewerRainForecast$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showRainViewerRainForecast) => {
        this.showRainViewerRainForecast = showRainViewerRainForecast;
        this.createOrHideRainViewerRain(this.showRainViewerRain);
      });
  }

  private initDataAndVisibilitySubscriptions() {
    // Filtere Range-Data nach selektiertem Feeder
    this.settingsService.selectedFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedFeederArray) =>
        this.filterRangeDataBySelectedFeeder(selectedFeederArray)
      );

    // Markiere/Entmarkiere ein Flugzeug, wenn es in der Tabelle ausgewählt wurde
    this.aircraftTableService.hexMarkUnmarkAircraft$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((hexMarkUnmarkAircraft) =>
        this.markUnmarkAircraftFromAircraftTable(hexMarkUnmarkAircraft)
      );

    // Zeige Flugzeuge nach selektiertem Feeder an
    this.settingsService.selectedFeederUpdate$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedFeederUpdate) =>
        this.showAircraftFromFeeder(selectedFeederUpdate)
      );

    // Zeige Opensky Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showOpenskyPlanes$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showOpenskyPlanes) =>
        this.toggleOpenSkyPlanes(showOpenskyPlanes)
      );

    // Zeige Airplanes-Live Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showAirplanesLivePlanesSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAirplanesLivePlanes) =>
        this.toggleAirplanesLivePlanes(showAirplanesLivePlanes)
      );

    // AIS-Daten
    this.settingsService.showAisDataSourceSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAisData) => this.toggleAisData(showAisData));

    // Zeige ISS und Remote Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showISS$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showIss) => this.toggleIss(showIss));
  }

  private initRangeDataSubscriptions() {
    // Zeige Range-Data zwischen Zeitstempeln
    this.settingsService.timesAsTimestamps$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((timesAsTimestamps) =>
        this.showCustomRangeData(timesAsTimestamps)
      );

    // Toggle verstecke Range-Data
    this.settingsService.toggleHideRangeData$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleHideRangeData) =>
        this.toggleRangeData(toggleHideRangeData)
      );

    // Toggle markiere Range-Data nach Feeder
    this.settingsService.toggleMarkRangeDataByFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleMarkRangeDataByFeeder) =>
        this.toggleFilterRangeDataByFeeder(toggleMarkRangeDataByFeeder)
      );

    // Toggle markiere Range-Data nach Höhe
    this.settingsService.toggleMarkRangeDataByHeight$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleMarkRangeDataByHeight) =>
        this.toggleFilterRangeDataByHeight(toggleMarkRangeDataByHeight)
      );

    // Toggle actual range outline
    this.settingsService.showActualRangeOutlineSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showActualRangeOutline) =>
        this.toggleActualRangeOutline(showActualRangeOutline)
      );
  }

  /**
   * Initialisiert die Karte mit RangeRingen,
   * Feeder-Position und Layern
   */
  private initMap(): void {
    this.createBaseLayer();
    this.createLayers();
    this.createBaseMap();
    this.createRangeRingsAndSitePos(Globals.SitePosition);
  }

  /**
   * Erstellt den Basis OSM-Layer
   */
  private createBaseLayer() {
    this.currentSelectedMapStyle = this.getMapStyleFromLocalStorage();

    if (this.layers == undefined) this.layers = new Collection();
    if (this.layers.getLength() > 0) this.layers.removeAt(0);
    if (this.openSeaMapLayer) {
      this.layers.remove(this.openSeaMapLayer);
      this.openSeaMapLayer = undefined;
    }

    this.osmLayer = this.createSelectedMapLayer(1.0);
    this.layers.insertAt(0, this.osmLayer);

    if (this.currentSelectedMapStyle.name == 'OSM OpenSeaMap')
      this.createOpenSeaMapLayer();

    this.dimMapIfNecessary();
  }

  private createOpenSeaMapLayer() {
    this.layers.removeAt(0);

    this.osmLayer = new TileLayer({
      source: new OSM(),
    });
    this.openSeaMapLayer = this.createSelectedMapLayer(0.9);

    this.layers.insertAt(0, this.osmLayer);
    this.layers.insertAt(1, this.openSeaMapLayer);
  }

  private createSelectedMapLayer(opacity: number) {
    return new TileLayer({
      source: new OSM({
        url: this.currentSelectedMapStyle.url,
        attributions: this.currentSelectedMapStyle.attribution,
      }),
      preload: 0,
      useInterimTilesOnError: false,
      opacity: opacity,
    });
  }

  /**
   * Beobachtet den Modus der Anwendung (Desktop/Mobile)
   * und setzt die Variable isDesktop entsprechend
   */
  private initBreakPointObserver() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isDesktop = false; // Mobile
          this.cesiumMapWidth = '100vw';
        } else {
          this.isDesktop = true; // Desktop
          this.cesiumMapWidth = '40rem';
        }

        this.aircraftTableService.updateWindowMode(this.isDesktop);
        this.showHideAltitudeChartElement(this.showAltitudeChart);
      });
  }

  /**
   * Initialisiert den Dark- oder Light-Modus und setzt die ent-
   * sprechende Variable. Auch ein Listener wird initialisiert, damit
   * der Modus gewechselt wird, wenn das System-Theme geändert wird
   */
  private initDarkMode() {
    // Detekte dunklen Modus und setze Variable initial
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? (this.darkMode = true)
      : (this.darkMode = false);

    // Initialisiere Listener, um auf System-Veränderungen reagieren zu können
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => (this.darkMode = event.matches));

    // Setze default-Value für darkMode
    Storage.savePropertyInLocalStorage(
      'darkMode',
      Storage.getPropertyFromLocalStorage('darkMode', this.darkMode)
    );
  }

  /**
   * Erstellt die Entfernungs-Ringe sowie die
   * Anzeige der Feeder-Postion (Default-Zentrum: Site-Position)
   */
  private createRangeRingsAndSitePos(lonLatPosition: []) {
    if (lonLatPosition === null) return;

    this.StaticFeatures.clear();
    this.createRangeRings(lonLatPosition);
    this.createSitePosition();
  }

  private createSitePosition() {
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

    const feature = new Feature(
      new Point(olProj.fromLonLat(Globals.SitePosition))
    );
    feature.setStyle(antennaStyle);
    this.StaticFeatures.addFeature(feature);

    // Erstelle Feature für den aktuellen Geräte-Standort
    this.drawDevicePositionFromLocalStorage();
  }

  private createRangeRings(lonLatPosition) {
    for (let i = 0; i < this.circleDistancesInNm.length; i++) {
      const conversionFactor = 1852.0; // nautical
      const distance = this.circleDistancesInNm[i] * conversionFactor;
      const circle = Helper.makeGeodesicCircle(lonLatPosition, distance, 180);
      circle.transform('EPSG:4326', 'EPSG:3857');
      const featureCircle = new Feature(circle);

      // Style des Rings
      let circleStyle = new Style({
        stroke: new Stroke({
          color: this.darkStaticFeatures ? 'black' : 'white',
          width: this.darkStaticFeatures ? 1 : 0.4,
        }),
        text: new Text({
          font: '10px Roboto',
          fill: new Fill({
            color: this.darkStaticFeatures ? 'black' : 'white',
          }),
          offsetY: -8,
          text: this.circleDistancesInNm[i] + ' nm',
        }),
      });

      // Fuege Ring zu StaticFeatures hinzu
      featureCircle.setStyle(circleStyle);
      this.StaticFeatures.addFeature(featureCircle);
    }
  }

  /**
   * Erstellt die Map mit der aktuellen Feeder-Position
   * als Mittelpunkt
   */
  private createBaseMap() {
    // Verhindere Rotation beim Pinch to Zoom-Gesten
    const interactions = olInteraction.defaults({
      altShiftDragRotate: false,
      pinchRotate: false,
    });

    // Erstelle Maßstabs-Anzeige mit nautischen Meilen
    const control = new ScaleLine({
      units: 'nautical',
    });

    // Erstelle eingeklappte Attribution
    const attribution: Attribution = new Attribution({
      collapsible: true,
      collapsed: true,
      tipLabel:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>  contributors.',
    });

    this.createOLMap(interactions, control, attribution);
  }

  private createOLMap(
    interactions: Collection<olInteraction.Interaction>,
    control: ScaleLine,
    attribution: Attribution
  ) {
    let center, zoom;

    let lastCenterPosition = Storage.getPropertyFromLocalStorage(
      'lastCenterPosition',
      undefined
    );
    if (lastCenterPosition)
      lastCenterPosition = olProj.fromLonLat(lastCenterPosition);

    const lastCenterZoomLevel = Storage.getPropertyFromLocalStorage(
      'lastCenterZoomLevel',
      undefined
    );

    if (lastCenterPosition && lastCenterZoomLevel) {
      center = lastCenterPosition;
      zoom = lastCenterZoomLevel;
    } else {
      center = olProj.fromLonLat(Globals.SitePosition);
      zoom = Globals.zoomLevel;
    }

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
        center: center,
        zoom: zoom,
        multiWorld: true,
      }),
    });
  }

  private createVectorLayer(
    source: Vector<Geometry>,
    zIndex: number,
    declutter: boolean,
    renderBuffer: number | undefined,
    tags: {},
    style?: StyleLike | null | undefined,
    minZoom?: number | undefined
  ): VectorLayer<Vector<Geometry>> {
    const layer = new VectorLayer({
      source: source,
      zIndex: zIndex,
      declutter: declutter,
      renderBuffer: renderBuffer,
      style: style,
      minZoom: minZoom,
    });

    return this.addTagsToLayer(layer, tags);
  }

  private createLayerGroup(
    layers: BaseLayer[] | Collection<BaseLayer> | undefined,
    zIndex: number | undefined,
    tags: {}
  ) {
    const layerGroup = new LayerGroup({
      layers: layers,
      zIndex: zIndex,
    });

    return this.addTagsToLayer(layerGroup, tags);
  }

  private addTagsToLayer(layer: any, tags: {}): any {
    if (!tags) return layer;

    for (const key in tags) {
      if (tags.hasOwnProperty(key)) layer.set(key, tags[key]);
    }
    return layer;
  }

  /**
   * Erstellt die einzelnen Layer für die Maps
   */
  private createLayers() {
    const renderBuffer = 80;

    // Fuege Layer fuer Plane-Label-Features hinzu
    this.planeLabelFeatureLayer = this.createVectorLayer(
      this.PlaneLabelFeatures,
      200,
      false,
      renderBuffer,
      { name: 'plane_labels', type: 'overlay', title: 'plane labels' },
      this.planeLabelStyle
    );
    this.layers.push(this.planeLabelFeatureLayer);

    // Erstelle Layer fuer Trails der Flugzeuge als Layer-Group
    const trailLayers = this.createLayerGroup(Globals.trailGroup, 150, {
      name: 'ac_trail',
      type: 'overlay',
      title: 'aircraft trails',
    });
    this.layers.push(trailLayers);

    // Fuege Layer fuer POMDs hinzu
    const pomdLayer = this.createVectorLayer(
      Globals.POMDFeatures,
      130,
      false,
      renderBuffer,
      { name: 'pomd_positions', type: 'overlay', title: 'POMD positions' },
      undefined
    );
    this.layers.push(pomdLayer);

    // Fuege Layer fuer Linie vom Zielort zum Flugzeug und vom Flugzeug zum Herkunftsort hinzu
    const routeLayer = this.createVectorLayer(
      this.RouteFeatures,
      125,
      false,
      renderBuffer,
      { name: 'ac_route', type: 'overlay' },
      new Style({
        stroke: new Stroke({
          color: '#EAE911',
          width: 2,
          lineDash: [0.2, 5],
        }),
      })
    );
    this.layers.push(routeLayer);

    // Fuege Layer zum Zeichnen der Geräte-Position hinzu
    this.drawLayer = this.createVectorLayer(
      this.DrawFeature,
      110,
      false,
      renderBuffer,
      { name: 'device_position', type: 'overlay' },
      new Style({})
    );
    this.layers.push(this.drawLayer);

    // Fuege Layer fuer Actual-Outline-Features hinzu
    this.actualOutlineFeatureLayer = this.createVectorLayer(
      this.ActualOutlineFeatures,
      101,
      false,
      renderBuffer,
      {
        name: 'actualRangeOutline',
        type: 'overlay',
        title: 'actual range outline',
      },
      new Style({
        fill: undefined,
        stroke: new Stroke({
          color: '#00596b',
          width: 1.7,
          lineDash: undefined,
        }),
      })
    );
    this.layers.push(this.actualOutlineFeatureLayer);

    // Fuege Layer fuer Range-Ringe und Feeder-Position hinzu
    const staticFeaturesLayer = this.createVectorLayer(
      this.StaticFeatures,
      100,
      false,
      renderBuffer,
      {
        name: 'site_pos',
        type: 'overlay',
        title: 'site position and range rings',
      },
      undefined
    );
    this.layers.push(staticFeaturesLayer);

    // Fuege Layer fuer Range Data hinzu
    this.rangeDataLayer = this.createVectorLayer(
      this.RangeDataFeatures,
      50,
      false,
      renderBuffer,
      { name: 'range_data', type: 'overlay' },
      undefined
    );
    this.layers.push(this.rangeDataLayer);

    // Fuege Layer fuer Icons der Flughäfen hinzu
    this.airportLayer = this.createVectorLayer(
      this.AirportFeatures,
      10,
      false,
      renderBuffer,
      { name: 'ap_positions', type: 'overlay', title: 'airport positions' },
      undefined
    );
    this.layers.push(this.airportLayer);

    // Fuege Layer fuer AIS-Label-Features hinzu
    this.aisLabelFeatureLayer = this.createVectorLayer(
      this.AisLabelFeatures,
      25,
      true,
      renderBuffer,
      { name: 'ais_labels', type: 'overlay', title: 'ais labels' },
      this.aisLabelStyle
    );
    this.layers.push(this.aisLabelFeatureLayer);

    // Fuege Layer fuer AIS-Features hinzu
    this.aisFeatureLayer = this.createVectorLayer(
      this.AisFeatures,
      20,
      false,
      renderBuffer,
      { name: 'ais_positions', type: 'overlay', title: 'ais positions' },
      this.aisMarkerStyle
    );
    this.layers.push(this.aisFeatureLayer);

    // Fuege Layer fuer AIS-Outline-Features hinzu
    this.aisOutlineFeaturesLayer = this.createVectorLayer(
      this.AisOutlineFeatures,
      15,
      false,
      renderBuffer,
      {
        name: 'ais_outline_positions',
        type: 'overlay',
        title: 'ais outline positions',
      },
      this.aisOutlineStyleFunction,
      this.minZoomAisOutlines
    );
    this.layers.push(this.aisOutlineFeaturesLayer);
  }

  private planeLabelStyle(feature): Style {
    return new Style({
      text: new Text({
        font: 'bold 10px Roboto',
        text: feature.flightId,
        overflow: false,
        offsetY: feature.offsetY,
        offsetX: feature.offsetX,
        stroke: new Stroke({
          color: 'black',
          width: 4,
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
    });
  }

  private aisLabelStyle(feature): Style {
    return new Style({
      text: new Text({
        font: 'bold 10px Roboto',
        text: feature.ship.shipName || feature.ship.mmsi.toString(),
        overflow: false,
        offsetY: 25,
        offsetX: 25,
        stroke: new Stroke({
          color: 'black',
          width: 4,
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
    });
  }

  private aisMarkerStyle(feature): Style {
    const length = (feature.ship.to_bow || 0) + (feature.ship.to_stern || 0);
    const mult =
      length >= 100 && length <= 200 ? 0.9 : length > 200 ? 1.1 : 0.75;

    return new Style({
      image: new Icon({
        src: MapComponent.aisSpritesAll,
        rotation: feature.ship.rot,
        offset: [feature.ship.cx, feature.ship.cy],
        size: [feature.ship.imgSize, feature.ship.imgSize],
        scale: 1 * mult,
        opacity: 1,
      }),
    });
  }

  private aisOutlineStyleFunction(feature): Style {
    const c = '#808080';
    const o = 0.9;

    return new Style({
      fill: new Fill({
        color: `rgba(${parseInt(c.slice(-6, -4), 16)}, ${parseInt(
          c.slice(-4, -2),
          16
        )}, ${parseInt(c.slice(-2), 16)}, ${o})`,
      }),
      stroke: new Stroke({
        color: '#A9A9A9',
        width: 2,
      }),
    });
  }

  /**
   * Initialisiert WebGL beim Start der Anwendung,
   * wenn WebGL vom Browser unterstützt wird
   */
  private initWebglOnStartup() {
    Globals.webgl = this.initWebgl();
    if (!Globals.webgl)
      this.showErrorLogAndSnackBar(
        'WebGL could not be initialized. If this browser does not support WebGL use another browser.'
      );
  }

  /**
   * Prüfe WebGL-Support des Browsers
   */
  browserSupportsWebGl() {
    return Helper.detectWebGL() == 1;
  }

  /**
   * Initialisiert den WebGL-Layer. Sollte die Initialisierung
   * fehlschlagen, wird false zurückgegeben
   */
  private initWebgl() {
    let initSuccessful = false;

    if (Globals.webgl) {
      if (this.webglLayer) {
        return true;
      } else {
        // Versuche WebGL-Layer hinzuzufügen
        initSuccessful = this.addWebglLayer();
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
  private addWebglLayer(): boolean {
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
      this.webglLayer = this.createWebGlPointsLayer(glStyle);

      // Wenn Layer oder Renderer nicht vorhanden ist, returne false
      if (!this.webglLayer || !this.webglLayer.getRenderer()) return false;

      this.webglLayer.set('name', 'webgl_ac_positions');
      this.webglLayer.set('type', 'overlay');
      this.webglLayer.set('title', 'WebGL Aircraft positions');

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

  private createWebGlPointsLayer(
    glStyle: LiteralStyle
  ): WebGLPoints<Vector<Point>> {
    return new WebGLPointsLayer({
      source: Globals.WebglFeatures,
      zIndex: 200,
      style: glStyle,
    });
  }

  /**
   * Initialisieren der Auto-Fetch Methoden mit Intervall
   */
  private initAircraftFetching() {
    // Entfernen aller nicht geupdateten Flugzeuge alle 30 Sekunden
    window.setInterval(this.removeNotUpdatedPlanes, 30000, this);

    // Aufruf der Update-Methode für Flugzeuge alle zwei Sekunden
    window.setInterval(() => {
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );
    }, 2000);
  }

  /**
   * Initiiere Fetch vom Server, nachdem die Karte bewegt wurde
   */
  private fetchAircraftAfterMapMove() {
    if (!this.OLMap) return;

    this.OLMap.on('movestart', () => {
      this.mapIsBeingMoved = true;

      Globals.webgl &&
        Globals.amountDisplayedAircraft > 500 &&
        this.webglLayer?.setOpacity(0.25);
    });

    this.OLMap.on('moveend', () => {
      this.mapIsBeingMoved = false;

      Globals.webgl && this.webglLayer?.setOpacity(1);

      // Aktualisiere Flugzeuge auf der Karte
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      if (this.showAirportsUpdate) {
        // Aktualisiere Flughäfen auf der Karte
        this.updateAirportsFromServer();
      }

      this.saveMapPositionInLocalStorage();
    });
  }

  private saveMapPositionInLocalStorage() {
    if (!this.OLMap) return;

    const lastCenterPosition = olProj.transform(
      this.OLMap.getView().getCenter(),
      'EPSG:3857',
      'EPSG:4326'
    );

    const lastCenterZoomLevel: number = this.OLMap.getView().getZoom();

    Storage.savePropertyInLocalStorage(
      'lastCenterPosition',
      lastCenterPosition
    );
    Storage.savePropertyInLocalStorage(
      'lastCenterZoomLevel',
      lastCenterZoomLevel
    );

    this.sendCurrentZoomLevelToSettings(+lastCenterZoomLevel.toFixed(2));
  }

  private sendCurrentZoomLevelToSettings(zoomLevel: number) {
    if (!this.OLMap) return;
    this.settingsService.setMapZoomLevel(zoomLevel);
  }

  private setMapCenterFromSitePosition(): void {
    if (!Globals.SitePosition || !Globals.zoomLevel || !this.OLMap) return;

    this.OLMap.getView().setCenter(olProj.fromLonLat(Globals.SitePosition));
    this.OLMap.getView().setZoom(Globals.zoomLevel);

    this.saveMapPositionInLocalStorage();
  }

  private getMyExtent(extent): any {
    const bottomLeft = olProj.toLonLat([extent[0], extent[1]]);
    const topRight = olProj.toLonLat([extent[2], extent[3]]);

    return {
      extent: extent,
      minLon: bottomLeft[0],
      maxLon: topRight[0],
      minLat: bottomLeft[1],
      maxLat: topRight[1],
    };
  }

  private getRenderExtent(extra): any {
    extra || (extra = 0);
    const renderBuffer = 60;
    const mapSize = this.OLMap.getSize();
    const over = renderBuffer + extra;
    const size = [mapSize[0] + over, mapSize[1] + over];
    return this.getMyExtent(this.OLMap.getView().calculateExtent(size));
  }

  private calcCurrentMapExtent(): any {
    const size = this.OLMap.getSize();
    const extent = this.getRenderExtent(80);

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
      d1 > d2 ? (maxLon = 180) : (minLon = -180);
    }

    return [minLon, minLat, maxLon, maxLat];
  }

  /**
   * Aktualisiert die Flughäfen vom Server
   */
  private updateAirportsFromServer() {
    if (this.pendingFetchesAirports > 0 || this.mapIsBeingMoved) return;

    const extent = this.calcCurrentMapExtent();
    const zoomLevel = this.OLMap.getView().getZoom();

    if (!this.OLMap && !extent) return;

    this.pendingFetchesAirports += 1;

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
          this.processAirportsUpdate(airportsJSONArray);

          this.pendingFetchesAirports--;
        },
        (error) => {
          this.showErrorLogAndSnackBar(
            'Error updating the airports from the server. Is the server running?'
          );
          this.pendingFetchesAirports--;
        }
      );
  }

  private processAirportsUpdate(airportsJSONArray: any) {
    if (this.showAirportsUpdate) {
      this.AirportFeatures.clear();

      if (airportsJSONArray == null) return;

      for (let i = 0; i < airportsJSONArray.length; i++) {
        const airport = airportsJSONArray[i];
        this.createAirportFeature(airport);
      }
    }
  }

  private createAirportFeature(airport: any) {
    if (!airport) return;

    const airportPoint = new Point(
      olProj.fromLonLat([airport.longitude_deg, airport.latitude_deg])
    );

    const airportFeature: any = new Feature(airportPoint);
    airportFeature.longitude = airport.longitude_deg;
    airportFeature.latitude = airport.latitude_deg;
    airportFeature.elevation_ft = airport.elevation_ft;
    airportFeature.icao = airport.ident;
    airportFeature.iata = airport.iata_code;
    airportFeature.name = airport.name;
    airportFeature.city = airport.municipality;
    airportFeature.type = airport.type;
    airportFeature.featureName = 'AirportDataPoint';

    if (airport.type) {
      const style = Styles.getStyleOfAirportFeature(airport.type);
      airportFeature.setStyle(style);
    }

    this.AirportFeatures.addFeature(airportFeature);
  }

  /**
   * Öffnet eine Snackbar mit einem Text
   * @param message Text, der als Titel angezeigt werden soll
   */
  private openSnackbar(message: string, duration: number) {
    this.snackBar.open(message, 'OK', {
      duration: duration,
    });
  }

  /**
   * Entfernt alle nicht geupdateten Flugzeuge aus
   * verschiedenen Listen und Datenstrukturen
   */
  private removeNotUpdatedPlanes(that: any) {
    if (this.mapIsBeingMoved) return;

    const timeNow = new Date().getTime();
    let aircraft: Aircraft | undefined;
    const length = Globals.PlanesOrdered.length;

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
  private updatePlanesFromServer(
    selectedFeeder: any,
    showIss: boolean,
    showOnlyMilitary: boolean
  ) {
    if (this.pendingFetchesPlanes > 0 || this.mapIsBeingMoved) return;

    const extent = this.calcCurrentMapExtent();

    if (!this.OLMap && !extent) return;

    this.pendingFetchesPlanes += 1;

    const fetchRemote = this.getRemoteNetworkParamter();

    // Mache Server-Aufruf und subscribe (0: lomin, 1: lamin, 2: lomax, 3: lamax)
    this.serverService
      .getPlanesUpdate(
        extent[0],
        extent[1],
        extent[2],
        extent[3],
        selectedFeeder,
        fetchRemote,
        showIss,
        this.aircraft && this.aircraft.isFromRemote == null
          ? this.aircraft.hex
          : null, // hex des markierten Flugzeugs
        showOnlyMilitary
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (planesJSONArray) => {
          this.processPlanesArray(planesJSONArray, extent);
        },
        (error) => {
          this.showErrorLogAndSnackBar(
            'Error updating the planes from the server. Is the server running?'
          );

          // Aktualisiere angezeigte Flugzeug-Zähler
          this.updatePlanesCounter(0);

          this.pendingFetchesPlanes--;
        }
      );
  }

  private processPlanesArray(planesJSONArray: Aircraft[], extent: any) {
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

    this.updateCesiumComponentWithAircraft();

    // Aktualisiere angezeigte Flugzeug-Zähler
    this.updatePlanesCounter(Globals.PlanesOrdered.length);

    this.pendingFetchesPlanes--;
  }

  /**
   * Aktualisiert den Flugzeug-Zähler oben im Tab mit der
   * Anzahl der gefetchten Flugzeuge
   * @param amountFetchedPlanes number
   */
  private updatePlanesCounter(amountFetchedPlanes: number) {
    Globals.amountDisplayedAircraft = amountFetchedPlanes;

    this.titleService.setTitle(
      'Beluga Project  - ' + Globals.amountDisplayedAircraft
    );

    this.toolbarService.updateAircraftCounter(Globals.amountDisplayedAircraft);
  }

  /**
   * Triggert das erstellen oder aktualisieren aller
   * Flugzeuge in dem JSON Array an Flugzeugen
   * @param planesJSONArray Aircraft[]
   */
  private processPlanesUpdate(planesJSONArray: Aircraft[]) {
    for (let i = 0; i < planesJSONArray.length; i++) {
      this.processAircraft(planesJSONArray[i]);
    }
  }

  /**
   * Erstellt oder aktualisiert ein Flugzeug aus JSON-Daten
   */
  private processAircraft(aircraftJSON: Aircraft) {
    let isNewAircraft: boolean = false;

    let hex = aircraftJSON.hex;
    if (!hex) return;

    let aircraft: Aircraft = this.Planes[hex];

    if (!aircraft) {
      ({ aircraft, isNewAircraft } = this.createNewAircraft(
        aircraft,
        aircraftJSON,
        hex,
        isNewAircraft
      ));
    } else {
      aircraft.updateData(aircraftJSON);
    }

    aircraft.updateMarker(!isNewAircraft);

    this.createPlaneLabel(aircraft);

    const isMarkedOnMap =
      this.aircraft != null && aircraft.hex == this.aircraft.hex;
    const isBeingHoveredOnMap =
      this.hoveredAircraftObject &&
      aircraft.hex == this.hoveredAircraftObject.hex;

    if (isMarkedOnMap) {
      if (this.aircraft) this.aircraft.updateTrail();
      this.updateShowRoute();
      this.updateAltitudeChart();
    }

    if (isBeingHoveredOnMap) this.createHoveredAircraft(aircraft);
  }

  private createPlaneLabel(aircraft: Aircraft) {
    if (aircraft && aircraft.labelFeature)
      this.PlaneLabelFeatures.removeFeature(aircraft.labelFeature);
    if (aircraft && aircraft.flightId) {
      const labelFeature: any = aircraft.createLabelFeature();
      this.PlaneLabelFeatures.addFeature(labelFeature);
    }
  }

  private createNewAircraft(
    aircraft: Aircraft,
    aircraftJSON: Aircraft,
    hex: string,
    isNewAircraft: boolean
  ) {
    aircraft = Aircraft.createNewAircraft(aircraftJSON);
    this.Planes[hex] = aircraft;
    Globals.PlanesOrdered.push(aircraft);
    isNewAircraft = true;
    return { aircraft, isNewAircraft };
  }

  /**
   * Holt alle Daten über ein Flugzeug vom Server
   * @param aircraft Flugzeug
   */
  private getAllAircraftData(aircraft: Aircraft) {
    if (!aircraft) return;

    this.serverService
      .getAllAircraftData(
        aircraft.hex,
        aircraft.registration,
        aircraft.isFromRemote == null ? false : true
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (aircraftDataJSONObject) =>
          this.processAllAircraftData(aircraft, aircraftDataJSONObject),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error fetching further aircraft information from the server. Is the server running?'
          )
      );
  }

  private processAllAircraftData(
    aircraft: Aircraft,
    aircraftDataJSONObject: any
  ) {
    if (
      aircraftDataJSONObject &&
      this.aircraft &&
      this.aircraft.hex == aircraft.hex
    ) {
      // Schreibe alle Informationen an markiertes Flugzeug
      this.updateMarkedAircraftWithAllData(aircraftDataJSONObject);
    }
  }

  private updateMarkedAircraftWithAllData(aircraftDataJSONObject: any) {
    if (!this.aircraft) return;

    if (aircraftDataJSONObject[0]) {
      this.aircraft.updateData(aircraftDataJSONObject[0]);
    }

    // Filtere Information über Herkunfts-Ort und Ziel-Ort heraus
    let originJSONInfo;
    let destinationJSONInfo;

    if (aircraftDataJSONObject[1]) {
      originJSONInfo = aircraftDataJSONObject[1];
    }

    if (aircraftDataJSONObject[2]) {
      destinationJSONInfo = aircraftDataJSONObject[2];
    }

    this.setOriginOnMarkedAircraft(originJSONInfo);
    this.setDestinationOnMarkedAircraft(destinationJSONInfo);

    // Setze Information über gesamte Länge der Strecke
    this.aircraft.calcFlightPathLength();
  }

  private setDestinationOnMarkedAircraft(destinationJSONInfo: any) {
    if (!this.aircraft) return;

    if (destinationJSONInfo) {
      if (destinationJSONInfo.municipality) {
        // Wenn Stadt ein '/' enthält, setze nur den erste Teil als Stadt
        this.aircraft.destinationFullTown =
          destinationJSONInfo.municipality.split(' /')[0];
      }

      if (destinationJSONInfo.iata_code) {
        this.aircraft.destinationIataCode = destinationJSONInfo.iata_code;
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
  }

  private setOriginOnMarkedAircraft(originJSONInfo: any) {
    if (!this.aircraft) return;

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
      if (originJSONInfo.latitude_deg && originJSONInfo.longitude_deg) {
        this.aircraft.positionOrg = [
          originJSONInfo.longitude_deg,
          originJSONInfo.latitude_deg,
        ];
      }
    }
  }

  /**
   * Holt den Trail zu einem Flugzeug vom Server,
   * wenn es kein Flugzeug von Airplanes-Live ist
   * @param aircraft Aircraft
   * @param selectedFeeder Ausgewählter Feeder
   */
  private getTrailToAircraft(aircraft: Aircraft, selectedFeeder: any) {
    if (!aircraft) return;

    // Hint: Opensky schickt falsche Trails momentan zurück
    if (this.isRemoteAircraft(aircraft)) {
      this.createEmptyTrailForRemoteAircraft(aircraft);
      return;
    }

    this.serverService
      .getTrail(
        aircraft.hex,
        selectedFeeder,
        this.showOpenskyPlanes ? 'Opensky' : null
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (trailDataJSONObject) =>
          this.processTrail(trailDataJSONObject, aircraft),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error fetching trail of aircraft from the server. Is the server running?'
          )
      );
  }

  private isRemoteAircraft(aircraft: Aircraft) {
    return (
      aircraft.isFromRemote == 'Airplanes-Live' ||
      aircraft.isFromRemote == 'Opensky'
    );
  }

  private processTrail(trailDataJSONObject: any, aircraft: Aircraft) {
    // Weise neue Werte zu (aircraftDataJSONObject[0] = trail data)
    if (
      !trailDataJSONObject ||
      !this.aircraft ||
      this.aircraft.hex != aircraft.hex
    )
      return;

    if (trailDataJSONObject[0]) {
      this.aircraft.aircraftTrailList = trailDataJSONObject[0];
      this.aircraft.makeTrail();
      this.aircraft.setTrailVisibility2d(true);
      this.updateAltitudeChart();
      this.updateCesiumComponentWithAircraft();
    }
  }

  private createEmptyTrailForRemoteAircraft(aircraft: Aircraft) {
    aircraft.makeTrail();
    aircraft.setTrailVisibility2d(true);
    this.updateCesiumComponentWithAircraft();
  }

  private updateAltitudeChart() {
    if (!this.aircraft) return;

    this.settingsService.sendAircraftAltitudeData(
      this.aircraft.aircraftTrailAltitudes
    );
  }

  private resetAllTrails() {
    Globals.trailGroup.forEach((f) => {
      f.set('visible', false);
    });
  }

  private getHexFromClickOnLayer(evt) {
    return evt.map.forEachFeatureAtPixel(
      evt.pixel,
      (feature) => {
        return feature.hex;
      },
      {
        layerFilter: (layer) =>
          layer == this.webglLayer || this.planeLabelFeatureLayer,
        hitTolerance: 5,
      }
    );
  }

  private getFeatureFromClickOnLayer(evt, requiredLayer1, requiredLayer2?) {
    return evt.map.forEachFeatureAtPixel(
      evt.pixel,
      function (feature: any) {
        return feature;
      },
      {
        layerFilter: (layer) => layer == requiredLayer1 || requiredLayer2,
        hitTolerance: 5,
      }
    );
  }

  /**
   * Initialisiert die Klicks auf die Karte, bspw. wenn
   * auf ein Flugzeug oder einen RangePoint geklickt wird
   */
  private initClickOnMap(): void {
    this.OLMap.on('click', (evt: any) => {
      const hex = this.getHexFromClickOnLayer(evt);

      if (hex) {
        this.markOrUnmarkAircraft(hex, false);
        return;
      }

      let featurePoint;

      if (this.rangeDataIsVisible) {
        featurePoint = this.getFeatureFromClickOnLayer(
          evt,
          this.rangeDataLayer
        );
        if (featurePoint && featurePoint.name === 'RangeDataPoint') {
          this.createAndShowRangeDataPopup(featurePoint, evt);
          return;
        }
      }

      if (this.showAirportsUpdate) {
        featurePoint = this.getFeatureFromClickOnLayer(evt, this.airportLayer);
        if (featurePoint && featurePoint.featureName === 'AirportDataPoint') {
          this.createAndShowAirportDataPopup(featurePoint, evt);
          return;
        }
      }

      if (this.showAisData) {
        featurePoint = this.getFeatureFromClickOnLayer(
          evt,
          this.aisFeatureLayer,
          this.aisLabelFeatureLayer
        );
        if (featurePoint && featurePoint.featureName === 'AisDataPoint') {
          this.createAndShowAisDataPopup(featurePoint, evt);
          return;
        }
      }

      // Reset only if no feature point is found
      this.resetClickOnMap();
    });
  }

  private resetClickOnMap() {
    this.resetAllMarkedPlanes();
    this.resetAllTrails();
    this.resetAllDrawnCircles();
    this.showLargeAircraftInfoComponent(false);
    this.resetRangeDataPopup();
    this.unselectAllPlanesInTable();
    this.resetAllDrawnPOMDPoints();
    this.resetAirportDataPopup();
    this.resetAisDataPopup();
    this.show3dMap(false);
  }

  private unselectAllPlanesInTable() {
    this.aircraftTableService.unselectAllPlanesInTable();
  }

  private markOrUnmarkAircraft(hex: string, isRequestFromTable: boolean) {
    let aircraft: Aircraft = this.Planes[hex];
    if (!aircraft) return;

    aircraft.isMarked
      ? this.unmarkAircraftOnMap()
      : this.markAircraftOnMap(aircraft);

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

  private markAircraftOnMap(aircraft: Aircraft) {
    // Setze Zustand auf 'markiert'
    this.resetAllMarkedPlanes();
    this.resetAllTrails();
    this.resetAllDrawnCircles();
    this.resetAllDrawnPOMDPoints();
    this.reset3dEntityCesium();

    aircraft.toggleMarkPlane();

    this.aircraft = aircraft;

    // Prüfe, ob Photo-Url bereits vorhanden ist,
    // wenn nicht starte Anfrage an Server
    if (!this.aircraft.allDataWasRequested) {
      this.aircraft.urlPhotoDirect =
        '../../../assets/placeholder_loading_aircraft_photo.jpg';
      this.getAllAircraftData(aircraft);
      this.getTrailToAircraft(aircraft, this.selectedFeederUpdate);
      this.aircraft.allDataWasRequested = true;
    } else {
      // Hole nur Trail und update 3d-Komponente
      this.getTrailToAircraft(aircraft, this.selectedFeederUpdate);
    }
    this.showLargeAircraftInfoComponent(true);
  }

  private unmarkAircraftOnMap() {
    // Setze Anzeige der Route zurück
    this.showRoute = false;

    // Setze Zustand auf 'unmarkiert'
    this.resetAllMarkedPlanes();
    this.resetAllTrails();
    this.resetAllDrawnCircles();
    this.resetAllDrawnPOMDPoints();

    this.showLargeAircraftInfoComponent(false);
  }

  private reset3dEntityCesium() {
    this.cesiumService.unmarkAircraft();
  }

  private getValueOrDefault(value: any, defaultValue: string = 'N/A'): string {
    return value ?? defaultValue;
  }

  private createAttributes(
    attributesConfig: { key: string; value: any }[]
  ): { key: string; value: string }[] {
    return attributesConfig.map((attr) => ({
      key: attr.key,
      value: this.getValueOrDefault(attr.value),
    }));
  }

  private createAndDisplayPopup(
    elementId: string,
    dataPoint: any,
    evt: any
  ): Overlay {
    const overlay = new Overlay({
      element: document.getElementById(elementId)!,
    });

    const coordinate = dataPoint.getGeometry().getCoordinates();
    overlay.setPosition([
      coordinate[0] + Math.round(evt.coordinate[0] / 40075016) * 40075016,
      coordinate[1],
    ]);

    this.OLMap.addOverlay(overlay);
    return overlay;
  }

  private createAndShowRangeDataPopup(rangePoint: any, evt: any): void {
    const dateToShow = new Date(rangePoint.timestamp).toLocaleString('de-DE', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    this.rangeDataPoint = {
      flightId: this.getValueOrDefault(rangePoint.flightId),
      hex: this.getValueOrDefault(rangePoint.hex),
      attributes: this.createAttributes([
        {
          key: 'Latitude',
          value: rangePoint.x ? `${rangePoint.x} °` : undefined,
        },
        {
          key: 'Longitude',
          value: rangePoint.y ? `${rangePoint.y} °` : undefined,
        },
        { key: 'Type', value: rangePoint.type },
        { key: 'Category', value: rangePoint.category },
        { key: 'Registration', value: rangePoint.registration },
        {
          key: 'Altitude',
          value: rangePoint.altitude ? `${rangePoint.altitude} ft` : undefined,
        },
        {
          key: 'Distance',
          value: rangePoint.distance ? `${rangePoint.distance} km` : undefined,
        },
        { key: 'Feeder', value: rangePoint.feederList },
        { key: 'Source', value: rangePoint.sourceList },
        { key: 'Timestamp', value: dateToShow },
      ]),
    };

    this.rangeDataPopup = this.createAndDisplayPopup(
      'rangeDataPopup',
      rangePoint,
      evt
    );
    this.rangeDataPopupBottomValue = '10px';
    this.showPopupRangeDataPoint = true;
  }

  private createAndShowAirportDataPopup(airportPoint: any, evt: any): void {
    if (!airportPoint) return;

    const elevation = airportPoint.elevation_ft
      ? airportPoint.elevation_ft +
        ' ft / ' +
        (airportPoint.elevation_ft * 0.328084).toFixed(0) +
        ' m'
      : undefined;

    this.airportDataPoint = {
      icao: this.getValueOrDefault(airportPoint.icao),
      featureName: airportPoint.featureName,
      attributes: this.createAttributes([
        { key: 'Elevation', value: elevation },
        { key: 'IATA', value: airportPoint.iata },
        { key: 'City', value: airportPoint.city },
        { key: 'Type', value: airportPoint.type },
        { key: 'Name', value: airportPoint.name },
      ]),
    };

    this.airportDataPopup = this.createAndDisplayPopup(
      'airportDataPopup',
      airportPoint,
      evt
    );
    this.airportDataPopupBottomValue = '10px';
  }

  private createAndShowAisDataPopup(aisDataPoint: any, evt: any): void {
    if (!aisDataPoint) return;

    const shipData = aisDataPoint.ship;
    const getShipDimension = shipData.dimension
      ? shipData.dimension.to_bow +
        shipData.dimension.to_stern +
        ' m ' +
        ' x ' +
        (shipData.dimension.to_port + shipData.dimension.to_starboard) +
        ' m'
      : undefined;

    const getEtaVal = shipData.eta
      ? ('0' + shipData.eta.month).slice(-2) +
        '-' +
        ('0' + shipData.eta.day).slice(-2) +
        ' ' +
        ('0' + shipData.eta.hour).slice(-2) +
        ':' +
        ('0' + shipData.eta.minute).slice(-2)
      : undefined;

    this.aisDataPoint = {
      title: shipData.shipName ?? shipData.mmsi ?? 'N/A',
      link: shipData.mmsi
        ? `https://www.vesselfinder.com/vessels/details/${shipData.mmsi}`
        : null,
      photoUrl: shipData.photoUrl,
      featureName: aisDataPoint.featureName,
      attributes: this.createAttributes([
        { key: 'Status', value: shipData.status },
        { key: 'MMSI', value: shipData.mmsi },
        {
          key: 'IMO',
          value: shipData.imoNumber === 0 ? undefined : shipData.imoNumber,
        },
        { key: 'Class', value: shipData.typeVal },
        { key: 'Destination', value: shipData.destination },
        { key: 'Dimensions', value: getShipDimension },
        { key: 'Type', value: shipData.type },
        { key: 'ETA', value: getEtaVal },
        { key: 'Callsign', value: shipData.callSign },
        {
          key: 'Course',
          value: shipData.cog ? `${shipData.cog} °` : undefined,
        },
        {
          key: 'Speed',
          value: shipData.sog ? `${shipData.sog} kn` : undefined,
        },
        {
          key: 'Heading',
          value: shipData.trueHeading ? `${shipData.trueHeading} °` : undefined,
        },
        {
          key: 'Draught',
          value: shipData.maximumStaticDraught
            ? `${shipData.maximumStaticDraught} m`
            : undefined,
        },
        {
          key: 'Last Signal',
          value:
            shipData.timeUTC?.replace(/\.\d+/, '').replace(' +0000 UTC', '') +
            ' (UTC)',
        },
      ]),
    };

    this.getAisShipPhoto(this.aisDataPoint.link, aisDataPoint);
    this.aisDataPopup = this.createAndDisplayPopup(
      'aisDataPopup',
      aisDataPoint,
      evt
    );
    this.aisDataPopupBottomValue = '10px';
  }

  private getAisShipPhoto(link: string | null, aisDataPoint: any) {
    if (
      link == null ||
      aisDataPoint.ship.mmsi == null ||
      aisDataPoint.ship.photoUrl != null
    )
      return;

    this.serverService
      .getAisPhoto(aisDataPoint.ship.mmsi)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (photoUrlJson) => {
          if (photoUrlJson == null || photoUrlJson == '') return;
          this.aisDataPoint.photoUrl = photoUrlJson.photoUrl.toString();
        },
        (error) => {}
      );
  }

  private resetPopup(
    popup: Overlay | undefined,
    popupBottomValueProperty: string
  ): void {
    if (popup) {
      popup.setPosition(undefined);
      popup.dispose();
    }

    this[popupBottomValueProperty] = '0px';
  }

  private resetAirportDataPopup(): void {
    this.resetPopup(this.airportDataPopup, 'airportDataPopupBottomValue');
    this.airportDataPoint = undefined;
  }

  private resetAisDataPopup(): void {
    this.resetPopup(this.aisDataPopup, 'aisDataPopupBottomValue');
    this.aisDataPopup = undefined;
  }

  private resetRangeDataPopup(): void {
    this.resetPopup(this.rangeDataPopup, 'rangeDataPopupBottomValue');
    this.rangeDataPopup = undefined;
    this.showPopupRangeDataPoint = false;
  }

  private showLargeAircraftInfoComponent(show: boolean) {
    Globals.displayAircraftInfoLarge = show;
  }

  private resetAllMarkedPlanes() {
    for (var hex of Object.keys(this.Planes)) {
      if (this.Planes[hex].isMarked) {
        this.Planes[hex].toggleMarkPlane();
      }
    }
    this.aircraft = null;
  }

  private initHoverOverAircraftIcon() {
    this.OLMap.on('pointermove', (evt: any) => {
      // Verhindere Hovering, wenn Anwendung mobil genutzt wird
      if (evt.dragging || !this.isDesktop) {
        return;
      }

      const feature = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        (feature) => {
          return feature;
        },
        {
          layerFilter: (layer) => layer == this.webglLayer,
          hitTolerance: 5,
        }
      );

      if (feature && feature.hex) {
        this.createSmallInfoBox(evt, feature);
      } else {
        this.OLMap.getTargetElement().style.cursor = '';
        this.hoveredAircraftObject = undefined;
        this.showSmallInfo = false;
      }
    });
  }

  private createSmallInfoBox(evt, feature) {
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
  }

  private createHoveredAircraft(aircraft: Aircraft) {
    this.hoveredAircraftObject = {
      flightId: this.getValueOrDefault(aircraft.flightId),
      hex: this.getValueOrDefault(aircraft.hex),
      attributes: [
        {
          key: 'Altitude',
          value: this.getValueOrDefault(
            typeof aircraft.altitude !== 'undefined'
              ? aircraft.altitude + ' ft'
              : undefined
          ),
        },
        {
          key: 'Speed',
          value: this.getValueOrDefault(
            typeof aircraft.speed !== 'undefined'
              ? aircraft.speed + ' kn'
              : undefined
          ),
        },
        { key: 'Type', value: this.getValueOrDefault(aircraft.type) },
        {
          key: 'Registration',
          value: this.getValueOrDefault(aircraft.registration),
        },
        {
          key: 'Track',
          value: this.getValueOrDefault(
            typeof aircraft.track !== 'undefined'
              ? aircraft.track + ' °'
              : undefined
          ),
        },
        {
          key: 'Last Seen',
          value: this.getValueOrDefault(
            typeof aircraft.lastSeen !== 'undefined'
              ? aircraft.lastSeen + ' s'
              : undefined
          ),
        },
        { key: 'Feeder', value: this.getValueOrDefault(aircraft.feederList) },
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

  receiveToggleShowAircraftRoute($event) {
    this.showRoute = $event;

    if (this.showRoute) {
      this.createAndShowRoute();
    } else {
      this.resetAllDrawnCircles();

      // Setze Center der Map auf die gespeicherte Position zurueck
      if (!this.oldCenterPosition || !this.oldCenterZoomLevel) return;
      this.centerMap(
        this.oldCenterPosition[0],
        this.oldCenterPosition[1],
        this.oldCenterZoomLevel
      );
    }
  }

  private createAndShowRoute() {
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

      this.resetAllDrawnCircles();
      this.drawGreatDistanceCirclesThroughAircraft();

      // Erweitere Karte, damit beide Koordinaten
      // (Herkunfts- und Zielort) angezeigt werden können
      this.extentMapViewToFitCoordiates(
        this.aircraft.positionOrg,
        this.aircraft.positionDest
      );
    }
  }

  private drawGreatDistanceCirclesThroughAircraft() {
    if (
      !this.aircraft ||
      !this.aircraft.position ||
      !this.aircraft.positionOrg ||
      !this.aircraft.positionDest
    )
      return;

    // Linie von Herkunftsort -> Flugzeug
    this.createAndAddCircleToFeature(
      this.aircraft.positionOrg,
      this.aircraft.position
    );
    // Linie von Flugzeug -> Zielort
    this.createAndAddCircleToFeature(
      this.aircraft.position,
      this.aircraft.positionDest
    );
  }

  /**
   * Erstellt eine gekruemmte Linie zwischen
   * startPosition und endPosition
   * @param startPosition Array mit long, lat
   * @param endPosition Array mit long, lat
   */
  private createAndAddCircleToFeature(
    startPosition: number[],
    endPosition: number[]
  ) {
    // Erstelle GreatCircle-Linie
    let greatCircleLine = new LineString(
      olExtSphere.greatCircleTrack(startPosition, endPosition)
    );
    greatCircleLine.transform(
      'EPSG:4326',
      this.OLMap.getView().getProjection()
    );

    // Füge GreatCircle-Linie als neues Feature zu DestCircleFeatures hinzu
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
  private extentMapViewToFitCoordiates(positionOrg: [], positionDest: []) {
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
  private centerMap(long: number, lat: number, zoomLevel: number) {
    this.OLMap.getView().setCenter(
      olProj.transform([long, lat], 'EPSG:4326', 'EPSG:3857')
    );
    this.OLMap.getView().setZoom(zoomLevel);
  }

  /**
   * Löscht alle Linien zwischen Start-Flugzeug-Ziel
   */
  private resetAllDrawnCircles() {
    this.RouteFeatures.clear();
  }

  /**
   * Löscht alle Features aus Globals.POMDFeatures und
   * entfernt bei jedem Flugzeug den POMD-Point
   */
  private resetAllDrawnPOMDPoints() {
    for (var hex of Object.keys(this.Planes)) {
      let aircraft: Aircraft = this.Planes[hex];
      aircraft.clearPOMDPoint();
    }
    Globals.POMDFeatures.clear();
  }

  /**
   * Aktualisiere Route, wenn Flugzeug sich bewegt hat
   */
  private updateShowRoute() {
    if (!this.showRoute) return;

    if (
      !this.aircraft ||
      !this.aircraft.positionOrg ||
      !this.aircraft.positionDest
    )
      return;

    this.resetAllDrawnCircles();

    // Zeichne Route von Herkunftsort zu Flugzeug
    // und vom Flugzeug zum Zielort
    this.drawGreatDistanceCirclesThroughAircraft();
  }

  /**
   * Sortiert und zeichnet alle Range-Data-Objekte in rangeDataJSON auf der
   * Karte als Polygon und als einzelne Punkte zum Anklicken
   * @param rangeDataJSON rangeDataJSON
   */
  drawRangeDataJSONOnMap(rangeDataJSON: any): void {
    if (
      !rangeDataJSON ||
      !rangeDataJSON.length ||
      !this.selectedFeederRangeData ||
      !this.selectedFeederRangeData.length
    ) {
      this.resetAllDrawnRangeDataPoints();
      return;
    }

    const points = this.selectedFeederRangeData.reduce(
      (acc: any[], feeder: string) => {
        const filteredPoints = rangeDataJSON
          .filter((data: any) => data.feederList.includes(feeder))
          .map((data: any) => ({
            x: data.longitude,
            y: data.latitude,
            timestamp: data.timestamp,
            ...data,
          }));

        return acc.concat(filteredPoints);
      },
      []
    );

    const center = points.reduce(
      (acc, point) => {
        acc.x += point.x / points.length;
        acc.y += point.y / points.length;
        return acc;
      },
      { x: 0, y: 0 }
    );

    // Füge Winkel hinzu und sortiere danach
    points.forEach((point) => {
      point.angle =
        (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
    });
    points.sort((a, b) => a.angle - b.angle);

    this.resetAllDrawnRangeDataPoints();

    // Polygon und Punkte auf der Karte
    const pointsForPolygon = points.map((point) => [point.x, point.y]);
    const polygon = new Polygon([pointsForPolygon]);
    polygon.transform('EPSG:4326', 'EPSG:3857');

    const polygonFeature = this.createPolygonFeature(
      polygon,
      'RangeDataPolygon',
      this.darkStaticFeatures
        ? Styles.RangeDataPolygonStyle
        : Styles.RangeDataPolygonStyleWhite
    );
    this.RangeDataFeatures.addFeature(polygonFeature);

    points.forEach((point) => {
      const pointFeature = this.createPointFeature(point);
      this.RangeDataFeatures.addFeature(pointFeature);
    });

    // Setze Styling je nach markierten Booleans
    if (this.markRangeDataByFeeder) this.showRangeDataByFeeder();
    if (this.markRangeDataByHeight) this.showRangeDataByHeight();
  }

  private createPolygonFeature(
    geometry: any,
    name: string,
    style: any
  ): Feature {
    const feature: any = new Feature(geometry);
    feature.name = name;
    feature.setStyle(style);
    return feature;
  }

  private createPointFeature(data: any): Feature {
    const point = new Point(olProj.fromLonLat([data.x, data.y]));
    const feature: any = new Feature(point);
    Object.assign(feature, data); // Zuordnen von Eigenschaften
    feature.name = 'RangeDataPoint';
    feature.setStyle(
      this.darkStaticFeatures
        ? Styles.RangeDataPointStyle
        : Styles.RangeDataPointStyleWhite
    );
    return feature;
  }

  private showRangeDataByFeeder(): void {
    if (!this.rangeDataLayer) return;
    const RangeDataFeatures: any = this.rangeDataLayer
      .getSource()!
      .getFeatures();
    const styleMap = this.listFeeder.reduce((map, feeder) => {
      map[feeder.name] = feeder.styleFeederPoint;
      return map;
    }, {} as Record<string, any>);

    RangeDataFeatures.forEach((feature) => {
      if (feature.name !== 'RangeDataPolygon' && feature.feederList) {
        const feederName = feature.feederList.find((name) => styleMap[name]);
        if (feederName) feature.setStyle(styleMap[feederName]);
        else feature.setStyle(Styles.RangeDataPointStyle);
      }
    });
  }

  private showRangeDataByHeight(): void {
    if (!this.rangeDataLayer) return;
    const RangeDataFeatures: any = this.rangeDataLayer
      .getSource()!
      .getFeatures();

    RangeDataFeatures.forEach((feature) => {
      const { altitude } = feature;
      if (feature.name !== 'RangeDataPolygon' && altitude !== undefined) {
        const color = Markers.getColorFromAltitude(
          altitude,
          false,
          true,
          false,
          false,
          false
        );
        feature.setStyle(
          new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({ color }),
              stroke: new Stroke({ color: 'white', width: 1 }),
            }),
          })
        );
      }
    });
  }

  private resetAllDrawnRangeDataPoints() {
    this.RangeDataFeatures.clear();
  }

  private updateRangeDataFromServer() {
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
          (error) =>
            this.showErrorLogAndSnackBar(
              'Error fetching custom Range-Data from the server. Is the server running?'
            ),
          () => {
            if (this.rangeDataJSON) {
              this.drawRangeDataJSONOnMap(this.rangeDataJSON);
            } else {
              this.resetAllDrawnRangeDataPoints();
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
  private hideRangeDataOverlay(toggleHideRangeData: boolean) {
    // Wenn die Sichtbarkeit der gewünschten bereits entspricht, tue nichts
    if (this.rangeDataLayer.get('visible') === !toggleHideRangeData) {
      return;
    }

    // Verändere Sichtbarkeit des Layers
    // Hinweis: Daten des Layers werden hier nur versteckt und nicht gelöscht!
    this.rangeDataLayer.set('visible', !toggleHideRangeData);
  }

  private toggleDarkModeInRangeData() {
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

      if (this.markRangeDataByHeight) {
        this.showRangeDataByHeight();
      }

      if (this.markRangeDataByFeeder) {
        this.showRangeDataByFeeder();
      }
    }
  }

  private toggleShowAircraftLabels(showAircraftLabel) {
    this.showAircraftLabel = showAircraftLabel;
    Globals.showAircraftLabel = showAircraftLabel;

    this.planeLabelFeatureLayer.setVisible(Globals.showAircraftLabel);
    this.aisLabelFeatureLayer.setVisible(
      Globals.showAircraftLabel && this.OLMap.getView().getZoom() > 11.5
    );
  }

  /**
   * Erstellt und zeigt einen POMD-Point an, je nach Wert des
   * Booleans Globals.showPOMDPoint. Wenn der Boolean false ist,
   * werden alle POMD-Points gelöscht
   */
  private toggleShowPOMDPoints(showPOMDPoint: boolean) {
    this.showPOMDPoint = showPOMDPoint;

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
  private sendInitialSettingsToSettings() {
    this.settingsService.sendReceiveListFeeder(this.listFeeder);
    this.settingsService.sendReceiveAppNameAndVersion([
      Globals.appName,
      Globals.appVersion,
      Globals.appStage,
      Globals.appBuildTime,
    ]);
    this.settingsService.sendReceiveClientIp(Globals.clientIp);
    this.settingsService.sendReceiveOpenskyCredentialsExist(
      Globals.openskyCredentials
    );
    this.settingsService.sendReceiveAisstreamApiKeyExists(
      this.aisstreamApiKeyExists
    );
    this.sendAvailableMapsToSettings();
  }

  /**
   * Prüfe auf Geoapify-API-Key und gebe Liste an verfügbaren Maps
   * an Settings weiter
   */
  private sendAvailableMapsToSettings() {
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

  private markSelectedMapInAvailableMaps(listMaps: any) {
    for (let i = 0; i < listMaps.length; i++) {
      let element = listMaps[i];
      if (this.currentSelectedMapStyle.name == element.name)
        element.isSelected = true;
    }
  }

  private filterRangeDataBySelectedFeeder(selectedFeederArray: any[]) {
    this.selectedFeederRangeData = selectedFeederArray;

    if (this.selectedFeederRangeData)
      this.drawRangeDataJSONOnMap(this.rangeDataJSON);
  }

  private markUnmarkAircraftFromAircraftTable(hexSelectedAircraft: string) {
    if (hexSelectedAircraft)
      this.markOrUnmarkAircraft(hexSelectedAircraft, true);
  }

  /**
   * Entfernt ein Flugzeug aus allen Datenstrukturen
   * (bis auf Globals.PlanesOrdered) und zerstört
   * es am Ende
   * @param aircraft Aircraft
   */
  private removeAircraft(aircraft: Aircraft): void {
    // Entferne Flugzeug aus Planes
    delete this.Planes[aircraft.hex];
    this.removeFeatureFromFeatures(
      this.PlaneLabelFeatures,
      'hex',
      aircraft.hex
    );

    // Entferne Flugzeug als aktuell markiertes Flugzeug, wenn es dieses ist
    if (this.aircraft?.hex == aircraft.hex) this.aircraft = null;

    // Zerstöre Flugzeug
    aircraft.destroy();
  }

  /**
   * Hilfsfunktion, um Flugzeuge basierend auf einer Bedingung zu entfernen.
   * @param shouldRemove Funktion, die bestimmt, ob ein Flugzeug entfernt werden soll.
   */
  private removeAircraftBasedOnCondition(
    shouldRemove: (aircraft: Aircraft) => boolean
  ) {
    let length = Globals.PlanesOrdered.length;

    for (let i = 0; i < length; i++) {
      let aircraft = Globals.PlanesOrdered.shift();

      if (!aircraft) continue;

      // Entscheide, ob entfernt werden soll oder nicht
      if (shouldRemove(aircraft)) {
        this.removeAircraft(aircraft);
      } else {
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  private removeAllRemotePlanes() {
    this.removeAircraftBasedOnCondition(
      (aircraft) =>
        !aircraft.isMarked &&
        aircraft.isFromRemote !== undefined &&
        aircraft.isFromRemote !== null
    );
  }

  private removeAllNotSelectedFeederPlanes(selectedFeeder: string) {
    this.removeAircraftBasedOnCondition(
      (aircraft) =>
        !aircraft.isMarked && !aircraft.feederList.includes(selectedFeeder)
    );
  }

  private removeISSFromPlanes() {
    this.removeAircraftBasedOnCondition(
      (aircraft) => !aircraft.isMarked && aircraft.hex === 'ISS'
    );
  }

  private removeAllNotSelectedPlanes() {
    this.removeAircraftBasedOnCondition((aircraft) => !aircraft.isMarked);
  }

  private removePlanesNotInCurrentExtent(extent) {
    this.removeAircraftBasedOnCondition(
      (aircraft) =>
        !aircraft.isMarked && !this.planeInView(aircraft.position, extent)
    );
  }

  private planeInView(position: number[], extent: any): boolean {
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
  private toggleCenterMapOnIss(centerMapOnIss: boolean) {
    if (!this.showIss) return;

    if (centerMapOnIss) {
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

  private getISSFromServer() {
    this.serverService
      .getISSWithoutExtent()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (IssJSONObject) => this.processISS(IssJSONObject),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error updating the iss without extent from the server. Is the server running?'
          )
      );
  }

  private processISS(IssJSONObject: any) {
    if (!IssJSONObject) return;

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
  }

  /**
   * Erstellt eine Interaktion mit der der aktuelle Geräte-Standort
   * ausgewählt werden kann. Nach einer Auswahl wird die Interaktion
   * wieder gelöscht
   */
  private setCurrentDevicePosition() {
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

      Storage.savePropertyInLocalStorage(
        'coordinatesDevicePosition',
        Globals.DevicePosition
      );

      this.DrawFeature.clear();
      this.drawDevicePositionFromLocalStorage();
    });
  }

  /**
   * Markiert den aktuellen Geräte-Standort auf der Karte
   */
  private drawDevicePositionFromLocalStorage() {
    // Schaue im LocalStorage nach bereits gespeicherten Geräte-Standort
    // nach und erstelle Feature
    if (
      Globals.DevicePosition !== null ||
      localStorage.getItem('coordinatesDevicePosition') !== null
    ) {
      let coordinatesDevicePosition = Storage.getPropertyFromLocalStorage(
        'coordinatesDevicePosition',
        null
      );

      if (coordinatesDevicePosition) {
        // Speichere Koordinaten in globaler Variable ab (lon, lat)
        Globals.DevicePosition = coordinatesDevicePosition;
      } else if (Globals.DevicePosition !== null) {
        coordinatesDevicePosition = Globals.DevicePosition;
      }

      if (
        coordinatesDevicePosition == undefined ||
        coordinatesDevicePosition == null
      )
        return;

      // Lösche bisherige Geräte-Position, wenn diese existiert
      if (
        Globals.DevicePosition !== null ||
        localStorage.getItem('coordinatesDevicePosition') !== null
      ) {
        this.removeFeatureFromFeatures(
          this.StaticFeatures,
          'name',
          'devicePosition'
        );
      }

      let feature = new Feature(
        new Point(olProj.fromLonLat(coordinatesDevicePosition))
      );
      feature.setStyle(Styles.DevicePositionStyle);
      feature.set('name', 'devicePosition');
      this.StaticFeatures.addFeature(feature);
    }
  }

  private deleteDevicePosition() {
    if (
      Globals.DevicePosition !== null ||
      localStorage.getItem('coordinatesDevicePosition') !== null
    ) {
      // Lösche bisherige Geräte-Position, wenn diese existiert
      this.removeFeatureFromFeatures(
        this.StaticFeatures,
        'name',
        'devicePosition'
      );

      localStorage.removeItem('coordinatesDevicePosition');

      // reset
      Globals.DevicePosition = null;
    }
  }

  private removeFeatureFromFeatures(
    vectorFeatures: Vector<Geometry>,
    featureKey: string,
    featureValue: string
  ) {
    if (!vectorFeatures) return;

    const features = vectorFeatures.getFeatures();
    const featuresToRemove = features.filter(
      (feature: { get: (arg: string) => any }) =>
        feature.get(featureKey) === featureValue
    );
    featuresToRemove.forEach((feature) =>
      vectorFeatures.removeFeature(feature)
    );
  }

  /**
   * Erstellt die Range-Ringe mit dem aktuellen Geräte-Standort als
   * Zentrum oder der Antennen-Position als Zentrum (Site-Position)
   * @param rangeRingsToDevicePosition boolean
   */
  private setCenterOfRangeRings(rangeRingsToDevicePosition: boolean) {
    if (rangeRingsToDevicePosition) {
      if (Globals.DevicePosition)
        this.createRangeRingsAndSitePos(Globals.DevicePosition);
    } else {
      // Benutze Antennen-Position als Zentrum (Site-Position)
      this.createRangeRingsAndSitePos(Globals.SitePosition);
    }
  }

  private setLightDarkModeInMap() {
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

  private enableDisableCurrentFilters(filters: [], enable: boolean) {
    for (let i = 0; i < filters.length; i++) {
      this.osmLayer.getFilters()[i].setActive(enable);
    }
  }

  private createOrHideRainViewerRain(showRainViewerRain: boolean) {
    this.showRainViewerRain = showRainViewerRain;

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

  private createOrHideRainViewerClouds(showRainViewerClouds: boolean) {
    this.showRainViewerClouds = showRainViewerClouds;

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

  private removeRainViewerCloudsLayer() {
    this.layers?.remove(this.rainviewerCloudsLayer);
  }

  private createRainViewerCloudsLayer() {
    if (this.layers == undefined) return;

    this.rainviewerCloudsLayer = new TileLayer({
      source: new XYZ({
        url: '',
      }),
      opacity: 0.4,
    });

    this.layers.push(this.rainviewerCloudsLayer);
  }

  private initUpdateRainViewerData() {
    // Update der Rainviewer-Daten alle zwanzig Sekunden automatisch,
    // auch wenn sich Map nicht bewegt
    this.refreshIntervalIdRainviewer = window.setInterval(() => {
      this.makeRequestRainviewerApi();
    }, 20000);
  }

  private stopRequestsToRainviewer() {
    clearInterval(this.refreshIntervalIdRainviewer);
    this.refreshIntervalIdRainviewer = undefined;
  }

  private createRainViewerRainLayer() {
    if (this.layers == undefined) return;

    this.rainviewerRainLayer = new TileLayer({
      source: new XYZ({
        url: '',
      }),
      opacity: 0.4,
    });

    this.layers.push(this.rainviewerRainLayer);
  }

  private removeRainViewerRainLayer() {
    this.layers?.remove(this.rainviewerRainLayer);
  }

  private makeRequestRainviewerApi() {
    this.rainviewerService
      .getRainviewerUrlData()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (rainviewerUrlData) => this.processRainviewerApi(rainviewerUrlData),
        (error) => this.showErrorLogAndSnackBar('Error loading rainviewer data')
      );
  }

  private processRainviewerApi(rainviewerUrlData: any) {
    if (rainviewerUrlData === undefined) return;

    // rain
    let pastRadar: Array<any> = rainviewerUrlData.radar.past;
    // rain (forecast)
    let nowcastRadar: Array<any> = rainviewerUrlData.radar.nowcast;
    // clouds
    let infraredSatellite: Array<any> = rainviewerUrlData.satellite.infrared;

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
  }

  private buildRainViewerUrlRain(pathFromApi: string) {
    return this.buildRainViewerUrl(pathFromApi, 512, 4, 1, 1);
  }

  private buildRainViewerUrlClouds(pathFromApi: string) {
    return this.buildRainViewerUrl(pathFromApi, 512, 0, 0, 0);
  }

  private buildRainViewerUrl(
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

  private updateRainViewerRainForecastLayerUrl() {
    if (this.showRainViewerRainForecast && this.forecastRainPathAndTime) {
      // initial
      this.playRainViewerForecastAnimation();

      this.refreshIntervalIdRainviewerForecast = window.setInterval(() => {
        this.playRainViewerForecastAnimation();
      }, 18000);
    }
  }

  private async playRainViewerForecastAnimation() {
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

  private showRainViewerForecastAnimationFrame(forecastRainPathAndTimeFrame) {
    if (this.showRainViewerRainForecast && this.forecastRainPathAndTime) {
      this.rainviewerRainLayer
        .getSource()
        ?.setUrl(
          this.buildRainViewerUrlRain(forecastRainPathAndTimeFrame.path)
        );
      this.showForecastHintSnackbar(forecastRainPathAndTimeFrame.time);
    }
  }

  private showForecastHintSnackbar(timestampUTC: any) {
    this.openSnackbar(new Date(timestampUTC * 1000).toLocaleTimeString(), 1000);
  }

  private stopRainForecastAnimation() {
    clearInterval(this.refreshIntervalIdRainviewerForecast);
    this.refreshIntervalIdRainviewerForecast = undefined;
    if (this.timeoutHandlerForecastAnimation) {
      for (let i = 0; i < this.timeoutHandlerForecastAnimation.length; i++) {
        clearInterval(this.timeoutHandlerForecastAnimation[i]);
      }
      this.timeoutHandlerForecastAnimation = [];
    }
  }

  private toggleShowAircraftPositions(showAircraftPositions: boolean) {
    this.showAircraftPositions = showAircraftPositions;

    if (this.OLMap && this.layers && this.webglLayer) {
      this.webglLayer.setVisible(this.showAircraftPositions);
    }
  }

  /**
   * Hole gewünschte Karte aus LocalStorage, ansonsten nehme default
   * @returns object mit MapStyle
   */
  private getMapStyleFromLocalStorage() {
    let mapStyle = Storage.getPropertyFromLocalStorage('mapStyle', null);
    return mapStyle !== null
      ? mapStyle[0] // ist object in array
      : Maps.listAvailableFreeMaps[0];
  }

  /**
   * Speichere gewünschte Karte in LocalStorage
   */
  private saveMapStyleInLocalStorage(selectedMapStyle: any) {
    let mapStyle = this.listAvailableMaps.filter(
      (mapStyle) => mapStyle.name == selectedMapStyle
    );
    Storage.savePropertyInLocalStorage('mapStyle', mapStyle);
  }

  private resetCurrentCSSFilter() {
    let currentFilters = this.osmLayer.getFilters();
    this.enableDisableCurrentFilters(currentFilters, false);
  }

  private toggleDimMap(dimMap: boolean) {
    this.shouldDimMap = dimMap;
    this.dimMapIfNecessary();
  }

  private dimMapIfNecessary() {
    if (this.shouldDimMap) {
      this.setLightDarkModeInMap();
    } else {
      this.resetCurrentCSSFilter();
    }
  }

  private showAircraftFromFeeder(selectedFeederUpdate: string[]) {
    this.selectedFeederUpdate = selectedFeederUpdate;

    // Entferne alle Flugzeuge, die nicht vom ausgewählten Feeder kommen
    if (this.selectedFeederUpdate && this.selectedFeederUpdate.length != 0) {
      for (var selectedFeeder in selectedFeederUpdate) {
        this.removeAllNotSelectedFeederPlanes(selectedFeeder);
      }
    } else if (this.selectedFeederUpdate) {
      this.removeAllNotSelectedPlanes();
    }

    // Aktualisiere Flugzeuge vom Server
    this.updatePlanesFromServer(
      this.selectedFeederUpdate,
      this.showIss,
      this.showOnlyMilitary
    );

    // Aktualisiere actual range outline
    this.fetchActualOutline();

    // Aktualisiere Daten des markierten Flugzeugs
    if (this.aircraft) {
      this.getAllAircraftData(this.aircraft);
      this.getTrailToAircraft(this.aircraft, this.selectedFeederUpdate);
    }
  }

  private setNewIconSizeScaleAndRedrawPlanes() {
    if (Globals.webgl) Globals.WebglFeatures.clear();

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

  private show3dMap(show: boolean) {
    Globals.display3dMap = show;
  }

  private updateCesiumComponentWithAircraft() {
    if (this.aircraft && Globals.display3dMap) {
      this.cesiumService.updateAircraft(this.aircraft);
    }
  }

  private removeAllNotMilitaryPlanes() {
    this.removeAircraftBasedOnCondition(
      (aircraft) => !aircraft.isMarked && aircraft.isMilitary != 'Y'
    );
  }

  private showAllTrailsOnMap(showTrailData: boolean) {
    if (this.showTrailData) {
      new Promise(() => this.getAllTrailsFromServer());
    } else {
      if (this.allTrailsLayer) this.removeAllTrailsLayer();
    }
  }

  private removeAllTrailsLayer() {
    this.layers?.remove(this.allTrailsLayer);
    this.allTrailsLayer = undefined;
    Globals.allTrailsGroup.clear();
  }

  private createAllTrailsLayer() {
    if (this.layers == undefined) return;

    this.allTrailsLayer = new LayerGroup({
      layers: Globals.allTrailsGroup,
      zIndex: 140,
    });
    this.allTrailsLayer.set('name', 'all_ac_trail');
    this.allTrailsLayer.set('title', 'all aircraft trails');
    this.allTrailsLayer.set('type', 'overlay');
    this.layers.push(this.allTrailsLayer);
  }

  private getAllTrailsFromServer() {
    this.serverService
      .getAllTrails()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (trailsByHexArray) => {
          if (!trailsByHexArray || trailsByHexArray.length == 0) return;
          new Promise(() => this.processAllTrailsFromServer(trailsByHexArray));
        },
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error getting all trails from the server. Is the server running?'
          )
      );
  }

  private processAllTrailsFromServer(trailsByHexArray: any): Promise<void> {
    this.createAllTrailsLayer();

    for (let trailsByHex of trailsByHexArray) {
      if (!trailsByHex) return Promise.reject();

      let trail = new Trail();
      trail.makeTrail(trailsByHex);
      trail.setTrailVisibility2d(true);
    }

    return Promise.resolve();
  }

  private showHideAltitudeChartElement(showAltitudeChart: boolean) {
    this.showAltitudeChart = showAltitudeChart;

    if (!this.isDesktop) {
      document.getElementById('altitude_chart')!.style.visibility = 'hidden';
    } else {
      if (this.showAltitudeChart) {
        document.getElementById('altitude_chart')!.style.visibility = 'visible';
      } else {
        document.getElementById('altitude_chart')!.style.visibility = 'hidden';
      }
    }
  }

  private getRemoteNetworkParamter(): string | null {
    if (this.showOpenskyPlanes) {
      return 'Opensky';
    } else if (this.showAirplanesLivePlanes) {
      return 'Airplanes-Live';
    } else {
      return null;
    }
  }

  private fetchAisData() {
    const extent = this.calcCurrentMapExtent();
    if (!this.OLMap && !extent) return;

    this.serverService
      .getAisDataInExtent(
        extent[0],
        extent[1],
        extent[2],
        extent[3],
        this.showAisData
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (aisDataJsonArray) => this.processAisData(aisDataJsonArray),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error updating AIS data from the server. Is the server running?'
          )
      );
  }

  private processAisData(aisDataJsonArray: any) {
    if (this.showAisData) {
      // Leere AisFeatures vor jeder Iteration
      this.AisFeatures.clear();
      this.AisLabelFeatures.clear();
      this.AisOutlineFeatures.clear();

      if (aisDataJsonArray != null) {
        for (let i = 0; i < aisDataJsonArray.length; i++) {
          const ship = aisDataJsonArray[i];
          this.createShipOnMap(ship);
        }
      }
    }
  }

  private createShipOnMap(ship: any) {
    Ship.checkAircraftCarrier(ship);
    Ship.getSprite(ship);
    Ship.getNavStatusVal(ship);

    const point = new Point(olProj.fromLonLat([ship.longitude, ship.latitude]));
    let feature: any = new Feature({
      geometry: point,
    });

    feature.ship = ship;
    feature.featureName = 'AisDataPoint';

    // Füge Feature zu AisFeatures und AisLabelFeatures hinzu
    this.AisFeatures.addFeature(feature);
    this.AisLabelFeatures.addFeature(feature);

    this.aisLabelFeatureLayer.setVisible(
      Globals.showAircraftLabel && this.OLMap.getView().getZoom() > 11.5
    );

    if (
      this.OLMap.getView().getZoom() > this.minZoomAisOutlines &&
      ship.trueHeading != null &&
      ship.trueHeading != 511 &&
      ship.dimension != null
    ) {
      var shapeFeature: any = new Feature({
        geometry: Ship.createShipOutlineGeometry(ship),
      });
      shapeFeature.ship = ship;

      // Füge Feature zu AisOutlineFeatures hinzu
      this.AisOutlineFeatures.addFeature(shapeFeature);
    }
  }

  private toggleShowTrailData(showTrailData: boolean) {
    this.showTrailData = showTrailData;
    this.showAllTrailsOnMap(this.showTrailData);
  }

  private setSmallIconSize(smallIconSizeFactor: number) {
    Globals.smallScaleFactorIcons = smallIconSizeFactor;
    this.setNewIconSizeScaleAndRedrawPlanes();
  }

  private setGlobalIconSize(globalIconSizeFactor: number) {
    Globals.globalScaleFactorIcons = globalIconSizeFactor;
    this.setNewIconSizeScaleAndRedrawPlanes();
  }

  private toggleDarkStaticFeatures(darkStaticFeatures: boolean) {
    this.darkStaticFeatures = darkStaticFeatures;
    this.createRangeRingsAndSitePos(
      Globals.DevicePosition ? Globals.DevicePosition : Globals.SitePosition
    );
    this.toggleDarkModeInRangeData();
  }

  private setMapStyle(selectedMapStyle: string) {
    this.saveMapStyleInLocalStorage(selectedMapStyle);
    this.createBaseLayer();
  }

  private toggleDevicePositionAsBasis(devicePositionAsBasis: boolean) {
    Globals.useDevicePositionForDistance = devicePositionAsBasis;

    // Setze Zentrum der Range-Ringe
    this.setCenterOfRangeRings(devicePositionAsBasis);
  }

  private toggleSetCurrentDevicePosition(setDevicePosition: boolean) {
    if (setDevicePosition) {
      this.setCurrentDevicePosition();
    } else {
      this.deleteDevicePosition();
    }
  }

  private toggleWebGl(webgl: boolean) {
    // Setze globalen WebGL-Boolean
    Globals.webgl = webgl;

    // Initialisiert oder deaktiviert WebGL
    // Deaktiviert WegGL, wenn Initialisierung fehlschlägt
    Globals.webgl = this.initWebgl();
  }

  private toggleDarkMode(showDarkMode: boolean) {
    this.darkMode = showDarkMode;
    this.setCenterOfRangeRings(Globals.useDevicePositionForDistance);
  }

  private toggleShowMilitaryPlanes(showMilitaryPlanes: boolean) {
    this.showOnlyMilitary = showMilitaryPlanes;

    if (this.showOnlyMilitary) {
      this.removeAllNotMilitaryPlanes();

      // Aktualisiere Flugzeuge vom Server
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      // Aktualisiere Daten des markierten Flugzeugs
      if (this.aircraft) {
        this.getAllAircraftData(this.aircraft);
      }
    } else {
      this.removeAllNotSelectedPlanes();
    }
  }

  private toggleAirportsUpdate(showAirportsUpdate: boolean) {
    this.showAirportsUpdate = showAirportsUpdate;

    if (this.showAirportsUpdate) {
      this.updateAirportsFromServer();
    } else {
      this.AirportFeatures.clear();
    }
  }

  private toggleIss(showIss: boolean) {
    this.showIss = showIss;

    // Wenn ISS nicht mehr angezeigt werden soll, entferne sie von Liste
    if (!this.showIss) {
      this.removeISSFromPlanes();
    }

    // Aktualisiere Flugzeuge vom Server
    this.updatePlanesFromServer(
      this.selectedFeederUpdate,
      this.showIss,
      this.showOnlyMilitary
    );

    // Aktualisiere Daten des markierten Flugzeugs
    if (this.aircraft) {
      this.getAllAircraftData(this.aircraft);
      this.getTrailToAircraft(this.aircraft, this.selectedFeederUpdate);
    }
  }

  private toggleAisData(showAisData: boolean) {
    this.showAisData = showAisData;

    if (this.showAisData) {
      this.fetchAisIntervalId = window.setInterval(() => {
        this.fetchAisData();
      }, 2000);
    } else {
      window.clearInterval(this.fetchAisIntervalId);
      this.fetchAisData(); // Um Verbindung zu stoppen
      this.AisFeatures.clear();
      this.AisLabelFeatures.clear();
      this.AisOutlineFeatures.clear();
    }
  }

  private toggleAirplanesLivePlanes(showAirplanesLivePlanes: boolean) {
    this.showAirplanesLivePlanes = showAirplanesLivePlanes;

    if (this.showAirplanesLivePlanes) {
      // Aktualisiere Flugzeuge vom Server
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      // Aktualisiere Daten des markierten Flugzeugs
      if (this.aircraft) this.getAllAircraftData(this.aircraft);
    } else {
      this.removeAllRemotePlanes();
    }
  }

  private toggleOpenSkyPlanes(showOpenskyPlanes: boolean) {
    this.showOpenskyPlanes = showOpenskyPlanes;

    if (this.showOpenskyPlanes) {
      // Aktualisiere Flugzeuge vom Server
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      // Aktualisiere Daten des markierten Flugzeugs
      if (this.aircraft) {
        this.getAllAircraftData(this.aircraft);
      }
    } else {
      this.removeAllRemotePlanes();
    }
  }

  private showCustomRangeData(timesAsTimestamps: number[]) {
    this.datesCustomRangeData = timesAsTimestamps;
    this.updateRangeDataFromServer();
  }

  private toggleRangeData(toggleHideRangeData: boolean): void {
    this.rangeDataIsVisible = !toggleHideRangeData;
    this.hideRangeDataOverlay(toggleHideRangeData);
  }

  private toggleFilterRangeDataByHeight(toggleMarkRangeDataByHeight: boolean) {
    this.markRangeDataByHeight = toggleMarkRangeDataByHeight;
    this.showRangeDataByHeight();
  }

  private toggleFilterRangeDataByFeeder(toggleMarkRangeDataByFeeder: boolean) {
    this.markRangeDataByFeeder = toggleMarkRangeDataByFeeder;
    this.showRangeDataByFeeder();
  }

  private showErrorLogAndSnackBar(errorMessage: string) {
    console.error(errorMessage);
    this.openSnackbar(errorMessage, 2000);
  }

  private toggleActualRangeOutline(showActualRangeOutline: boolean): void {
    this.showActualRangeOutline = showActualRangeOutline;

    if (this.showActualRangeOutline) {
      this.fetchActualOutline();
      this.fetchActualOutlineIntervalId = window.setInterval(() => {
        this.fetchActualOutline();
      }, 10000);
    } else {
      window.clearInterval(this.fetchActualOutlineIntervalId);
      this.ActualOutlineFeatures.clear();
    }
  }

  private fetchActualOutline() {
    this.serverService
      .urlGetActualRangeOutline(this.selectedFeederUpdate)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (rangeDataJson) => this.processActualRangeOutline(rangeDataJson),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error updating actual range outline from the server. Is the server running?'
          )
      );
  }

  private processActualRangeOutline(rangeDataPoints: any): void {
    this.ActualOutlineFeatures.clear();

    if (!rangeDataPoints) return;

    let geom;
    let lastLon;
    for (let p = 0; p < rangeDataPoints.length; ++p) {
      const lat = rangeDataPoints[p].latitude;
      const lon = rangeDataPoints[p].longitude;
      const proj = olProj.fromLonLat([lon, lat]);
      if (!geom || (lastLon && Math.abs(lon - lastLon) > 270)) {
        geom = new LineString([proj]);
        this.ActualOutlineFeatures.addFeature(new Feature(geom));
      } else {
        geom.appendCoordinate(proj);
      }
      lastLon = lon;
    }
  }
}
