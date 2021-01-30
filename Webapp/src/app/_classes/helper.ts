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
  static make_geodesic_circle(
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
   * Haversine-Formula to calculate the great-circle distance between two points
  // Source: http://www.movable-type.co.uk/scripts/latlong.html
   */
  static distanceBetweenPositions(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const EarthRadius = 6378137.0; //meters
    const var_1 = (lat1 * Math.PI) / 180.0; // lat1 in radians
    const var_2 = (lat2 * Math.PI) / 180.0; // lat2 in radians
    const delta_lat = ((lat2 - lat1) * Math.PI) / 180.0; // delta in radians
    const delta_lon = ((lon2 - lon1) * Math.PI) / 180.0; // delta in radians

    const a =
      Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2) +
      Math.cos(var_1) *
        Math.cos(var_2) *
        Math.sin(delta_lon / 2) *
        Math.sin(delta_lon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let d = (EarthRadius * c) / 1000; // distance

    let distanceInKm = d.toFixed(1);
    return Number(distanceInKm);
  }
}
