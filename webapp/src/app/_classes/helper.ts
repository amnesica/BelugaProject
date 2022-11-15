import { CompileShallowModuleMetadata } from '@angular/compiler';
import LineString from 'ol/geom/LineString';

/**
 * Klasse mit Hilfsfunktionen
 */
export class Helper {
  /**
   * Methode erstellt einen Kreis mit Zentrum und Radius
   * @param center Zentrum
   * @param radius Radius
   * @param points
   */
  static makeGeodesicCircle(
    center: number[],
    radius: number,
    points: number
  ): any {
    const angularDistance = radius / 6378137.0;
    const lon1 = (center[0] * Math.PI) / 180.0;
    const lat1 = (center[1] * Math.PI) / 180.0;

    let geom;
    for (let i = 0; i <= points; ++i) {
      const bearing = (i * 2 * Math.PI) / points;

      let lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(angularDistance) +
          Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
      );
      let lon2 =
        lon1 +
        Math.atan2(
          Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
          Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
        );

      lat2 = (lat2 * 180.0) / Math.PI;
      lon2 = (lon2 * 180.0) / Math.PI;

      if (!geom) geom = new LineString([[lon2, lat2]]);
      else geom.appendCoordinate([lon2, lat2]);
    }
    return geom;
  }

  static degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Berechnet die Distanz zwischen zwei Geo-Positionen
   *
   * @param lat1 Latitude von Punkt 1
   * @param lon1 Longitude von Punkt 1
   * @param lat2 Latitude von Punkt 2
   * @param lon2 Longitude von Punkt 2
   * @return Distanz in Kilometern
   *
   * Sources: Haversine Formula – Calculate geographic distance on earth
   * https://www.igismap.com/haversine-formula-calculate-geographic-distance-
   * earth/ or http://www.movable-type.co.uk/scripts/latlong.html
   */
  static getDistanceBetweenPositions(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const EarthRadius = 6378137.0; //meters
    const lat1r = (lat1 * Math.PI) / 180.0; // lat1 in radians
    const lat2r = (lat2 * Math.PI) / 180.0; // lat2 in radians
    const delta_lat = ((lat2 - lat1) * Math.PI) / 180.0; // delta in radians
    const delta_lon = ((lon2 - lon1) * Math.PI) / 180.0; // delta in radians

    const a =
      Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2) +
      Math.cos(lat1r) *
        Math.cos(lat2r) *
        Math.sin(delta_lon / 2) *
        Math.sin(delta_lon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let d = (EarthRadius * c) / 1000; // distance

    let distanceInKm = d.toFixed(1);
    return Number(distanceInKm);
  }

  /* Berechnet den Winkel zwischen zwei Geo-Positionen
   *
   * @param lat1 Latitude von Punkt 1
   * @param lon1 Longitude von Punkt 1
   * @param lat2 Latitude von Punkt 2
   * @param lon2 Longitude von Punkt 2
   * @return Winkel in Grad (Dezimal)
   *
   * Sources: Haversine Formula – Calculate geographic distance on earth
   * https://www.igismap.com/formula-to-find-bearing-or-heading-angle-between-two-
   * points-latitude-longitude/ earth/ or
   * http://www.movable-type.co.uk/scripts/latlong.html
   */
  static getAngleBetweenPositions(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const lat1r = (lat1 * Math.PI) / 180.0; // lat1 in radians
    const lat2r = (lat2 * Math.PI) / 180.0; // lat2 in radians
    const delta_lon = ((lon2 - lon1) * Math.PI) / 180.0; // delta in radians

    // X = cos Lat2 * sin (Lon2 - Lon1)
    const x = Math.cos(lat2r) * Math.sin(delta_lon);

    // Y = cos Lat1 * sin Lat2 – sin Lat1 * cos Lat2 * cos (Lon2 - Lon1)
    const y =
      Math.cos(lat1r) * Math.sin(lat2r) -
      Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(delta_lon);

    // Beta = atan2(X,Y)
    const br = Math.atan2(x, y); // Beta is in radians
    let b = (br * 180) / Math.PI; // convert to deg
    if (b < 0) {
      b = b + 360;
    }

    let angle = b.toFixed(1);
    return Number(angle);
  }

  /**
   * Berechnet den Punkt C.
   * Point C ist der Punkt, wo das Flugzeug dem Beobachter am nächsten ist.
   * Berechnung erfolgt über die Haversine Formel.
   * http://www.movable-type.co.uk/scripts/latlong.html
   *
   * @param lat1      (Latitude von Punkt 1)
   * @param lon1      (Longitude von Punkt 1)
   * @param track     (Aktueller Track (Kurs) des Flugzeugs)
   * @param distance  (Entfernung von aktueller Position des Flugzeugs zum Punkt C)
   * @return (Lat Lon für Punkt c)
   */
  static getPosOfMinimumDistance(
    lat1: number,
    lon1: number,
    track: number,
    distance: number
  ): [number, number] {
    const EarthRadius = 6378.137; // Kilometer
    const lat1r = (lat1 * Math.PI) / 180.0; // lat1 in radians
    const lon1r = (lon1 * Math.PI) / 180.0; // lon1 in radians
    const trackr = (track * Math.PI) / 180.0; // lon1 in radians

    // Berechne lat2
    const lat2r = Math.asin(
      Math.sin(lat1r) * Math.cos(distance / EarthRadius) +
        Math.cos(lat1r) * Math.sin(distance / EarthRadius) * Math.cos(trackr)
    );

    let lon2r =
      lon1r +
      Math.atan2(
        Math.sin(trackr) * Math.sin(distance / EarthRadius) * Math.cos(lat1r),
        Math.cos(distance / EarthRadius) - Math.sin(lat1r) * Math.sin(lat2r)
      );

    // Longitude normalisieren in den Bereich −180…+180
    lon2r = ((lon2r + 540) % 360) - 180;

    // Konvertieren nach Degrees
    const lat2d = (lat2r * 180) / Math.PI;
    const lon2d = (lon2r * 180) / Math.PI;

    // Array für Koordinaten Punkt C
    return [lat2d, lon2d];
  }

  /**
   * Berechnet die verbleibende Entfernung bis zum Punkt C.
   * Point C ist der Punkt, wo das Flugzeug dem Beobachter am nächsten ist.
   * Berechnung erfolgt über das rechtwinklige Dreieck.
   *
   * @param distance (Seite c im rechtwinkligen Dreieck)
   * @param theta    (Winkel Theta, vom Flugzeug zur Position des Beobachters)
   * @param track    (Aktueller Track (Kurs) des Flugzeugs)
   * @return (verbleibende Entfernung in Kilometern)
   */
  static getRemainingDistance(
    distance: number,
    theta: number,
    track: number
  ): number {
    // Berechne Winkel Alpha, das ist die Winkel-Differenz zwischen Theta und Track
    const alpha = Math.abs(theta - track);
    const alpha_rad = (alpha * Math.PI) / 180.0; // alpha in radians

    // Berechne Länge der Seite b, entspricht der Strecke vom Flugzeug zum Punkt C
    let rd = distance * Math.cos(alpha_rad);
    return Number(rd);
  }

  /**
   * Berechnet die minimale Entfernung des Beobachters bis zum Punkt C
   * Point C ist der Punkt, wo das Flugzeug dem Beobachter am nächsten ist.
   * Berechnung erfolgt über das rechtwinklige Dreieck.
   *
   * @param distance (Seite c im rechtwinkligen Dreieck)
   * @param theta    (Winkel Theta, vom Flugzeug zur Position des Beobachters)
   * @param track    (Aktueller Track (Kurs) des Flugzeugs)
   * @return (minimale Entfernung bis zum Punkt C in Kilometern)
   */
  static getMinimumDistance(
    distance: number,
    theta: number,
    track: number
  ): number {
    // Berechne Winkel Alpha, das ist die Winkel-Differenz zwischen Theta und Track
    const alpha = Math.abs(theta - track);
    const alpha_rad = (alpha * Math.PI) / 180.0; // alpha in radians

    // Berechne Länge der Seite a, entspricht der Strecke vom Beobachter zum Punkt C
    let md = distance * Math.sin(alpha_rad);
    return Number(md);
  }
  /**
   * Berechne die benötigte Zeit für eine Strecke
   *
   * @param distance (Kilometer)
   * @param speed    (knots)
   * @return seconds (Decimal)
   */
  static getTimeForDistance(distance: number, speed: number): number {
    const secs = (distance / 1.852 / speed) * 60 * 60;
    let seconds = secs.toFixed(0);
    return Number(seconds);
  }
  /**
   * Addiere Sekunden zum aktuellen Datum
   *
   * @param seconds (Anzahl Sekunden, auch negativ)
   * @return newDate (Date)
   */
  static addSeconds(seconds: number): Date {
    let ts = +new Date();
    let newts = ts + seconds * 1000;
    let newDate = new Date(newts);
    return newDate;
  }

  /**
   * Findet heraus, ob WebGL im Browser aktiviert ist.
   * Hinweis: Original-Methode von https://gist.github.com/SeanZoR/cfa7a6206983b775a858
   *
   * @return { number } -1 für nicht unterstützt,
   *                    0 für deaktiviert
   *                    1 für aktiviert
   */
  static detectWebGL() {
    // Prüft den WebGL rendering context
    if (!!window.WebGLRenderingContext) {
      var canvas = document.createElement('canvas'),
        names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'],
        context: any = false;

      for (var i in names) {
        try {
          context = canvas.getContext(names[i]);
          if (context && typeof context.getParameter === 'function') {
            // WebGL ist aktiviert
            return 1;
          }
        } catch (e) {}
      }

      // WebGL wird unterstützt, ist aber deaktiviert
      return 0;
    }

    // WebGL wird nicht unterstützt
    return -1;
  }
}
