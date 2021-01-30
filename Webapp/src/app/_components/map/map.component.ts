import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import OSM from 'ol/source/OSM';
import * as olProj from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import { Group as LayerGroup } from 'ol/layer';
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
import { ScaleLine, defaults as defaultControls } from 'ol/control';
import { AircraftTableService } from 'src/app/_services/aircraft-table-service/aircraft-table-service.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  // Distanzen fuer darzustellende Ringe (in nm)
  circleDistancesInNm: number[] = [];

  // Open Layers Karte
  OLMap: any;

  // Open Layers Layer auf Karte
  layers: any[] = [];

  // Entfernungs-Ringe und Feeder-Position als Features
  StaticFeatures = new Vector();

  // Objekt mit allen Flugzeugen
  Aircrafts: Aircraft[] = [];

  // Liste mit JSON-Flugzeug-Objekten vom Server
  aircraftJSONArray: Aircraft[] = [];

  // Layer der Trails
  trailLayers = new LayerGroup();

  // Boolean zum Anzeigen der ShortInfo beim Hovern
  public showSmallInfo = false;

  // Positions-Werte für die SmallInfoBox (initialisiert mit Default-Werten)
  public topValue = 60;
  public leftValue = 40;

  // Aktuell angeklicktes Aircraft
  aircraft!: Aircraft;

  // Aktuell gehovertes Aircraft
  hoveredAircraft!: Aircraft;

  // Boolean, in welchem Modus sich die Anwendung befindet
  isDesktop: boolean | undefined;

  // Photo-Urls vom Server
  // (Link zum Foto direkt und zur Website mit Foto)
  photoUrlArray: string[] | undefined;

  // ISS als JSON-Objekt vom Server
  issJSONObject: any;

  // AircraftData als JSON-Objekt vom Server
  aircraftDataJSONObject: any;

  // AirportData als JSON-Objekt vom Server
  airportDataJSONObject: any;

  // Route als Kurve zum Zielort als Features
  RouteFeatures = new Vector();

  // Zeige Route zwischen Start-Flugzeug-Ziel an
  showRoute: any;

  // Gespeicherte Position des Mittelpunkts der Karte
  oldCenterPosition: any;

  // RangeData als Features
  RangeDataFeatures = new Vector();

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

  // RangeData vom Server (für bestimmte Zeitspanne)
  rangeDataCustomJSON: any;

  // Layer für Range Data
  rangeDataLayer!: VectorLayer;

  // Boolean, ob RangeData nach Feeder farblich sortiert sein soll
  bMarkRangeDataByFeeder: boolean = false;

  // Boolean, ob RangeData nach Höhe farblich sortiert sein soll
  bMarkRangeDataByHeight: boolean = false;

  // Default Fill und Stroke für default Style der RangeData-Points
  defaultFill = new Fill({
    color: 'rgba(255,255,255,0.4)',
  });
  defaultStroke = new Stroke({
    color: '#3399CC',
    width: 1.25,
  });

  // default Style für RangeData-Points
  defaultStyle = new Style({
    image: new Circle({
      fill: this.defaultFill,
      stroke: this.defaultStroke,
      radius: 5,
    }),
    fill: this.defaultFill,
    stroke: this.defaultStroke,
  });

  // Array mit Feedern aus Konfiguration
  listFeeder: Feeder[] = [];

  // Info über Fehler, wenn Konfiguration nicht geladen
  // werden kann und das Programm nicht startet
  infoConfigurationFailureMessage;

  // Bottom-Wert für RangeDataPopup
  // (wenn dieser angezeigt wird, soll dieser auf 10px gesetzt werden)
  rangeDataPopupBottomValue: any = 0;

  // Boolean, ob Flugzeug-Label angezeigt werden sollen
  toggleShowAircraftLabels: boolean = false;

  // Selektierte Feeder, nachdem Range Data selektiert werden soll
  selectedFeederRangeData: any;

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
    private aircraftTableService: AircraftTableService
  ) {
    // Zeige Range Data zwischen Zeitstempeln
    settingsService.timesAsTimestamps$.subscribe((timesAsTimestamps) => {
      if (timesAsTimestamps) {
        this.datesCustomRangeData = timesAsTimestamps;
        this.receiveShowAllCustomRangeData();
      }
    });

    // Toggle verstecke Range Data
    settingsService.toggleHideRangeData$.subscribe((toggleHideRangeData) => {
      this.hideRangeDataOverlay(toggleHideRangeData);
    });

    // Toggle markiere Range Data nach Feeder
    settingsService.toggleMarkRangeDataByFeeder$.subscribe(
      (toggleMarkRangeDataByFeeder) => {
        this.bMarkRangeDataByFeeder = toggleMarkRangeDataByFeeder;
        this.markRangeDataByFeeder();
      }
    );

    // Toggle markiere Range Data nach Höhe
    settingsService.toggleMarkRangeDataByHeight$.subscribe(
      (toggleMarkRangeDataByHeight) => {
        this.bMarkRangeDataByHeight = toggleMarkRangeDataByHeight;
        this.markRangeDataByHeight();
      }
    );

    // Toggle zeige Flugzeug-Labels
    settingsService.toggleShowAircraftLabels$.subscribe(
      (toggleShowAircraftLabels) => {
        this.toggleShowAircraftLabels = toggleShowAircraftLabels;
        this.receiveToggleShowAircraftLabels();
      }
    );

    // Filtere Range Data nach selektiertem Feeder
    settingsService.selectedFeeder$.subscribe((selectedFeederArray) => {
      this.selectedFeederRangeData = selectedFeederArray;
      this.filterRangeDataBySelectedFeeder();
    });

    // Markiere/Entmarkiere ein Flugzeug, wenn es in der Tabelle ausgewählt wurde
    aircraftTableService.hexMarkUnmarkAircraft$.subscribe(
      (hexMarkUnmarkAircraft) => {
        this.markUnmarkAircraftFromAircraftTable(hexMarkUnmarkAircraft);
      }
    );
  }

  /**
   * Einstiegspunkt
   */
  ngOnInit(): void {
    // Hole Konfiguration vom Server, wenn diese nicht vorhanden ist, breche ab
    this.getConfiguration();
  }

  startProgram() {
    // Initialisiere Map
    this.initMap();

    // Initialisiere Beobachtung
    // des Anwendungsmoduses
    this.initBreakPointObserver();

    // Initialisiere Update-Aircraft-Funktion
    this.fetchAircraftAndIss();

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
   * Variablen vorhanden und gesetzt sind, starte das eigentliche Programm
   */
  getConfiguration() {
    this.serverService.getConfigurationData().subscribe(
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
          this.listFeeder.length != 0)
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
    // Erstelle Entfernungs-Ringe und Feeder-Position
    this.createRangeRingeAndSitePos();

    // Erstelle Layer
    this.createLayer();

    // Erstelle Map
    this.createMap();
  }

  /**
   * Beobachtet den Modus der Anwendung (Desktop/Mobile)
   * und setzt die Variable isDesktop entsprechend
   */
  initBreakPointObserver() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
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
   * Erstellt die Entfernungs-Ringe sowie die
   * Anzeige der Feeder-Postion
   */
  createRangeRingeAndSitePos() {
    this.StaticFeatures.clear();

    // Erstelle fuer jede CircleDistance einen Kreis
    for (let i = 0; i < this.circleDistancesInNm.length; i++) {
      // nautical
      let conversionFactor = 1852.0;

      let distance = this.circleDistancesInNm[i] * conversionFactor;
      let circle = Helper.make_geodesic_circle(
        Globals.SitePosition,
        distance,
        180
      );
      circle.transform('EPSG:4326', 'EPSG:3857');
      let featureCircle = new Feature(circle);

      // Style des Rings
      let circleStyle = new Style({
        stroke: new Stroke({
          color: 'black',
          width: 1,
        }),
      });

      // Fuege Ring zu StaticFeatures hinzu
      featureCircle.setStyle(circleStyle);
      this.StaticFeatures.addFeature(featureCircle);
    }

    // Erstelle Marker an Feeder-Position und
    // fuege Marker zu StaticFeatures hinzu
    let markerStyle = new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    });

    let feature = new Feature(
      new Point(olProj.fromLonLat(Globals.SitePosition))
    );
    feature.setStyle(markerStyle);
    this.StaticFeatures.addFeature(feature);
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

    // Initialisiere OL Map
    this.OLMap = new Map({
      interactions: interactions,
      controls: defaultControls().extend([control]),
      target: 'map_canvas',
      layers: this.layers,
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
    // Fuege Layer fuer Icons
    // der Flugzeuge hinzu
    let planesLayer: VectorLayer = new VectorLayer({
      source: Globals.PlaneIconFeatures,
      declutter: false,
      zIndex: 200,
      renderBuffer: 20,
    });

    planesLayer.set('name', 'ac_positions');
    planesLayer.set('type', 'overlay');
    planesLayer.set('title', 'Aircraft positions');
    this.layers.push(planesLayer);

    // Erstelle layer fuer Trails der
    // Flugzeuge als Layer-Group
    this.trailLayers = new LayerGroup({
      layers: Globals.trailGroup,
      zIndex: 150,
    });
    this.trailLayers.set('name', 'ac_trail');
    this.trailLayers.set('title', 'Aircraft trails');
    this.trailLayers.set('type', 'overlay');

    this.layers.push(this.trailLayers);

    // Fuege Layer fuer Linie vom Zielort
    // zum Flugzeug und vom Flugzeug zum
    // Herkunftsort hinzu
    let routeLayer: VectorLayer = new VectorLayer({
      source: this.RouteFeatures,
      style: new Style({
        stroke: new Stroke({
          color: '#EAE911',
          width: 2,
          lineDash: [0.2, 5],
        }),
      }),
      zIndex: 125,
      visible: true,
    });
    routeLayer.set('name', 'ac_route');
    routeLayer.set('type', 'overlay');
    this.layers.push(routeLayer);

    // Fuege Layer fuer Range-Ringe
    // und Feeder-Position hinzu
    let staticFeaturesLayer: VectorLayer = new VectorLayer({
      source: this.StaticFeatures,
      visible: true,
      zIndex: 100,
    });
    staticFeaturesLayer.set('name', 'site_pos');
    staticFeaturesLayer.set('type', 'overlay');
    staticFeaturesLayer.set('title', 'Site position and range rings');
    this.layers.push(staticFeaturesLayer);

    // Fuege Layer fuer Range Data hinzu
    this.rangeDataLayer = new VectorLayer({
      source: this.RangeDataFeatures,
      visible: true,
      zIndex: 50,
    });
    routeLayer.set('name', 'range_data');
    routeLayer.set('type', 'overlay');
    this.layers.push(this.rangeDataLayer);

    // Erstelle osmLayer
    let osmLayer: any = new TileLayer({
      source: new OSM(),
    });

    // Custom filter, damit osmLayer dunkler wird
    // (ehem. in CSS filter: brightness(55%))
    var filter = new Colorize();
    osmLayer.addFilter(filter);
    filter.setFilter({
      operation: 'luminosity',
      value: Globals.luminosityValueMap,
    });

    this.layers.push(osmLayer);
  }

  /**
   * Ruft alle zwei Sekunden die Methoden
   * zum Aktualiseren der Flugzeuge und der ISS auf
   */
  fetchAircraftAndIss() {
    // Aufruf der Update-Methode für Flugzeuge alle zwei Sekunden
    setInterval(() => {
      this.updateAircraftsFromServer();
    }, 2000);

    // Aufruf der Update-Methode für die ISS alle zwei Sekunden
    setInterval(() => {
      this.updateIss();
    }, 2000);
  }

  /**
   * Aktualisiere die Flugzeuge, indem eine Anfrage
   * an den Server gestellt wird
   */
  updateAircraftsFromServer() {
    this.serverService.getAircraftsUpdate().subscribe(
      (aircrafts) => {
        this.aircraftJSONArray = aircrafts;
      },
      (error) => {
        console.log(
          'Error updating the planes from the server. Is the server running?'
        );
      },
      () => {
        if (this.aircraftJSONArray) {
          for (let i = 0; i < this.aircraftJSONArray.length; i++) {
            let hex = this.aircraftJSONArray[i].hex;

            // Finde Flugzeug mit Hex-Code in Planes (nicht undefined, wenn vorhanden)
            let aircraft: Aircraft = this.getAircraftFromList(hex);

            // Wenn Flugzeug noch nicht vorhanden ist
            // erstelle Flugzeug aus Listenelement
            if (!aircraft) {
              aircraft = this.createNewAircraft(this.aircraftJSONArray[i]);

              // Fuege Flugzeug zu "Liste" an Objekten hinzu
              this.Aircrafts.push(aircraft);
            }

            if (aircraft) {
              // Update Position (Icon) und Daten des Flugzeugs
              aircraft.updateData(this.aircraftJSONArray[i]);
              aircraft.updateTrail();
              aircraft.updateMarker(true);

              // Update Route, da sich Flugzeug bewegt hat
              this.updateShowRoute();
            }
          }

          // Entferne alle Flugzeuge, die nicht mehr sichtbar sind
          // (d.h. die nicht in der aktualisierten Liste mehr drinn sind)
          let aircraftListHex: any = [];
          for (let i = 0; i < this.aircraftJSONArray.length; i++) {
            aircraftListHex.push(this.aircraftJSONArray[i].hex);
          }
          this.removeNotUpdatedPlanes(aircraftListHex);

          // Zeige die Anzahl der getrackten Flugzeuge im Fenster-Titel an
          this.titleService.setTitle(
            'Beluga Project  - ' + this.aircraftJSONArray.length
          );

          // Aktualisiere Flugzeug-Zähler
          this.toolbarService.updateAircraftCounter(
            this.aircraftJSONArray.length
          );

          // Aktualisierung der Flugzeug-Tabelle
          this.aircraftTableService.updateAircraftList(this.Aircrafts);
        }
      }
    );
  }

  /**
   * Aktualisiere die ISS, indem eine Anfrage
   * an den Server gestellt wird
   */
  updateIss() {
    this.serverService.getIss().subscribe(
      (iss) => {
        this.issJSONObject = iss;
      },
      (error) => {
        console.log(
          'Error updating ISS from the server. Is the server running?'
        );
      },
      () => {
        if (this.issJSONObject) {
          let hex = this.issJSONObject.hex;

          // Finde ISS mit Hex-Code in Flugzeug-Liste (nicht undefined, wenn vorhanden)
          let iss: Aircraft = this.getAircraftFromList(hex);

          // Wenn ISS noch nicht vorhanden ist
          // erstelle ISS aus Element vom Server
          if (!iss) {
            iss = this.createNewAircraft(this.issJSONObject);

            // Weise lokale Photo-Url zu
            iss.urlPhotoDirect = '../../../assets/iss_photo.jpg';

            // Fuege "Flugzeug" zu "Liste" an Objekten hinzu
            this.Aircrafts.push(iss);
          }

          if (iss) {
            // Update Position (Icon) und Daten der ISS
            iss.updateData(this.issJSONObject);
            iss.updateTrail();
            iss.updateMarker(true);
          }
        }
      }
    );
  }

  /**
   * Hole mehr Daten über einen Flughafen vom Server und
   * weise die neuen Daten dem Aircrafts-Objekt zu.
   * Boolean "isOrigin" entscheidet darüber, ob der Wert
   * für "destination" oder für "origin" bestimmt ist
   */
  getAirportData(aircraft: Aircraft) {
    // Beziehe Informationen über Herkunfts-Flughafen
    if (aircraft && aircraft.origin) {
      this.serverService.getAirportData(aircraft.origin).subscribe(
        (airportData) => {
          this.airportDataJSONObject = airportData;
        },
        (error) => {
          console.log(
            'Error fetching further airport information from the server. Is the server running?'
          );
        },
        () => {
          // Weise neue Werte zu
          let airportData = this.airportDataJSONObject;

          // Setze Information über Ort
          if (aircraft && airportData) {
            // Wenn Stadt ein '/' enthält, setze nur den erste Teil als Stadt
            aircraft.originFullTown = airportData.municipality.split(' /')[0];
            aircraft.originIataCode = airportData.iata_code;
          }

          // Setze Information über Position des Herkunfts-Flughafen
          if (
            aircraft &&
            airportData &&
            airportData.latitude_deg &&
            airportData.longitude_deg
          ) {
            aircraft.positionOrg = [
              airportData.longitude_deg,
              airportData.latitude_deg,
            ];
          }
        }
      );
    }

    // Beziehe Informationen über Ziel-Flughafen
    if (aircraft && aircraft.destination) {
      this.serverService.getAirportData(aircraft.destination).subscribe(
        (airportData) => {
          this.airportDataJSONObject = airportData;
        },
        (error) => {
          console.log(
            'Error fetching further airport information from the server. Is the server running?'
          );
        },
        () => {
          // Weise neue Werte zu
          let airportData = this.airportDataJSONObject;

          // Setze Information über Ort
          if (aircraft && airportData) {
            // Wenn Stadt ein '/' enthält, setze nur den erste Teil als Stadt
            aircraft.destinationFullTown = airportData.municipality.split(
              ' /'
            )[0];
            aircraft.destinationIataCode = airportData.iata_code;
          }

          // Setze Information über Position des Ziel-Flughafen
          if (
            aircraft &&
            airportData &&
            airportData.latitude_deg &&
            airportData.longitude_deg
          ) {
            aircraft.positionDest = [
              airportData.longitude_deg,
              airportData.latitude_deg,
            ];
          }
        }
      );
    }
  }

  /**
   * Entfernt alle nicht geupdateten Flugzeuge aus der
   * Flugzeug-Liste Planes sowie aus der Karte
   * @param aircraftListHex Liste mit Hex-Codes der
   * nicht geupdateten Flugzeuge
   */
  removeNotUpdatedPlanes(aircraftListHex: string[]) {
    // Entferne alle nicht geupdateten Flugzeuge
    // in Flugzeug-Liste Aircrafts und lasse dabei die ISS außen vor
    for (let i = 0; i < this.Aircrafts.length; i++) {
      if (
        !aircraftListHex.includes(this.Aircrafts[i].hex) &&
        this.Aircrafts[i].hex !== 'ISS'
      ) {
        // Entferne Marker aus PlaneIconFeatures
        Globals.PlaneIconFeatures.removeFeature(this.Aircrafts[i].marker);

        // Entferne Trail des Flugzeugs
        Globals.trailGroup.forEach((f) => {
          if (f && f.getProperties().hex === this.Aircrafts[i].hex) {
            f.set('visible', false);
            Globals.trailGroup.remove(f);
          }
        });

        // Entferne Flugzeug-Element
        const index = this.Aircrafts.indexOf(this.Aircrafts[i], 0);
        if (index > -1) {
          this.Aircrafts.splice(index, 1);
        }
      }
    }
  }

  /**
   * Erstellt ein neues Flugzeug-Objekt aus einem Aircraft-JSON-Element vom Server
   * @param aircraftJSONElement JSONElement vom Server
   */
  createNewAircraft(aircraftJSONElement: Aircraft): Aircraft {
    return new Aircraft(
      aircraftJSONElement.hex,
      aircraftJSONElement.latitude,
      aircraftJSONElement.longitude,
      aircraftJSONElement.altitude,
      aircraftJSONElement.track,
      aircraftJSONElement.type,
      aircraftJSONElement.registration,
      aircraftJSONElement.onGround,
      aircraftJSONElement.speed,
      aircraftJSONElement.squawk,
      aircraftJSONElement.flightId,
      aircraftJSONElement.verticalRate,
      aircraftJSONElement.rssi,
      aircraftJSONElement.category,
      aircraftJSONElement.temperature,
      aircraftJSONElement.windSpeed,
      aircraftJSONElement.windFromDirection,
      aircraftJSONElement.origin,
      aircraftJSONElement.destination,
      aircraftJSONElement.operatorName,
      aircraftJSONElement.distance,
      aircraftJSONElement.country,
      aircraftJSONElement.autopilotEngaged,
      aircraftJSONElement.elipsoidalAltitude,
      aircraftJSONElement.selectedQnh,
      aircraftJSONElement.selectedAltitude,
      aircraftJSONElement.selectedHeading,
      aircraftJSONElement.lastSeen,
      aircraftJSONElement.feeder,
      aircraftJSONElement.source,
      aircraftJSONElement.fullType,
      aircraftJSONElement.serialNumber,
      aircraftJSONElement.lineNumber,
      aircraftJSONElement.operatorIcao,
      aircraftJSONElement.testReg,
      aircraftJSONElement.registered,
      aircraftJSONElement.regUntil,
      aircraftJSONElement.status,
      aircraftJSONElement.built,
      aircraftJSONElement.firstFlightDate,
      aircraftJSONElement.engines,
      aircraftJSONElement.trailPositions,
      aircraftJSONElement.operatorCallsign,
      aircraftJSONElement.operatorCountry,
      aircraftJSONElement.operatorCountryFlag,
      aircraftJSONElement.operatorIata,
      aircraftJSONElement.regCodeName,
      aircraftJSONElement.regCodeNameFlag,
      aircraftJSONElement.icaoAircraftType,
      aircraftJSONElement.age,
      aircraftJSONElement.aircraftState
    );
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
      let hex = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        function (feature: any) {
          return feature.hex;
        }
      );

      // Hole Feature zur Bestimmung eines RangePoints
      let rangePoint = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        function (feature: any) {
          return feature;
        }
      );

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
        this.unselectAllAircraftsInTable();
      }
    });
  }

  /**
   * Entferne Markierung bei allen selektierten Flugzeugen in der Tabelle
   */
  unselectAllAircraftsInTable() {
    this.aircraftTableService.unselectAllAircraftsInTable();
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
    let aircraft = this.getAircraftFromList(hex);

    if (aircraft) {
      if (aircraft.isMarked) {
        // Setze Anzeige der Route zurück
        this.showRoute = false;

        this.resetAllMarkedPlanes();
        this.resetAllTrails();
        this.resetAllDrawnCircles();
        this.hideLargeAircraftInfoComponent();
      } else {
        this.resetAllMarkedPlanes();
        this.resetAllTrails();
        this.resetAllDrawnCircles();

        aircraft.toggleMarkPlane();
        aircraft.makeTrail();
        aircraft.makeTrailVisible();

        // Setze aktuelles aircraft
        this.aircraft = aircraft;

        // Prüfe, ob Photo-Url bereits vorhanden ist,
        // wenn nicht starte Anfrage an Server
        if (!aircraft.urlPhotoDirect) {
          // Weise Ladebild als Photo zu
          aircraft.urlPhotoDirect =
            '../../../assets/placeholder_loading_aircraft_photo.jpg';

          this.getPhotoUrlFromServer(aircraft);
        }

        // Abfrage weiterer Daten über Ziel- und Herkunfts-
        // flughafen aus der Datenbank an den Server
        this.getAirportData(aircraft);

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
          this.centerMap(aircraft.longitude, aircraft.latitude);
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
      feeder: rangePoint.feeder,
      source: rangePoint.source,
      altitude: rangePoint.altitude,
      hex: rangePoint.hexAircraft,
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
   * Gibt das Flugzeug mit dem Hex-Code aus der Liste Aircrafts zurück
   * @param hex String
   */
  getAircraftFromList(hex: string): Aircraft {
    return this.Aircrafts.find((a) => a && a.hex === hex)!;
  }

  /**
   * Setzt alle markierten Flugzeuge auf 'unmarkiert' zurueck
   */
  resetAllMarkedPlanes() {
    this.Aircrafts.forEach((aircraft) => {
      if (aircraft.isMarked) {
        aircraft.toggleMarkPlane();
      }
    });
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

      let hex = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        function (feature: any) {
          return feature.hex;
        }
      );

      if (hex) {
        this.OLMap.getTargetElement().style.cursor = hex ? 'pointer' : '';

        // Finde gehovertes Flugzeug aus Liste mit Hex
        let aircraft: Aircraft = this.getAircraftFromList(hex);

        // Zeige Daten des aktuellen Flugzeugs in Small Info-Box
        if (aircraft) {
          // Setze Flugzeug als das aktuell gehoverte
          this.hoveredAircraft = aircraft;

          let markerCoordinates;
          markerCoordinates = aircraft.marker.getGeometry().getCoordinates();

          let markerPosition = this.OLMap.getPixelFromCoordinate(
            markerCoordinates
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

        // Verstecke kleine Info-Box
        this.showSmallInfo = false;
      }
    });
  }

  /**
   * Ruft die Photo-Url für das ausgewählte Flugzeug
   * vom Server ab und weißt es dem Flugzeug zu
   * @param aircraft Aicraft
   */
  getPhotoUrlFromServer(aircraft: Aircraft) {
    this.serverService
      .getAircraftPhoto(aircraft.hex, aircraft.registration)
      .subscribe(
        (photoUrlArray) => {
          this.photoUrlArray = photoUrlArray;
        },
        (error) => {
          console.log(
            'Error fetching the photo url from the server. Is the server running?'
          );
        },
        () => {
          // Weise Flugzeug neue Photo-Url zu
          if (this.photoUrlArray) {
            aircraft.urlPhotoDirect = this.photoUrlArray[0];
            aircraft.urlPhotoWebsite = this.photoUrlArray[1];
          } else {
            // Weise 'noPhotoFound' zu, damit Standardfoto im html gesetzt wird
            aircraft.urlPhotoDirect = 'noPhotoFound';
            aircraft.urlPhotoWebsite = 'noPhotoFound';
          }
        }
      );
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
      this.centerMap(this.oldCenterPosition[0], this.oldCenterPosition[1]);
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
    if (this.aircraft.positionOrg && this.aircraft.positionDest) {
      // Speichere alte View-Position der Karte ab
      this.oldCenterPosition = olProj.transform(
        this.OLMap.getView().getCenter(),
        'EPSG:3857',
        'EPSG:4326'
      );

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
   */
  centerMap(long: number, lat: number) {
    this.OLMap.getView().setCenter(
      olProj.transform([long, lat], 'EPSG:4326', 'EPSG:3857')
    );
    this.OLMap.getView().setZoom(Globals.zoomLevel);
  }

  /**
   * Loescht alle Linien zwischen
   * Start-Flugzeug-Ziel
   */
  resetAllDrawnCircles() {
    this.RouteFeatures.clear();
  }

  /**
   * Aktualisiere Route, wenn Flugzeug sich bewegt hat
   */
  updateShowRoute() {
    if (this.showRoute) {
      // Prüfe, ob Positionen des Herkunfts- und
      // Zielorts bekannt sind
      if (this.aircraft.positionOrg && this.aircraft.positionDest) {
        // Lösche alle gesetzten Circles
        this.resetAllDrawnCircles();

        // Zeichne Route von Herkunftsort zu Flugzeug
        // und vom Flugzeug zum Zielort
        this.drawGreatDistanceCirclesThroughAircraft();
      }
    }
  }

  /**
   * Methode holt alle RangeData-Daten vom Server und wandelt sie
   * als Features für den Layer RangeDataFeatures um
   */
  getAllRangeData() {
    this.serverService.getAllRangeData().subscribe(
      (rangeData) => {
        this.rangeDataJSON = rangeData;
      },
      (error) => {
        console.log(
          'Error fetching all RangeData from the server. Is the server running?'
        );
      },
      () => {
        // Erstelle Points aus RangeData-Punkten
        if (this.rangeDataJSON) {
          this.drawRangeDataJSONOnMap(this.rangeDataJSON);
        }
      }
    );
  }

  /**
   * Sortiert und zeichnet alle RangeData-Objekte in rangeDataJSON auf der
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
      // Zeige Range Data aller Feeder an
      for (let i = 0; i < rangeDataJSON.length; i++) {
        points.push({
          x: rangeDataJSON[i].latitude,
          y: rangeDataJSON[i].longitude,
          timestamp: rangeDataJSON[i].timestamp,
          distance: rangeDataJSON[i].distance,
          feeder: rangeDataJSON[i].feeder,
          source: rangeDataJSON[i].source,
          altitude: rangeDataJSON[i].altitude,
          hex: rangeDataJSON[i].hex,
        });
      }
    } else {
      // Selektiere nach ausgewählten Feedern
      for (let feeder of this.selectedFeederRangeData) {
        for (let i = 0; i < this.rangeDataJSON.length; i++) {
          if (this.rangeDataJSON[i].feeder == feeder) {
            points.push({
              x: this.rangeDataJSON[i].latitude,
              y: this.rangeDataJSON[i].longitude,
              timestamp: this.rangeDataJSON[i].timestamp,
              distance: this.rangeDataJSON[i].distance,
              feeder: this.rangeDataJSON[i].feeder,
              source: this.rangeDataJSON[i].source,
              altitude: this.rangeDataJSON[i].altitude,
              hex: this.rangeDataJSON[i].hex,
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
      ({ x, y, timestamp, distance, feeder, source, altitude, hex }) => {
        return {
          x,
          y,
          angle: (Math.atan2(y - center.y, x - center.x) * 180) / Math.PI,
          timestamp,
          distance,
          feeder,
          source,
          altitude,
          hex,
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
    feature.set('name', 'polygon');
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
        feature.feeder = pointsSorted[i].feeder;
        feature.distance = pointsSorted[i].distance;
        feature.source = pointsSorted[i].source;
        feature.altitude = pointsSorted[i].altitude;
        feature.hexAircraft = pointsSorted[i].hex;

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
   * Fragt alle RangeData-Datensätze innerhalb einer Zeitspanne vom
   * Server ab und stellt diese dar
   */
  receiveShowAllCustomRangeData() {
    if (this.datesCustomRangeData) {
      // Frage alle RangeData-Datensätze innerhalb einer
      // Zeitspanne vom Server ab
      this.serverService
        .getRangeDataBetweenTimestamps(
          this.datesCustomRangeData[0],
          this.datesCustomRangeData[1]
        )
        .subscribe(
          (rangeDataJSON) => {
            this.rangeDataJSON = rangeDataJSON;
          },
          (error) => {
            console.log(
              'Error fetching custom RangeData from the server. Is the server running?'
            );
          },
          () => {
            // Stelle gefundene RangeData auf der Karte dar
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
          if (this.listFeeder[i].name == feature.feeder) {
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

        // Setze default-Style für alle Features
        feature.setStyle(this.defaultStyle);
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
          let color = Markers.calcColorFromAltitude(altitude);

          // Style mit neuer Farbe nach Höhe
          let styleWithHeightColor = new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color: color,
              }),
              stroke: new Stroke({
                color: color,
                width: 2,
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

        // Setze default-Style für alle Features
        feature.setStyle(this.defaultStyle);
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

      // Erstelle für jedes Flugzeug aus Aircrafts das Label
      for (let aircraft of this.Aircrafts) {
        aircraft.showLabel();
      }
    } else {
      Globals.showAircraftLabel = false;
      // Verstecke für jedes Flugzeug aus Aircrafts das Label
      for (let aircraft of this.Aircrafts) {
        aircraft.hideLabel();
      }
    }
  }

  /**
   * Sendet die Liste mit Feedern sowie die App-Version und den
   * Namen der App an die SettingsKomponente, damit diese in den
   * Einstellungen angezeigt werden können
   */
  sendInformationToSettings() {
    this.settingsService.sendReceiveListFeeder(this.listFeeder);
    this.settingsService.sendReceiveAppNameAndVersion([
      Globals.appName,
      Globals.appVersion,
    ]);
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
}
