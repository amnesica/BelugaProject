import { Style, Fill, Stroke, Text } from 'ol/style';
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
  verticalRate!: number;
  rssi!: number;
  category!: string;
  temperature!: number;
  windSpeed!: number;
  windFromDirection!: number;
  origin!: string;
  destination!: string;
  operatorName!: string;
  distance!: number;
  country!: string;
  autopilotEngaged!: boolean;
  elipsoidalAltitude!: number;
  selectedQnh!: number;
  selectedAltitude!: number;
  selectedHeading!: number;
  lastSeen!: number;
  feeder!: string;
  source!: string;
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
  trailPositions!: any;
  operatorCallsign!: any;
  operatorCountry!: any;
  operatorCountryFlag!: any;
  operatorIata!: any;
  regCodeName!: any;
  regCodeNameFlag!: any;
  icaoAircraftType!: any;
  age!: any;
  aircraftState!: any;

  constructor(
    hex: string,
    latitude: number,
    longitude: number,
    altitude: number,
    track: number,
    type: string,
    registration: string,
    onGround: boolean,
    speed: number,
    squawk: number,
    flightId: string,
    verticalRate: number,
    rssi: number,
    category: string,
    temperature: number,
    windSpeed: number,
    windFromDirection: number,
    origin: string,
    destination: string,
    operator: string,
    distance: number,
    country: string,
    autopilotEngaged: boolean,
    elipsoidalAltitude: number,
    selectedQnh: number,
    selectedAltitude: number,
    selectedHeading: number,
    lastSeen: number,
    feeder: string,
    source: string,
    fullType: string,
    serialNumber: string,
    lineNumber: string,
    operatorIcao: string,
    testReg: string,
    registered: string,
    regUntil: string,
    status: string,
    built: string,
    firstFlightDate: string,
    engines: string,
    trailPositions: any,
    operatorCallsign: any,
    operatorCountry: any,
    operatorCountryFlag: any,
    operatorIata: any,
    regCodeName: any,
    regCodeNameFlag: any,
    icaoAircraftType: any,
    age: any,
    aircraftState: any
  ) {
    this.hex = hex;
    this.latitude = latitude;
    this.longitude = longitude;
    this.altitude = altitude;
    this.track = track;
    this.type = type;
    this.registration = registration;
    this.onGround = onGround;
    this.speed = speed;
    this.squawk = squawk;
    (this.flightId = this.trimFlightId(flightId)),
      (this.verticalRate = verticalRate);
    this.rssi = rssi;
    this.category = category;
    this.temperature = temperature;
    this.windSpeed = windSpeed;
    this.windFromDirection = windFromDirection;
    this.origin = origin;
    this.destination = destination;
    this.operatorName = operator;
    this.distance = distance;
    this.country = country;
    this.autopilotEngaged = autopilotEngaged;
    this.elipsoidalAltitude = elipsoidalAltitude;
    this.selectedQnh = selectedQnh;
    this.selectedAltitude = selectedAltitude;
    this.selectedHeading = selectedHeading;
    this.lastSeen = lastSeen;
    this.feeder = feeder;
    this.source = source;
    this.fullType = fullType;
    this.serialNumber = serialNumber;
    this.lineNumber = lineNumber;
    this.operatorIcao = operatorIcao;
    this.testReg = testReg;
    this.registered = registered;
    this.regUntil = regUntil;
    this.status = status;
    this.built = built;
    this.firstFlightDate = firstFlightDate;
    this.engines = engines;
    this.trailPositions = trailPositions;
    this.operatorCallsign = operatorCallsign;
    this.operatorCountry = operatorCountry;
    this.operatorCountryFlag = operatorCountryFlag;
    this.operatorIata = operatorIata;
    this.regCodeName = regCodeName;
    this.regCodeNameFlag = regCodeNameFlag;
    this.icaoAircraftType = icaoAircraftType;
    this.age = age;
    this.aircraftState = aircraftState;
  }

  // Position als Array
  position = [this.longitude, this.latitude];

  // Ist Flugzeug markiert
  isMarked = false;

  // Marker des Flugzeugs (ehem. iconFeature)
  marker: any = null;

  // Stil des Flugzeugs mit SVG und Style
  baseMarker: any = [];
  scale = 0;
  strokeWidth = 0.4;
  fillColor = '';
  strokeColor = '';
  svgURI = '';
  iconStyle: any = null;

  //Trail des Flugzeugs als Punkte
  trackLinePoints: any;

  // Position des Herkunfts-Flughafens
  // und des Zielflughafens
  positionOrg: any;
  positionDest: any;

  // Trail des Flugzeugs als Feature
  trail_features: any = null;
  layer: any = null;

  // Url für Flugzeug-Foto
  urlPhotoDirect: any = null;

  // Url zur Website mit Flugzeug-Foto
  urlPhotoWebsite: any = null;

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

  /**
   * Erstellt das dargestellte Flugzeug, indem mit
   * passender Form, Skalierung, Rotation und Farbe
   * (nach Hoehe) ein Flugzeug-Icon erstellt wird
   */
  updateIcon() {
    // Debug only: hier den Aircraft-Code eintragen:
    // this.type = 'B744';

    this.baseMarker = Markers.getBaseMarker(this.category, this.type);

    // Berechne Scale der Icons
    let globalScale = 1;
    let scaleFactor = 1.18;
    scaleFactor *= Math.pow(1.3, globalScale) * globalScale;
    let baseScale = this.baseMarker[1] * 0.96;
    this.scale = scaleFactor * baseScale;

    // Beziehe passende Form
    let shape = this.baseMarker[0];
    this.baseMarker = Markers.shapes[shape];

    // Beziehe Farben
    this.fillColor = Markers.calcColorFromAltitude(this.altitude);
    this.strokeColor = '#000';

    // Beziehe SVG-Uri
    this.svgURI = Markers.svgShapeToURI(
      this.baseMarker,
      this.fillColor,
      this.strokeColor,
      this.strokeWidth
    );

    // Setze Style des Features
    this.iconStyle = new Style({
      image: new Icon({
        imgSize: [this.baseMarker.w, this.baseMarker.h],
        src: this.svgURI,
        scale: this.scale * Globals.scaleIcons,
        rotation: Helper.degreesToRadians(this.track),
      }),
    });

    // Erstelle Flugzeug-Label oder nehme default-Style
    if (Globals.showAircraftLabel && this.flightId) {
      // Erstelle auch für neu hinzugekommene Flugzeuge
      // das Label, wenn dieses noch nicht erstellt wurde
      if (!this.labelStyleWasSet) {
        this.createLabel();
      }
    } else {
      this.labelStyle = new Style();
    }

    // Fuege Style zum Feature hinzu
    this.marker.setStyle([this.iconStyle, this.labelStyle]);
  }

  createLabel() {
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

    // Setze Style des Labels
    this.labelStyle = new Style({
      text: new Text({
        font: 'bold 10px Roboto',
        text: this.flightId,
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
    });

    // Boolean, damit Label nur einmal erstellt wird
    this.labelStyleWasSet = true;
  }

  /**
   * Markiert oder entfernt die Markierung
   * eins Flugzeugs, indem die Umrandungs-
   * staerke des Icons veraendert wird
   */
  toggleMarkPlane() {
    if (this.isMarked === false) {
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
   * des listElement. Bestimmte Felder werden nur geupdated,
   * wenn sie noch nicht bereits gesetzt wurden
   * (verhindert, dass Daten bei Wechsel des Feeders verloren gehen)
   * @param listElement Flugzeug-Objekt vom Server
   */
  updateData(listElement: Aircraft): void {
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
    this.feeder = listElement.feeder;
    this.source = listElement.source;
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
    this.trailPositions = listElement.trailPositions;
    this.operatorCallsign = listElement.operatorCallsign;
    this.operatorCountry = listElement.operatorCountry;
    this.operatorCountryFlag = listElement.operatorCountryFlag;
    this.operatorIata = listElement.operatorIata;
    this.regCodeName = listElement.regCodeName;
    this.regCodeNameFlag = listElement.regCodeNameFlag;
    this.icaoAircraftType = listElement.icaoAircraftType;
    this.age = listElement.age;
    this.aircraftState = listElement.aircraftState;
  }

  /**
   * Aktualisiere das Icon auf der Karte des Flugzeugs
   * @param moved true, wenn Flugzeug bereits auf der
   *              Karte war und nur die Position geaendert wird
   */
  updateMarker(moved: boolean): void {
    if (!this.marker) {
      this.marker = new Feature(new Point(olProj.fromLonLat(this.position)));
      this.marker.hex = this.hex;
      this.marker.name = 'plane';
      // Fuege Feature zum Array an Features hinzu (Liste an Flugzeugen)
      Globals.PlaneIconFeatures.addFeature(this.marker);
      this.marker.visible = true;
    } else if (moved) {
      this.marker.setGeometry(new Point(olProj.fromLonLat(this.position)));
    }

    this.updateIcon();

    if (!this.marker.visible) {
      this.marker.visible = true;
      // Fuege Feature zum Array an Features hinzu (Liste an Flugzeugen)
      Globals.PlaneIconFeatures.addFeature(this.marker);
    }
  }

  /**
   * Erstellt aus den erstellten
   * Trail-Feature einen Layer
   * (initial unsichtbar)
   */
  createFeatures() {
    this.trail_features = new Vector();

    this.layer = new VectorLayer({
      source: this.trail_features,
      declutter: false,
      zIndex: 150,
      visible: false,
    });
    this.layer.set('hex', this.hex);
    this.layer.set('isTrail', true);

    Globals.trailGroup.push(this.layer);

    // initialisiere das Array für die LinienSegmente
    this.trackLinePoints = [];
  }

  /**
   * Erstellt schrittweise den Trail eines Flugzeugs,
   * indem Liniensegmente gebildet werden und denen
   * die jeweilige Farbe (nach Hoehe) zugewiesen wird
   * @returns {boolean}
   */
  makeTrail(): void {
    if (this.position === null) return;

    if (!this.trail_features) this.createFeatures();

    // Setze Trail-Variablen zurück
    this.trail_features.clear();
    this.trackLinePoints = [];

    for (var i: number = 0; i < this.trailPositions.length; i++) {
      let longitude = this.trailPositions[i][0];
      let latitude = this.trailPositions[i][1];
      let altitude = this.trailPositions[i][2];
      let reeteredAircraft = this.trailPositions[i][3];

      this.trackLinePoints.push(
        olProj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857')
      );

      if (this.trackLinePoints.length > 1) {
        let featureLine = new Feature({
          geometry: new LineString([
            this.trackLinePoints[this.trackLinePoints.length - 1],
            this.trackLinePoints[this.trackLinePoints.length - 2],
          ]),
        });

        let style;

        // Setze Style des LineStrings
        if (reeteredAircraft) {
          // Setze gestrichelte Linie als Style des LineString,
          // sollte Flugzeug ein reeteredAircraft sein
          style = new Style({
            stroke: new Stroke({
              width: 4,
              color: 'rgba(0, 0, 0, 1)',
              lineDash: [1, 5],
            }),
          });
        } else {
          // Berechne Farbwert des Trailabschnittes
          let trailColor = Markers.calcColorFromAltitude(altitude);

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
    }
  }

  /**
   * Initierit die Neu-Zeichnung des Trails,
   * wenn das Flugzeug markiert ist
   */
  updateTrail() {
    if (this.isMarked) {
      this.makeTrail();
    }
  }

  /**
   * Macht den Trail des Flugzeugs sichtbar
   */
  makeTrailVisible() {
    this.layer.set('visible', true);
  }

  /**
   * Setzt Boolean und erstellt ein Label,
   * damit ein Label für das Flugzeug angezeigt wird
   */
  showLabel() {
    this.createLabel();

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
}
