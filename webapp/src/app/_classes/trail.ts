import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Globals } from '../_common/globals';
import * as olProj from 'ol/proj';
import { Feature } from 'ol';
import { LineString } from 'ol/geom';
import { Styles } from './styles';
import { Markers } from './markers';
import { Fill, Stroke, Style } from 'ol/style';

/**
 * Klasse, welche ein Trail eines Flugzeugs darstellt
 */
export class Trail {
  trail_features: any = null;
  layer: any = null;
  trackLinePoints: any;

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
      zIndex: 140,
      visible: false,
    });
    this.layer.set('isTrail', true);

    Globals.allTrailsGroup.push(this.layer);

    // initialisiere das Array für die LinienSegmente
    this.trackLinePoints = [];
  }

  /**
   * Erstellt schrittweise den Trail eines Flugzeugs,
   * indem Liniensegmente gebildet werden und denen
   * die jeweilige Farbe (nach Hoehe) zugewiesen wird
   */
  makeTrail(aircraftTrailList: any[]): void {
    if (aircraftTrailList == null || aircraftTrailList == undefined) return;

    if (!this.trail_features) this.createFeatures();

    // Setze Trail-Variablen zurück
    this.trail_features.clear();
    this.trackLinePoints = [];

    for (let i = 0; i < aircraftTrailList.length; i++) {
      let longitude = aircraftTrailList[i].longitude;
      let latitude = aircraftTrailList[i].latitude;
      let altitude = aircraftTrailList[i].altitude;
      let reenteredAircraft = aircraftTrailList[i].reenteredAircraft;

      this.addTrack2D(longitude, latitude);

      if (this.trackLinePoints.length > 1) {
        this.addLineFeatureToLayer(reenteredAircraft, altitude);
      }
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
      style = Styles.DashedLineSmallStyle;
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
        stroke: new Stroke({ color: color, width: 1 }),
      });
    }

    // Setze Style
    featureLine.setStyle(style);

    // Fuege erstellte Linie zu allen
    // Linien hinzu
    this.trail_features.addFeature(featureLine);
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

  /**
   * Macht den Trail des Flugzeugs sichtbar
   */
  setTrailVisibility2d(visible: boolean) {
    if (this.layer) {
      this.layer.set('visible', visible);
    }
  }
}
