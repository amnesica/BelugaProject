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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Styles } from 'src/app/_classes/styles';
import { SymbolType } from 'ol/style/LiteralStyle';
import { Collection } from 'ol';
import { Draw } from 'ol/interaction';
import GeometryType from 'ol/geom/GeometryType';
import { asString } from 'ol/color';

@Component({
  selector: 'app-map',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  // Openlayers Karte
  OLMap: any;

  // Openlayers Layer auf Karte
  layers!: Collection<any>;

  // Layer für die OSM Map
  osmLayer: any;

  // Layer für Range Data
  rangeDataLayer!: VectorLayer;

  // Layer für Flugzeuge (kein WebGL)
  planesLayer!: VectorLayer;

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
  hoveredAircraft!: Aircraft;

  // Distanzen fuer darzustellende Ringe (in nm)
  circleDistancesInNm: number[] = [];

  // Array mit Feedern aus Konfiguration
  listFeeder: Feeder[] = [];

  // Info über Fehler, wenn Konfiguration nicht geladen
  // werden kann und das Programm nicht startet
  infoConfigurationFailureMessage;

  // Boolean, in welchem Modus sich die Anwendung befindet
  isDesktop: boolean | undefined;

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
  webglLayer: WebGLPoints | undefined;

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

  // Boolean, um große Info-Box beim Klick anzuzeigen (in Globals, da ein
  // Klick auf das "X" in der Komponente die Komponente wieder ausgeblendet
  // werden soll und der Aufruf aus der Info-Komponente geschehen soll)
  get displayAircraftInfo() {
    return Globals.displayAircraftInfoLarge;
  }

  constructor(
    private serverService: ServerService,
    private titleService: Title,
    public breakpointObserver: BreakpointObserver,
    private settingsService: SettingsService,
    private toolbarService: ToolbarService,
    private aircraftTableService: AircraftTableService,
    private snackBar: MatSnackBar
  ) { }

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
    this.settingsService.timesAsTimestamps$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((timesAsTimestamps) => {
        if (timesAsTimestamps) {
          this.datesCustomRangeData = timesAsTimestamps;
          this.receiveShowAllCustomRangeData();
        }
      });

    // Toggle verstecke Range-Data
    this.settingsService.toggleHideRangeData$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleHideRangeData) => {
        this.rangeDataIsVisible = !toggleHideRangeData;
        this.hideRangeDataOverlay(toggleHideRangeData);
      });

    // Toggle markiere Range-Data nach Feeder
    this.settingsService.toggleMarkRangeDataByFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleMarkRangeDataByFeeder) => {
        this.bMarkRangeDataByFeeder = toggleMarkRangeDataByFeeder;
        this.markRangeDataByFeeder();
      });

    // Toggle markiere Range-Data nach Höhe
    this.settingsService.toggleMarkRangeDataByHeight$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleMarkRangeDataByHeight) => {
        this.bMarkRangeDataByHeight = toggleMarkRangeDataByHeight;
        this.markRangeDataByHeight();
      });

    // Toggle zeige Flugzeug-Labels
    this.settingsService.toggleShowAircraftLabels$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleShowAircraftLabels) => {
        this.toggleShowAircraftLabels = toggleShowAircraftLabels;
        this.receiveToggleShowAircraftLabels();
      });

    // Filtere Range-Data nach selektiertem Feeder
    this.settingsService.selectedFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedFeederArray) => {
        this.selectedFeederRangeData = selectedFeederArray;
        this.filterRangeDataBySelectedFeeder();
      });

    // Markiere/Entmarkiere ein Flugzeug, wenn es in der Tabelle ausgewählt wurde
    this.aircraftTableService.hexMarkUnmarkAircraft$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((hexMarkUnmarkAircraft) => {
        this.markUnmarkAircraftFromAircraftTable(hexMarkUnmarkAircraft);
      });

    // Zeige Flugzeuge nach selektiertem Feeder an
    this.settingsService.selectedFeederUpdate$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedFeederUpdate) => {
        this.selectedFeederUpdate = selectedFeederUpdate;

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
      });

    // Toggle Flughäfen auf der Karte
    this.settingsService.showAirportsUpdate$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAirportsUpdate) => {
        this.showAirportsUpdate = showAirportsUpdate;

        if (this.showAirportsUpdate) {
          this.updateAirportsFromServer();
        } else {
          // Lösche alle Flughäfen-Features
          this.AirportFeatures.clear();
        }
      });

    // Zeige Opensky Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showOpenskyPlanes$
      .pipe(takeUntil(this.ngUnsubscribe))
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

    // Zeige ISS und Opensky Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showISS$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showIss) => {
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

    // Toggle DarkMode
    this.settingsService.showDarkMode$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showDarkMode) => {
        this.darkMode = showDarkMode;
        this.setLightDarkModeInMap();
        this.setCenterOfRangeRings(Globals.useDevicePositionForDistance);
        this.toggleDarkModeInRangeData();
      });

    // Toggle POMD-Point
    this.settingsService.showPOMDPoint$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showPOMDPoint) => {
        this.showPOMDPoint = showPOMDPoint;
        this.receiveToggleShowPOMDPoints();
      });

    // Toggle WebGL
    this.settingsService.useWebgl$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((webgl) => {
        // Setze globalen WebGL-Boolean
        Globals.webgl = webgl;

        // Initialisiert oder deaktiviert WebGL
        // Deaktiviert WegGL, wenn Initialisierung fehlschlägt
        Globals.webgl = this.initWebgl();
      });

    this.settingsService.centerMapOnIssSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((centerMapOnIss) => {
        // Zentriere Karte auf die ISS oder gehe zur
        // vorherigen Position zurück
        this.receiveCenterMapOnIss(centerMapOnIss);
      });

    // Bestimme aktuellen Geräte-Standort
    this.settingsService.setCurrentDevicePositionSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.setCurrentDevicePosition();
      });

    // Toggle Geräte-Standort als Basis für versch. Berechnungen (Zentrum für Range-Ringe,
    // Distance- und POMD-Feature-Berechnungen (default: Site-Position ist Zentrum der Range-Ringe)
    this.settingsService.devicePositionAsBasisSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((devicePositionAsBasis) => {
        // Setze Boolean für Distanz-Berechnungen
        Globals.useDevicePositionForDistance = devicePositionAsBasis;

        // Setze Zentrum der Range-Ringe
        this.setCenterOfRangeRings(devicePositionAsBasis);
      });
  }

  ngOnDestroy() {
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
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (configuration) => {
          // Setze Werte aus Konfiguration
          Globals.latFeeder = configuration.latFeeder;
          Globals.lonFeeder = configuration.lonFeeder;
          Globals.scaleIcons = configuration.scaleIcons;

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
              Globals.scaleIcons,
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
    this.createMap();

    // Erstelle Entfernungs-Ringe und Feeder-Position
    // (Default-Zentrum: Site-Position)
    this.createRangeRingsAndSitePos(Globals.SitePosition);
  }

  /**
   * Erstellt den Basis OSM-Layer
   */
  createBaseLayer() {
    this.layers = new Collection();
    let url = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    this.osmLayer = new TileLayer({
      source: new OSM({
        url: url,
        imageSmoothing: false,
      }),
      preload: Infinity,
      useInterimTilesOnError: true,
    });

    this.setLightDarkModeInMap();

    this.layers.push(this.osmLayer);
  }

  /**
   * Beobachtet den Modus der Anwendung (Desktop/Mobile)
   * und setzt die Variable isDesktop entsprechend
   */
  initBreakPointObserver() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
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
          color: this.darkMode ? 'white' : 'black',
          width: this.darkMode ? 0.4 : 1,
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
        src: this.darkMode
          ? '../../assets/antenna_dark.svg'
          : '../../assets/antenna.svg',
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
  createMap() {
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
      maxTilesLoading: Infinity,
      view: new View({
        center: olProj.fromLonLat(Globals.SitePosition),
        zoom: Globals.zoomLevel,
        minZoom: 2,
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
    let pomdLayer: VectorLayer = new VectorLayer({
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
    let routeLayer: VectorLayer = new VectorLayer({
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
      renderOrder: undefined,
      zIndex: 110,
    });
    this.drawLayer.set('name', 'device_position');
    this.drawLayer.set('type', 'overlay');
    this.drawLayer.set('title', 'airport positions');
    this.layers.push(this.drawLayer);

    // Fuege Layer fuer Range-Ringe
    // und Feeder-Position hinzu
    let staticFeaturesLayer: VectorLayer = new VectorLayer({
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

    // Fuege Layer fuer Icons
    // der Flughäfen hinzu
    let airportLayer: VectorLayer = new VectorLayer({
      source: this.AirportFeatures,
      renderOrder: undefined,
      zIndex: 10,
    });
    airportLayer.set('name', 'ap_positions');
    airportLayer.set('type', 'overlay');
    airportLayer.set('title', 'airport positions');
    this.layers.push(airportLayer);
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
          symbolType: SymbolType.IMAGE,
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
      this.webglLayer = new WebGLPoints({
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
    setInterval(this.removeNotUpdatedPlanes, 30000, this);

    // Aufruf der Update-Methode für Flugzeuge alle zwei Sekunden
    setInterval(() => {
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showOpenskyPlanes,
        this.showIss
      );
    }, 2000);

    // Update des Icon-Caches alle 850 ms
    setInterval(this.updateIconCache, 850);
  }

  /**
   * Initiiere Fetch vom Server, nachdem die Karte bewegt wurde
   */
  fetchAircraftAfterMapMove() {
    if (this.OLMap) {
      this.OLMap.on('moveend', () => {
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

  /**
   * Berechnet aktuellen Extent der Karte
   */
  calcCurrentMapExtent(): any {
    // Berechne bounding extent des aktuellen Views
    var extentRaw = this.OLMap.getView().calculateExtent(this.OLMap.getSize());

    // Transformiere bounding extent in Koordinaten
    let extent = olProj.transformExtent(extentRaw, 'EPSG:3857', 'EPSG:4326');

    // unten links
    let x1 = extent[0];
    let y1 = extent[1];

    // oben rechts
    let x2 = extent[2];
    let y2 = extent[3];

    // Prüfe, ob Werte zu groß sind und die initiale Karte somit verlassen wurde
    if (x1 < -179 || x2 > 190) {
      this.openSnackbar(
        'You leaved the initial map. Aircraft and points are not shown at all or only partially on the map.'
      );
    }

    // debug only
    //var zoomLevel = this.OLMap.getView().getZoom();
    // console.log('Zoom: ' + zoomLevel);
    // console.log('x1: ' + x1);
    // console.log('y1: ' + y1);
    // console.log('x2: ' + x2);
    // console.log('y2: ' + y2);

    return extent;
  }

  /**
   * Aktualisiert die Flughäfen vom Server
   */
  updateAirportsFromServer() {
    // Wenn noch auf Fetches gewartet wird, breche ab
    if (this.pendingFetchesAirports > 0) return;

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
                airportFeature.altitude = airport.elevation_ft;
                airportFeature.icao = airport.ident;
                airportFeature.iata = airport.iata_code;
                airportFeature.name = airport.name;
                airportFeature.city = airport.municipality;
                airportFeature.type = airport.type;

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
            'Error updating the airports from the server. Is the server running?'
          );

          // Fetch wurde erfolgreich durchgeführt und ist nicht mehr 'pending'
          this.pendingFetchesAirports--;
        }
      );
  }

  /**
   * Öffnet eine Snackbar mit einem Text für zwei Sekunden
   * @param message Text, der als Titel angezeigt werden soll
   */
  openSnackbar(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 2000,
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
    if (this.pendingFetchesPlanes > 0) return;

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
        showIss
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

          // Aktualisiere Flugzeug-Tabelle mit der globalen Flugzeug-Liste
          this.aircraftTableService.updateAircraftList(Globals.PlanesOrdered);

          // Entferne alle nicht ausgewählten Flugzeuge, wenn eine Route angezeigt wird
          if (this.showRoute) {
            this.removeAllNotSelectedPlanes();
          }

          // Aktualisiere angezeigte Flugzeug-Zähler
          this.updatePlanesCounter(planesJSONArray.length);

          // Fetch wurde erfolgreich durchgeführt und ist nicht mehr 'pending'
          this.pendingFetchesPlanes--;
        },
        (error) => {
          console.log(
            'Error updating the planes from the server. Is the server running?'
          );
          this.openSnackbar(
            'Error updating the planes from the server. Is the server running?'
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
      if (!this.aircraft.isFromOpensky) {
        this.aircraft.updateTrail(this.selectedFeederUpdate);
      }

      // Update Route, da sich Flugzeug bewegt hat
      this.updateShowRoute();
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
            }
          },
          (error) => {
            console.log(
              'Error fetching further aircraft information from the server. Is the server running?'
            );
            this.openSnackbar(
              'Error fetching further aircraft information from the server. Is the server running?'
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
    if (aircraft && !aircraft.isFromOpensky) {
      this.serverService
        .getTrail(aircraft.hex, selectedFeeder)
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
              if (!this.aircraft.isFromOpensky && trailData[0]) {
                this.aircraft.aircraftTrailList = trailData[0];
                this.aircraft.makeTrail();
                this.aircraft.makeTrailVisible();
              }
            }
          },
          (error) => {
            console.log(
              'Error fetching trail of aircraft from the server. Is the server running?'
            );

            this.openSnackbar(
              'Error fetching trail of aircraft from the server. Is the server running?'
            );
          }
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
        (feature, layer) => {
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

      // Setze Boolean 'showRoute' auf false zurück
      this.showRoute = false;

      if (hex) {
        this.markOrUnmarkAircraft(hex, false);
      } else if (rangePoint && rangePoint.name == 'RangeDataPoint') {
        this.createAndShowRangeDataPopup(rangePoint);
      } else {
        this.resetAllMarkedPlanes();
        this.resetAllTrails();
        this.resetAllDrawnCircles();
        this.hideLargeAircraftInfoComponent();
        this.resetRangeDataPopup();
        this.unselectAllPlanesInTable();
        this.resetAllDrawnPOMDPoints();
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

          // Hole Trail
          this.getTrailToAircraft(aircraft, this.selectedFeederUpdate);

          // Merke am Flugzeug, dass Aufruf bereits getätigt wurde
          this.aircraft.allDataWasRequested = true;
        } else {
          // Hole nur Trail
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
  createAndShowRangeDataPopup(rangePoint: any) {
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
      x: rangePoint.x,
      y: rangePoint.y,
      timestamp: dateToShow,
      distance: rangePoint.distance,
      feederList: rangePoint.feederList,
      sourceList: rangePoint.sourceList,
      altitude: rangePoint.altitude,
      hex: rangePoint.hexAircraft,
      flightId: rangePoint.flightId,
      registration: rangePoint.registration,
      type: rangePoint.type,
      category: rangePoint.category,
    };

    // Weise popup als overlay zu (Hinweis: Hier ist 'document.getElementById'
    // nötig, da mit OpenLayers Overlays gearbeitet werden muss, damit Popup
    // an einer Koordinaten-Position bleibt)
    this.rangeDataPopup = new Overlay({
      element: document.getElementById('rangeDataPopup')!,
    });

    // Setze Position des Popups und füge Overlay zur Karte hinzu
    let coordinate = rangePoint.getGeometry().getCoordinates();
    this.rangeDataPopup.setPosition(coordinate);
    this.OLMap.addOverlay(this.rangeDataPopup);

    // Verändere Bottom-Wert für Popup,
    // damit dieser richtig angezeigt wird
    this.rangeDataPopupBottomValue = '10px';

    // Zeige RangeData-Popup an
    this.showPopupRangeDataPoint = true;
  }

  /**
   * Setzt RangeData-Popups zurück und versteckt diese
   */
  resetRangeDataPopup() {
    if (this.rangeDataPopup) {
      this.rangeDataPopup.setPosition(undefined);
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

      if (hex) {
        this.OLMap.getTargetElement().style.cursor = hex ? 'pointer' : '';

        // Finde gehovertes Flugzeug aus Liste mit Hex
        let aircraft: Aircraft = this.Planes[hex];

        // Zeige Daten des aktuellen Flugzeugs in Small Info-Box
        if (aircraft) {
          // Setze Flugzeug als das aktuell gehoverte
          this.hoveredAircraft = aircraft;

          let markerCoordinates;
          markerCoordinates = Globals.webgl
            ? aircraft.glMarker.getGeometry().getCoordinates()
            : aircraft.marker.getGeometry().getCoordinates();

          let markerPosition =
            this.OLMap.getPixelFromCoordinate(markerCoordinates);
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

        // Verstecke kleine Info-Box
        this.showSmallInfo = false;
      }
    });
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
    boundingExtent = olProj.transformExtent(
      boundingExtent,
      olProj.get('EPSG:4326'),
      olProj.get('EPSG:3857')
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
      this.darkMode
        ? Styles.RangeDataPolygonStyleDark
        : Styles.RangeDataPolygonStyle
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
          this.darkMode
            ? Styles.RangeDataPointStyleDark
            : Styles.RangeDataPointStyle
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
              'Error fetching custom Range-Data from the server. Is the server running?'
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
      var RangeDataFeatures = this.rangeDataLayer.getSource().getFeatures();

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
      var RangeDataFeatures = this.rangeDataLayer.getSource().getFeatures();
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
      var RangeDataFeatures = this.rangeDataLayer.getSource().getFeatures();

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
      var RangeDataFeatures = this.rangeDataLayer.getSource().getFeatures();
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
            this.darkMode
              ? Styles.RangeDataPointStyleDark
              : Styles.RangeDataPointStyle
          );
        } else if (feature.get('name') == 'RangeDataPolygon') {
          feature.setStyle(
            this.darkMode
              ? Styles.RangeDataPolygonStyleDark
              : Styles.RangeDataPolygonStyle
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
        },
        (error) => {
          console.log(
            'Error updating the iss without extent from the server. Is the server running?'
          );
          this.openSnackbar(
            'Error updating the iss without extent from the server. Is the server running?'
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
      type: GeometryType.POINT,
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

      let feature = new Feature(new Point(olProj.fromLonLat(coordinates)));
      feature.setStyle(Styles.DevicePositionStyle);
      feature.set('name', 'devicePosition');
      this.StaticFeatures.addFeature(feature);
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

    var currentFilters = this.osmLayer.getFilters();
    this.enableDisableCurrentFilters(currentFilters, false);

    // Custom filter, damit osmLayer dunkler wird
    // (ehem. in CSS filter: brightness(55%))
    if (this.osmLayer.getFilters().length == 3) {
      if (this.darkMode) {
        this.enableDisableCurrentFilters(currentFilters, true);
      } else {
        if (this.osmLayer.getFilters()[2]) {
          // enable only luminosity filter for light mode
          this.osmLayer.getFilters()[2].setActive(true);
        } else {
          console.log("No need for resetting filters. osmLayer.getFilters()[2] does not exist");
        }
      }
    } else {
      if (this.darkMode) {
        this.createNewSepiaFilter();
        this.createNewInvertFilter();
        this.createNewLuminosityFilter('0.25');
      } else {
        this.createNewLuminosityFilter(Globals.luminosityValueMap.toString());
      }
    }
  }

  private createNewLuminosityFilter(brightnessValue: string) {
    var filter = new Colorize();
    filter.setFilter({
      operation: 'luminosity',
      value: brightnessValue,
    });
    this.osmLayer.addFilter(filter);
  }

  private createNewInvertFilter() {
    var filter = new Colorize();
    filter.setFilter('invert');
    this.osmLayer.addFilter(filter);
  }

  private createNewSepiaFilter() {
    var filter = new Colorize();
    filter.setFilter('sepia');
    this.osmLayer.addFilter(filter);
  }

  enableDisableCurrentFilters(filters: [], enable: boolean) {
    for (let i = 0; i < filters.length; i++) {
      this.osmLayer.getFilters()[i].setActive(enable);
    }
  }
}
