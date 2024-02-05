import { Style, Fill, Stroke, Text, Circle } from 'ol/style';
import Icon from 'ol/style/Icon';
import { Helper } from 'src/app/_classes/helper';
import { Markers } from 'src/app/_classes/markers';
import { Globals } from 'src/app/_common/globals';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import * as olProj from 'ol/proj';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import LineString from 'ol/geom/LineString';
import { Styles } from './styles';

/**
 * Klasse, welche ein Aircraft darstellt
 */
export class Aircraft {
  // Daten vom Server
  hex!: string;
  latitude!: number;
  longitude!: number;
  altitude!: number;
  track!: number;
  type!: string;
  registration!: string;
  onGround!: boolean;
  speed!: number;
  squawk!: number;
  flightId!: string;
  verticalRate!: any;
  rssi!: number;
  category!: string;
  temperature!: number;
  windSpeed!: number;
  windFromDirection!: number;
  origin!: string;
  destination!: string;
  operatorName!: string;
  distance!: number; // distance (antenna-pos)
  country!: string;
  autopilotEngaged!: boolean;
  elipsoidalAltitude!: number;
  selectedQnh!: number;
  selectedAltitude!: number;
  selectedHeading!: number;
  lastSeen!: number;
  feederList!: string;
  sourceList!: string;
  fullType!: string;
  serialNumber!: string;
  lineNumber!: string;
  operatorIcao!: string;
  testReg!: string;
  registered!: string;
  regUntil!: string;
  status!: string;
  built!: string;
  firstFlightDate!: string;
  engines!: string;
  aircraftTrailList!: any;
  operatorCallsign!: any;
  operatorCountry!: any;
  operatorCountryFlag!: any;
  operatorIata!: any;
  regCodeName!: any;
  regCodeNameFlag!: any;
  icaoAircraftType!: any;
  age!: any;
  aircraftState!: any;
  isFromRemote!: string;
  roll: any;

  // Daten für Info-Abschnitt PositionOfMinimumDistance
  pomdLatitude!: any;
  pomdLongitude!: any;
  pomdDistanceKm!: any;
  // Estimated Time Of Arrival
  pomdETA!: any;
  pomdRemainingKm!: any;
  pomdRemainingSeconds!: any;
  pomdDirection!: any;

  // Position als Array
  position = [this.longitude, this.latitude];

  // Ist Flugzeug markiert
  isMarked = false;

  // Marker des Flugzeugs (ehem. iconFeature)
  marker: any = null;

  // Stil des Flugzeugs mit SVG und Style
  typeDesignatorAndScaleArray: any = [];
  strokeWidth = 0.4;
  fillColor = '';
  strokeColor = '';
  svgURI = '';
  iconStyle: any = null;

  //Trail des Flugzeugs als Punkte
  trackLinePoints: any; // 2D-Karte
  track3d: any; // Object-Wrapper für 3D-Daten

  // Position des Herkunfts-Flughafens
  // und des Zielflughafens
  positionOrg: any;
  positionDest: any;

  // Trail des Flugzeugs als Feature (2D)
  trail_features: any = null;
  layer: any = null;

  // Trail des Flugzeugs als Feature (Line)
  trail_features3d_line: any = null;
  layer3dLine: any = null;

  // Trail des Flugzeugs als Feature (Bar)
  trail_features3d_bar: any = null;
  layer3dBar: any = null;

  // Url für Flugzeug-Foto
  urlPhotoDirect: any = null;

  // Url zur Website mit Flugzeug-Foto
  urlPhotoWebsite: any = null;

  // Photograph des Flugzeug-Fotos
  photoPhotographer: any = null;

  // Informationen über Flughäfen aus der Datenbank
  destinationFullTown: any;
  originFullTown: any;

  // IATA-Codes
  originIataCode: any;
  destinationIataCode: any;

  // Flugzeug-Label
  labelStyleWasSet: boolean = false;
  labelStyle: Style = new Style();
  offsetY: any;
  offsetX: any;

  // Boolean, ob bereits alle Daten für das Flugzeug abgefragt wurde vom Server
  allDataWasRequested: boolean = false;

  // Zeitpunkt des letzten Updates des Flugzeugs
  lastUpdate: any;

  // Svg-Key Daten
  markerSvgKey: any;
  styleKey: any;

  // Icon und Style des Markers
  markerIcon: any;
  markerStyle!: Style;

  // Shape-Data als Object
  shapeData: any;

  // Scale des Markers
  shapeScale = 0;

  // Roh-Shape Daten aus basemarker[0]
  shapeDesignator: any;

  // Key bestehend aus Type und Category
  typeAndCategoryKey: any;

  // WebGL-Marker des Flugzeugs
  glMarker: any;

  // Openlayers-Point der die aktuelle Position
  // des Flugzeugs darstellt
  olPoint: any;

  // Marker für POMD-Punkt des Flugzeugs
  pomdMarker: any = null;

  // Informationen für PNG-Position und
  // Größe des WebGL-Markers
  pngId: any;
  pngScale: any;

  // Distanz zum Device (Device-Position)
  distanceDevicePos: any = null;

  // Altitude-List für Chart
  aircraftTrailAltitudes: any;

  // Distanzen zum Anzeigen des Flight-Progress
  totalFlightPathInKm: any;
  travelledDistanceInKm: any;
  travelledDistanceInPercent: any;

  // Flight-Progress für 'left' und 'width' css attributes
  flightProgressFlownPath: any;
  flightProgressPlaneIconLeft: any;
  travelDistanceRemainingInKm: any;

  // Special Tags
  isMilitary: any;

  // Konstruktor mit Minimaldaten
  constructor(
    hex: string,
    latitude: number,
    longitude: number,
    altitude: number,
    track: number,
    type: string,
    registration: string,
    speed: number,
    flightId: string,
    distance: number,
    lastSeen: number,
    verticalRate: number,
    feederList: string,
    position: any,
    onGround: boolean,
    rssi: number,
    category: string,
    temperature: number,
    windSpeed: number,
    windFromDirection: number,
    autopilotEngaged: boolean,
    elipsoidalAltitude: number,
    selectedQnh: number,
    selectedAltitude: number,
    selectedHeading: number,
    sourceList: string,
    aircraftState: any,
    isFromRemote: string,
    lastUpdate: any,
    isMilitary: any,
    roll: any
  ) {
    this.hex = hex;
    this.latitude = latitude;
    this.longitude = longitude;
    this.altitude = altitude;
    this.track = track;
    this.type = type;
    this.registration = registration;
    this.speed = speed;
    this.flightId = this.trimFlightId(flightId);
    this.distance = distance;
    this.lastSeen = lastSeen;
    this.verticalRate = verticalRate;
    this.feederList = feederList;
    this.position = position;
    this.onGround = onGround;
    this.rssi = rssi;
    this.category = category;
    this.temperature = temperature;
    this.windSpeed = windSpeed;
    this.windFromDirection = windFromDirection;
    this.autopilotEngaged = autopilotEngaged;
    this.elipsoidalAltitude = elipsoidalAltitude;
    this.selectedQnh = selectedQnh;
    this.selectedAltitude = selectedAltitude;
    this.selectedHeading = selectedHeading;
    this.sourceList = sourceList;
    this.aircraftState = aircraftState;
    this.isFromRemote = isFromRemote;
    this.lastUpdate = lastUpdate;
    this.isMilitary = isMilitary;
    this.roll = roll;
  }

  /**
   * Erstellt ein neues Flugzeug-Objekt aus einem Aircraft-
   * JSON-Element vom Server (mit Minimaldaten)
   * @param aircraftJSONElement JSONElement vom Server
   */
  static createNewAircraft(aircraftJSONElement: Aircraft): Aircraft {
    return new Aircraft(
      aircraftJSONElement.hex,
      aircraftJSONElement.latitude,
      aircraftJSONElement.longitude,
      aircraftJSONElement.altitude,
      aircraftJSONElement.track,
      aircraftJSONElement.type,
      aircraftJSONElement.registration,
      aircraftJSONElement.speed,
      aircraftJSONElement.flightId,
      aircraftJSONElement.distance,
      aircraftJSONElement.lastSeen,
      aircraftJSONElement.verticalRate,
      aircraftJSONElement.feederList,
      [aircraftJSONElement.longitude, aircraftJSONElement.latitude],
      aircraftJSONElement.onGround,
      aircraftJSONElement.rssi,
      aircraftJSONElement.category,
      aircraftJSONElement.temperature,
      aircraftJSONElement.windSpeed,
      aircraftJSONElement.windFromDirection,
      aircraftJSONElement.autopilotEngaged,
      aircraftJSONElement.elipsoidalAltitude,
      aircraftJSONElement.selectedQnh,
      aircraftJSONElement.selectedAltitude,
      aircraftJSONElement.selectedHeading,
      aircraftJSONElement.sourceList,
      aircraftJSONElement.aircraftState,
      aircraftJSONElement.isFromRemote,
      aircraftJSONElement.lastUpdate,
      aircraftJSONElement.isMilitary,
      aircraftJSONElement.roll
    );
  }

  /**
   * Erstellt das dargestellte Flugzeug, indem mit
   * passender Form, Skalierung, Rotation und Farbe
   * (nach Hoehe) ein Flugzeug-Icon erstellt wird
   */
  updateIcon() {
    // Beziehe Farben
    this.fillColor = Markers.getColorFromAltitude(
      this.altitude,
      this.onGround,
      true,
      this.isMarked,
      false,
      false
    );

    // Setze StrokeColor anders, wenn Flugzeug von Remote kommt
    if (this.isFromRemote != null || this.isFromRemote != undefined) {
      this.strokeColor = '#fff';
    } else {
      this.strokeColor = '#000';
    }

    // Initialisiere labelText
    let labelText: any = null;

    // Setze flightId als labelText, wenn dies gewünscht ist
    if (Globals.showAircraftLabel && this.flightId) {
      labelText = this.flightId;
    }

    // Initialisiere svgKey zum Wiederfinden des gecachten Svgs
    let svgKey =
      this.fillColor +
      '!' +
      this.shapeDesignator +
      '!' +
      this.strokeWidth +
      '!' +
      this.strokeColor;

    // Suche nach gecachtem Svg oder erstelle ein neues Svg
    // (ehem. "this.markerSvgKey != svgKey")
    if (
      !Globals.webgl &&
      (this.markerStyle == null ||
        this.markerIcon == null ||
        this.markerSvgKey != svgKey)
    ) {
      if (Globals.iconCache[svgKey] == undefined) {
        let svgURI = Markers.svgShapeToURI(
          this.shapeData,
          this.fillColor,
          this.strokeColor,
          this.strokeWidth
        );

        // Cache Svg
        Globals.addToIconCache.push([svgKey, null, svgURI]);

        if (Globals.amountDisplayedAircraft < 200) {
          this.markerIcon = new Icon({
            scale: this.shapeScale * Globals.globalScaleFactorIcons,
            imgSize: [this.shapeData.w, this.shapeData.h],
            src: svgURI,
            rotation: this.shapeData.noRotate
              ? 0
              : Helper.degreesToRadians(this.track),
          });
        } else {
          svgKey = this.markerSvgKey;
        }
      } else {
        this.markerIcon = new Icon({
          scale: this.shapeScale * Globals.globalScaleFactorIcons,
          imgSize: [this.shapeData.w, this.shapeData.h],
          img: Globals.iconCache[svgKey],
          rotation: this.shapeData.noRotate
            ? 0
            : Helper.degreesToRadians(this.track),
        });
      }
      this.markerSvgKey = svgKey;
    }

    if (!this.markerIcon && !Globals.webgl) return;

    // Initialisiere styleKey zum Wiederfinden des gecachten Styles
    let styleKey =
      (Globals.webgl ? '' : svgKey) + '!' + labelText + '!' + this.shapeScale;

    // Erstelle Style des Markers mit markerIcon und Flugzeug-Label,
    // wenn dies gewünscht ist
    if (this.styleKey != styleKey) {
      this.styleKey = styleKey;
      let style;
      if (labelText) {
        this.setLabelOffsets();

        // Erstelle Style mit Label (Text)
        style = {
          image: this.markerIcon,
          text: new Text({
            font: 'bold 10px Roboto',
            text: labelText,
            offsetY: this.offsetY,
            offsetX: this.offsetX,
            scale: 1.2,
            overflow: false,
            backgroundFill: new Fill({
              color: 'rgba(20, 20, 20, 0.5)',
            }),
            fill: new Fill({
              color: 'white',
            }),
            textAlign: 'center',
            textBaseline: 'middle',
          }),
        };
      } else {
        // Kein Label
        style = {
          image: this.markerIcon,
        };
      }

      if (Globals.webgl) {
        delete style.image;
      }

      // Erstelle aus temporärem Style den markerStyle
      this.markerStyle = new Style(style);

      if (this.marker) {
        // Fuege Style (markerStyle) zum Feature hinzu
        this.marker.setStyle(this.markerStyle);
      }
    }

    if (Globals.webgl) return;

    // Überspringe Anpassung der Rotation, wenn 'noRotate'
    // in den shapeData gesetzt ist
    if (this.shapeData.noRotate) return;

    // Setze Rotation, wenn nötig
    if (this.markerIcon.getRotation() != Helper.degreesToRadians(this.track)) {
      this.markerIcon.setRotation(Helper.degreesToRadians(this.track));
    }
  }

  /**
   * Setzt die Offsets für das Label, je nach Flugzeug-Kategorie
   */
  setLabelOffsets() {
    // Setzen der Parameter nach der Category des Flugzeugs
    this.offsetY = 0;

    // Setze offsetX entsprechend der Category des Flugzeugs
    switch (this.category) {
      case 'A1': {
        this.offsetX = 45;
        break;
      }
      case 'A2': {
        this.offsetX = 45;
        break;
      }
      case 'A3': {
        this.offsetX = 50;
        break;
      }
      case 'A4': {
        this.offsetX = 50;
        break;
      }
      case 'A5': {
        this.offsetX = 65;
        break;
      }
      case 'B7': {
        this.offsetX = 80;
        break;
      }
      default: {
        this.offsetX = 60;
        break;
      }
    }
  }

  /**
   * Markiert oder entfernt die Markierung
   * eins Flugzeugs, indem die Umrandungs-
   * staerke des Icons veraendert wird
   */
  toggleMarkPlane() {
    if (this.isMarked == false) {
      this.isMarked = true;
      this.strokeWidth = 1.3;
    } else {
      this.isMarked = false;
      this.strokeWidth = 0.4;
    }

    // Aktualisiert den Stil des Icons
    this.updateMarker(false);
  }

  /**
   * Aktualisiert die Daten des Flugzeugs mit Eintraegen
   * des listElement
   * @param listElement Flugzeug-Objekt vom Server
   */
  updateData(listElement: any): void {
    this.hex = listElement.hex;
    this.latitude = listElement.latitude;
    this.longitude = listElement.longitude;
    this.altitude = listElement.altitude;
    this.track = listElement.track;
    this.onGround = listElement.onGround;
    this.speed = listElement.speed;
    this.squawk = listElement.squawk;
    this.verticalRate = listElement.verticalRate;
    this.rssi = listElement.rssi;
    this.temperature = listElement.temperature;
    this.windSpeed = listElement.windSpeed;
    this.windFromDirection = listElement.windFromDirection;
    this.distance = listElement.distance;
    this.autopilotEngaged = listElement.autopilotEngaged;
    this.elipsoidalAltitude = listElement.elipsoidalAltitude;
    this.selectedQnh = listElement.selectedQnh;
    this.selectedAltitude = listElement.selectedAltitude;
    this.selectedHeading = listElement.selectedHeading;
    this.lastSeen = listElement.lastSeen;
    this.feederList = listElement.feederList;
    this.sourceList = listElement.sourceList;
    this.fullType = listElement.fullType;
    this.serialNumber = listElement.serialNumber;
    this.lineNumber = listElement.lineNumber;
    this.operatorIcao = listElement.operatorIcao;
    this.testReg = listElement.testReg;
    this.registered = listElement.registered;
    this.regUntil = listElement.regUntil;
    this.status = listElement.status;
    this.built = listElement.built;
    this.firstFlightDate = listElement.firstFlightDate;
    this.engines = listElement.engines;
    this.position = [this.longitude, this.latitude];
    this.type = listElement.type;
    this.registration = listElement.registration;
    this.flightId = this.trimFlightId(listElement.flightId);
    this.category = listElement.category;
    this.origin = listElement.origin;
    this.destination = listElement.destination;
    this.operatorName = listElement.operatorName;
    this.operatorCallsign = listElement.operatorCallsign;
    this.operatorCountry = listElement.operatorCountry;
    this.operatorCountryFlag = listElement.operatorCountryFlag;
    this.operatorIata = listElement.operatorIata;
    this.regCodeName = listElement.regCodeName;
    this.regCodeNameFlag = listElement.regCodeNameFlag;
    this.icaoAircraftType = listElement.icaoAircraftType;
    this.age = listElement.age;
    this.aircraftState = listElement.aircraftState;
    this.urlPhotoDirect = listElement.urlPhotoDirect;
    this.urlPhotoWebsite = listElement.urlPhotoWebsite;
    this.photoPhotographer = listElement.photoPhotographer;
    this.isFromRemote = listElement.isFromRemote;
    this.lastUpdate = listElement.lastUpdate;
    this.roll = listElement.roll;

    // Generell: Berechne POMD-Point nur, wenn dieser auch angefragt wird
    // Ausnahme: Flugzeug ist das aktuell markierte, dann aktualisiere Werte,
    // damit Infobox gefüllt ist
    if (Globals.showPOMDPoint || this.isMarked) {
      if (
        Globals.useDevicePositionForDistance &&
        Globals.DevicePosition !== null
      ) {
        // Nutze Geräte-Position für Distanz-Berechnungen
        this.calcPoMDData(
          this.latitude,
          this.longitude,
          Globals.DevicePosition[1],
          Globals.DevicePosition[0],
          this.track,
          this.speed
        );
      } else {
        // Nutze Antennen-Position für Distanz-Berechnungen
        this.calcPoMDData(
          this.latitude,
          this.longitude,
          Globals.latFeeder,
          Globals.lonFeeder,
          this.track,
          this.speed
        );
      }
    }

    // Berechne Distanz Flugzeug->Geräte-Position
    if (
      Globals.useDevicePositionForDistance &&
      Globals.DevicePosition !== null
    ) {
      this.distanceDevicePos = Helper.getDistanceBetweenPositions(
        this.latitude,
        this.longitude,
        Globals.DevicePosition[1],
        Globals.DevicePosition[0]
      );
    } else {
      this.distanceDevicePos = null;
    }

    // Berechne Flight-Progress, wenn markiert
    if (this.isMarked) {
      this.updateTravelledDistanceInKm();
      this.updateTravelledDistanceInPercent();
    }
  }

  /**
   * Aktualisiere das Icon auf der Karte des Flugzeugs
   * @param moved true, wenn Flugzeug bereits auf der
   *              Karte war und nur die Position geaendert wird
   */
  updateMarker(moved: boolean): void {
    // Debug only: hier den Aircraft-Code eintragen:
    // this.type = 'B744';
    // this.category = 'A5';

    if (!this.position) return;

    this.createOrMoveOLPoint(moved);

    this.getShapeData();

    if (!this.marker && (!Globals.webgl || Globals.showAircraftLabel)) {
      // Erstelle Feature für PlaneIconFeatures
      this.createMarker();
    } else if (Globals.webgl && !Globals.showAircraftLabel && !this.marker) {
      // Erstelle marker auch bei Web-GL, damit Flugzeug-Label gesetzt werden kann
      this.createMarker();
    }

    if (Globals.webgl && !Globals.showAircraftLabel && this.marker) {
      if (this.marker.visible) {
        // Entferne PlaneIconFeatures-Marker, wenn WebGL enabled ist
        Globals.PlaneIconFeatures.removeFeature(this.marker);
        this.marker.visible = false;
      }
    }

    // Erstelle Feature für WebGL
    if (Globals.webgl) {
      if (!this.glMarker) {
        this.createWebGlMarker();
      }

      this.setWebglMarkerRgb();
      const iconRotation = this.shapeData.noRotate ? 0 : this.track;
      this.glMarker.set('rotation', (iconRotation * Math.PI) / 180.0);
      this.glMarker.set(
        'size',
        this.shapeScale *
          Math.max(this.shapeData.w, this.shapeData.h) *
          (this.pngScale < 0.39
            ? this.pngScale * Globals.smallScaleFactorIcons
            : this.pngScale) *
          (Globals.globalScaleFactorIcons / 1.3)
      );
      this.glMarker.set(
        'cx',
        Markers.getSpriteX(this.pngId) / Globals.glImapWidth
      );
      this.glMarker.set(
        'cy',
        Markers.getSpriteY(this.pngId) / Globals.glImapHeight
      );
      this.glMarker.set(
        'dx',
        (Markers.getSpriteX(this.pngId) + 1) / Globals.glImapWidth
      );
      this.glMarker.set(
        'dy',
        (Markers.getSpriteY(this.pngId) + 1) / Globals.glImapHeight
      );
    }

    if (this.marker && (!Globals.webgl || Globals.showAircraftLabel)) {
      // Aktualisere Icon
      this.updateIcon();

      if (!this.marker.visible) {
        this.marker.visible = true;
        // Fuege Feature zum Array an Features hinzu (Liste an Flugzeugen)
        Globals.PlaneIconFeatures.addFeature(this.marker);
      }
    }

    if (Globals.webgl && this.glMarker && !this.glMarker.visible) {
      this.glMarker.visible = true;
      // Fuege Feature zum Array an WebGL-Features hinzu (Liste an Flugzeugen)
      Globals.WebglFeatures.addFeature(this.glMarker);
    }

    if (!Globals.webgl && this.glMarker && this.glMarker.visible) {
      // Entferne WebglFeatures-Marker, wenn WebGL disabled ist
      Globals.WebglFeatures.removeFeature(this.glMarker);
      this.glMarker.visible = false;
    }

    // Erstelle oder aktualisiere POMD-Point für das Flugzeug
    if (this.isMarked && Globals.showPOMDPoint) {
      this.updatePOMDMarker(true);
    }
  }

  /**
   * Erstellt einen Marker für das Flugzeug als OL-Feature (für Nicht-Web-GL)
   */
  createMarker() {
    this.marker = new Feature(this.olPoint);
    this.marker.hex = this.hex;
    this.marker.name = 'plane';
  }

  /**
   * Erstellt einen Marker für das Flugzeug als OL-Feature (für Web-GL)
   */
  createWebGlMarker() {
    this.glMarker = new Feature(this.olPoint);
    this.glMarker.hex = this.hex;
    this.glMarker.name = 'plane';
  }

  /**
   * Setzt die Felder shaüeData und shapeScale. In dieser Methode
   * wird die Datenstruktur shapesMap aus Globals verwendet
   */
  getShapeData() {
    // Erstelle typeAndCategoryKey, um zu schauen, ob Shape für
    // Type oder Category bereits erstellt wurde (ehem. baseMarkerKey)
    let typeAndCategoryKey =
      (this.category ? this.category : 'A0') + '_' + this.type;

    // Hole Shape und berechne Scale, sofern dies noch nicht geschehen ist
    if (
      !this.typeDesignatorAndScaleArray ||
      this.typeAndCategoryKey != typeAndCategoryKey
    ) {
      // Speichere typeAndCategoryKey
      this.typeAndCategoryKey = typeAndCategoryKey;

      // Hole Type-Bezeichner und Scale als Array [typeDesignator, scale] (ehem. basemarker)
      this.typeDesignatorAndScaleArray = Markers.getTypeDesignatorAndScale(
        this.category,
        this.type
      );

      // Berechne Scale der Icons
      let scaleFactor = 1.18;
      scaleFactor *= Math.pow(1.3, 1) * 1;
      let baseScale = this.typeDesignatorAndScaleArray[1] * 0.96;
      this.shapeScale = scaleFactor * baseScale;

      // Beziehe shape-Bezeichner aus typeDesignatorAndScaleArray
      this.shapeDesignator = this.typeDesignatorAndScaleArray[0];

      // Beziehe Shape des Markers aus shapesMap mithilfe des shape-Bezeichners
      let shapesMapData = Globals.shapesMap[this.shapeDesignator];
      this.shapeData = shapesMapData[0];

      // Informationen für PNG für WebGL
      this.pngId = shapesMapData[1];
      this.pngScale = shapesMapData[2];
    }
  }

  /**
   * Erstellt oder verändert die Position eines Openlayers-Points,
   * welcher die aktuelle Position des Flugzeugs darstellt
   * @param moved true, wenn Flugzeug bereits auf der
   *              Karte war und nur die Position geaendert wird
   */
  createOrMoveOLPoint(moved: boolean) {
    let longitude = this.position[0];
    let latitude = this.position[1];

    // Erstelle Projection aus Positions-Daten
    const proj = olProj.fromLonLat([longitude, latitude]);

    // Erstelle OpenLayers-Point für die Position, wenn es diesen noch nicht gibt
    if (!this.olPoint) {
      this.olPoint = new Point(proj);
    } else if (moved) {
      // Verändere Position des OpenLayers-Point, der Position des Flugzeugs darstellt
      this.olPoint.setCoordinates(proj);
    }
  }

  /**
   * Setzt am glMarker die Werte für die RGB-Farbe des Icons
   */
  setWebglMarkerRgb() {
    // Beziehe Farben
    let rgb = Markers.getColorFromAltitude(
      this.altitude,
      this.onGround,
      false,
      this.isMarked,
      false,
      false
    );

    this.glMarker.set('r', rgb[0]);
    this.glMarker.set('g', rgb[1]);
    this.glMarker.set('b', rgb[2]);
  }

  /* Aktualisiere den POMD-Point des Flugzeugs auf der Karte
   * @param moved true, wenn Flugzeug bereits auf der
   *              Karte war und nur die Position geaendert wird
   */
  updatePOMDMarker(moved: boolean): void {
    if (!this.pomdMarker) {
      // Erstelle Feature
      this.pomdMarker = new Feature(
        new Point(olProj.fromLonLat([this.pomdLongitude, this.pomdLatitude]))
      );
      this.pomdMarker.hex = this.hex;
      this.pomdMarker.name = 'pomd_point';

      // Setze Style
      this.pomdMarker.setStyle(Styles.pomdMarkerStyle);

      // Fuege Feature zum Array an Features hinzu
      Globals.POMDFeatures.addFeature(this.pomdMarker);
    }
    if (moved) {
      this.pomdMarker.setGeometry(
        new Point(olProj.fromLonLat([this.pomdLongitude, this.pomdLatitude]))
      );
    }
  }

  /**
   * Erstellt aus den erstellten
   * Trail-Feature einen Layer
   * (initial unsichtbar)
   */
  createFeatures() {
    this.trail_features = new Vector();
    this.trail_features3d_line = new Vector();
    this.trail_features3d_bar = new Vector();

    this.layer = new VectorLayer({
      source: this.trail_features,
      declutter: false,
      zIndex: 150,
      visible: false,
    });
    this.layer.set('hex', this.hex);
    this.layer.set('isTrail', true);

    this.layer3dLine = new VectorLayer({
      source: this.trail_features3d_line,
      declutter: false,
      zIndex: 151,
      visible: false,
    });
    this.layer3dLine.set('hex', this.hex);
    this.layer3dLine.set('isTrail', true);

    this.layer3dBar = new VectorLayer({
      source: this.trail_features3d_bar,
      declutter: false,
      zIndex: 151,
      visible: false,
    });
    this.layer3dBar.set('hex', this.hex);
    this.layer3dBar.set('isTrail', true);

    Globals.trailGroup.push(this.layer);
    Globals.trailGroup.push(this.layer3dLine);
    Globals.trailGroup.push(this.layer3dBar);

    // initialisiere das Array für die LinienSegmente
    this.trackLinePoints = [];

    this.track3d = {
      trailPoints: [],
    };
  }

  /**
   * Erstellt schrittweise den Trail eines Flugzeugs,
   * indem Liniensegmente gebildet werden und denen
   * die jeweilige Farbe (nach Hoehe) zugewiesen wird
   * @returns {boolean}
   */
  makeTrail(): void {
    if (this.position === null) return;

    // Initialisiere Trail bei Remote-Flugzeuge, da ansonsten kein Trail geupdatet
    // wird und 3d-Komponente nicht funktioniert
    if (this.isFromRemote != undefined) this.initTrail();

    if (this.aircraftTrailList === null || this.aircraftTrailList === undefined)
      return;

    this.initTrail();

    for (let i = 0; i < this.aircraftTrailList.length; i++) {
      let longitude = this.aircraftTrailList[i].longitude;
      let latitude = this.aircraftTrailList[i].latitude;
      let altitude = this.aircraftTrailList[i].altitude;
      let reenteredAircraft = this.aircraftTrailList[i].reenteredAircraft;
      let timestamp = this.aircraftTrailList[i].timestamp;
      let track = this.aircraftTrailList[i].track;
      let roll = this.aircraftTrailList[i].roll;

      this.addTrack2D(longitude, latitude);

      this.addTrack3D(
        longitude,
        latitude,
        altitude,
        timestamp,
        track,
        roll,
        reenteredAircraft
      );

      this.updateAltitudeData(timestamp, reenteredAircraft, altitude);

      if (this.trackLinePoints.length > 1) {
        this.addLineFeatureToLayer(reenteredAircraft, altitude);
      }
    }
  }

  initTrail() {
    if (!this.trail_features) this.createFeatures();

    // Setze Trail-Variablen zurück
    this.trail_features.clear();
    this.trail_features3d_line.clear();
    this.trail_features3d_bar.clear();
    this.trackLinePoints = [];
    this.track3d = undefined;
    this.aircraftTrailAltitudes = undefined;
  }

  /**
   * Update Datenstruktur für Altitude Chart mit Altitude
   * @param timestamp any
   * @param reenteredAircraft any
   * @param altitude any
   */
  updateAltitudeData(timestamp: any, reenteredAircraft: any, altitude: any) {
    let chartDataPoint = {
      x: timestamp,
      y: reenteredAircraft ? null : altitude,
    };

    if (this.aircraftTrailAltitudes == undefined) {
      this.aircraftTrailAltitudes = [
        { data: [{ x: timestamp, y: reenteredAircraft ? null : altitude }] },
      ];
    } else {
      this.aircraftTrailAltitudes[0].data.push(chartDataPoint);
    }
  }

  /**
   * Aktualisiert den Trail eines markierten Flugzeugs,
   * indem die aktuelle Position an den Trail gesetzt
   * wird
   *
   * @param selectedFeeder Feeder
   */
  updateTrail() {
    if (
      this.isMarked &&
      this.allDataWasRequested &&
      this.position &&
      this.trackLinePoints
    ) {
      // Füge neuen Trailpunkt hinzu
      this.addTrack2D(this.longitude, this.latitude);

      if (this.track3d) {
        // Verhindere das Position doppelt in trailPoints ist
        const lastIndex = this.track3d.trailPoints.length;
        let lastTrack3d = this.track3d.trailPoints[lastIndex - 1];
        let lastLon = lastTrack3d.longitude;
        let lastLat = lastTrack3d.latitude;

        if (lastLon != this.longitude && lastLat && this.latitude) {
          this.addTrack3D(
            this.longitude,
            this.latitude,
            this.altitude,
            new Date().getTime(),
            this.track,
            this.roll,
            false
          );
        }
      } else {
        // Füge auch Trail von Remote-Flugzeugen hinzu (haben kein makeTrail() vorher)
        this.addTrack3D(
          this.longitude,
          this.latitude,
          this.altitude,
          new Date().getTime(),
          this.track,
          this.roll,
          false
        );
      }

      if (this.trackLinePoints.length > 1) {
        this.addLineFeatureToLayer(false, this.altitude);

        // Aktualisiere Daten für Altitude Chart mit aktueller Höhe
        this.updateAltitudeData(Math.round(Date.now()), false, this.altitude);
      }
    }
  }

  /**
   * Macht den Trail des Flugzeugs sichtbar
   */
  setTrailVisibility2d(visible: boolean) {
    if (this.layer) {
      this.layer.set('visible', visible);
    }
  }

  /**
   * Macht den 3d-Trail (Line) des Flugzeugs sichtbar
   */
  setTrailVisibility3dLine(visible: boolean) {
    if (this.layer3dLine) {
      this.layer3dLine.set('visible', visible);
    }
  }

  /**
   * Macht den 3d-Trail (Bar) des Flugzeugs sichtbar
   */
  setTrailVisibility3dBar(visible: boolean) {
    if (this.layer3dBar) {
      this.layer3dBar.set('visible', visible);
    }
  }

  /**
   * Setzt Boolean und erstellt ein Label,
   * damit ein Label für das Flugzeug angezeigt wird
   */
  showLabel() {
    //this.createLabel();
    this.updateIcon();
  }

  /**
   * Versteckt das Label
   */
  hideLabel() {
    this.updateIcon();
  }

  /**
   * Trimmt die FlightId
   * @param flightId String
   */
  trimFlightId(flightId: string): any {
    if (flightId) {
      return flightId.trim();
    } else {
      return undefined;
    }
  }

  /**
   * Berechnet die Point of Minimum Distance-Daten
   *
   * @param lat1 number (current position of aircraft)
   * @param lon1 number (current position of aircraft)
   * @param lat2 number (current position of viewer)
   * @param lon2 number (current position of viewer)
   * @param heading number (current heading of aircraft)
   * @param speed number (current speed of aircraft)
   */
  calcPoMDData(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    heading: number,
    speed: number
  ): void {
    let distance = Helper.getDistanceBetweenPositions(lat1, lon1, lat2, lon2);
    let theta = Helper.getAngleBetweenPositions(lat1, lon1, lat2, lon2);
    this.pomdRemainingKm = Helper.getRemainingDistance(
      distance,
      theta,
      heading
    );
    this.pomdDistanceKm = Helper.getMinimumDistance(distance, theta, heading);
    [this.pomdLatitude, this.pomdLongitude] = Helper.getPosOfMinimumDistance(
      lat1,
      lon1,
      heading,
      this.pomdRemainingKm
    );
    this.pomdRemainingSeconds = Helper.getTimeForDistance(
      this.pomdRemainingKm,
      speed
    );
    this.pomdDirection = Helper.getAngleBetweenPositions(
      lat2,
      lon2,
      this.pomdLatitude,
      this.pomdLongitude
    );
    let ETADate = Helper.addSeconds(this.pomdRemainingSeconds);
    this.pomdETA = ETADate.toLocaleTimeString('de-de');
  }

  /**
   * Zerstört das Flugzeug, seinen Marker und seine Trail-Features
   */
  destroy() {
    this.clearMarker();
    this.clearPOMDPoint();

    if (this.layer) {
      Globals.trailGroup.remove(this.layer);
      this.trail_features.clear();
      this.layer = null;
    }

    if (this.layer3dLine) {
      Globals.trailGroup.remove(this.layer3dLine);
      this.trail_features3d_line.clear();
      this.layer3dLine = null;
    }

    if (this.layer3dBar) {
      Globals.trailGroup.remove(this.layer3dBar);
      this.trail_features3d_bar.clear();
      this.layer3dBar = null;
    }

    for (let key in Object.keys(this)) {
      delete this[key];
    }
  }

  /**
   * Entfernt den Marker des Flugzeugs aus den PlaneIconFeatures
   */
  clearMarker() {
    if (this.marker && this.marker.visible) {
      Globals.PlaneIconFeatures.removeFeature(this.marker);
      this.marker.visible = false;
    }

    if (this.glMarker && this.glMarker.visible) {
      Globals.WebglFeatures.removeFeature(this.glMarker);
      this.glMarker.visible = false;
    }

    delete this.glMarker;
    delete this.marker;
    delete this.olPoint;
    delete this.markerSvgKey;
    delete this.styleKey;
  }

  /**
   * Entfernt den POMD-Point des Flugzeugs aus den POMDFeatures und
   * setzt den pomdMarker auf undefined, damit dieser später wieder
   * erstellt werden kann
   */
  clearPOMDPoint() {
    if (this.pomdMarker) {
      Globals.POMDFeatures.removeFeature(this.pomdMarker);
      this.pomdMarker = undefined;
    }
  }

  addTrack2D(longitude, latitude) {
    this.trackLinePoints.push({
      coordinate: olProj.transform(
        [longitude, latitude],
        'EPSG:4326',
        'EPSG:3857'
      ),
    });
  }

  addTrack3D(
    longitude,
    latitude,
    altitude,
    timestamp,
    track,
    roll,
    isReentered
  ) {
    if (!this.track3d) {
      this.track3d = {
        trailPoints: [],
      };
    }

    this.track3d.trailPoints.push({
      longitude: longitude,
      latitude: latitude,
      altitude: altitude * 0.3048, // Cesium braucht Meter
      color: Markers.getColorFromAltitude(
        altitude,
        false,
        false,
        false,
        true,
        isReentered
      ),
      timestamp: timestamp,
      track: track,
      isReentered: isReentered,
      roll: roll,
      hex: this.hex,
    });
  }

  trackLinePointsAre180Crosspoints() {
    if (
      (this.trackLinePoints[this.trackLinePoints.length - 1].coordinate[0] ==
        20037508.342789244 &&
        this.trackLinePoints[this.trackLinePoints.length - 2].coordinate[0] ==
          -20037508.342789244) ||
      (this.trackLinePoints[this.trackLinePoints.length - 1].coordinate[0] ==
        -20037508.342789244 &&
        this.trackLinePoints[this.trackLinePoints.length - 2].coordinate[0] ==
          20037508.342789244)
    ) {
      return true;
    } else {
      return false;
    }
  }

  addLineFeatureToLayer(reenteredAircraft: boolean, altitude: number) {
    if (this.trackLinePointsAre180Crosspoints()) return;

    let featureLine = new Feature({
      geometry: new LineString([
        this.trackLinePoints[this.trackLinePoints.length - 1].coordinate,
        this.trackLinePoints[this.trackLinePoints.length - 2].coordinate,
      ]),
    });

    let style;

    // Setze Style des LineStrings
    if (reenteredAircraft) {
      // Setze gestrichelte Linie als Style des LineString,
      // sollte Flugzeug ein reeteredAircraft sein
      style = Styles.DashedLineStyle;
    } else {
      let onGround = altitude <= 0;

      // Berechne Farbwert des Trailabschnittes
      let trailColor = Markers.getColorFromAltitude(
        altitude,
        onGround,
        true,
        false,
        false,
        false
      );

      // Erstelle Style des Trailabschnittes
      let color = trailColor;
      style = new Style({
        fill: new Fill({ color: color }),
        stroke: new Stroke({ color: color, width: 4 }),
      });
    }

    // Setze Style
    featureLine.setStyle(style);

    // Fuege erstellte Linie zu allen
    // Linien hinzu
    this.trail_features.addFeature(featureLine);
  }

  calcFlightPathLength() {
    if (!this.positionOrg || !this.positionDest) return;

    this.totalFlightPathInKm = Helper.getDistanceBetweenPositions(
      this.positionOrg[1],
      this.positionOrg[0],
      this.positionDest[1],
      this.positionDest[0]
    );

    this.updateTravelledDistanceInKm();
    this.updateTravelledDistanceInPercent();

    // debug
    // console.log('totalFlightPathInKm: ' + this.totalFlightPathInKm + ' km');
    // console.log('travelledDistanceInKm: ' + this.travelledDistanceInKm + ' km');
    // console.log('travelled: ' + this.travelledDistanceInPercent + ' %');
    // console.log(
    //  'travelDistanceRemainingInKm: ' + this.travelDistanceRemainingInKm + ' km'
    // );
    // console.log('----');
  }

  updateTravelledDistanceInKm() {
    if (
      !this.positionOrg ||
      !this.positionDest ||
      !this.latitude ||
      !this.longitude
    )
      return;

    this.travelDistanceRemainingInKm = Math.abs(
      Helper.getDistanceBetweenPositions(
        this.positionDest[1],
        this.positionDest[0],
        this.latitude,
        this.longitude
      )
    ).toFixed(1);

    this.travelledDistanceInKm = (
      this.totalFlightPathInKm - this.travelDistanceRemainingInKm
    ).toFixed(1);
  }

  updateTravelledDistanceInPercent() {
    if (
      !this.positionOrg ||
      !this.positionDest ||
      !this.latitude ||
      !this.longitude
    )
      return;
    this.travelledDistanceInPercent =
      (this.travelledDistanceInKm / this.totalFlightPathInKm) * 100;

    this.calcFlightProgressCSSValues();
  }

  calcFlightProgressCSSValues() {
    if (
      !this.positionOrg ||
      !this.positionDest ||
      !this.latitude ||
      !this.longitude ||
      !this.travelledDistanceInPercent
    )
      return;

    this.flightProgressFlownPath = this.travelledDistanceInPercent + '%';

    // Da Flugzeug-Icon im Flight Progress by default in der Mitte den richtigen Wert
    // hat, muss dieser Wert angepasst werden, damit am Ende das Icon nicht über die
    // flown path bar hinausschießt
    if (this.travelledDistanceInPercent <= 8) {
      this.flightProgressPlaneIconLeft = 8 + '%';
    } else if (
      this.travelledDistanceInPercent > 8 &&
      this.travelledDistanceInPercent < 96
    ) {
      this.flightProgressPlaneIconLeft =
        this.travelledDistanceInPercent + 4 + '%';
    } else {
      this.flightProgressPlaneIconLeft = '100%';
    }
  }
}
