import { Circle, Fill, Stroke, Style } from 'ol/style';

/**
 * Klasse, welche einen Feeder darstellt
 */
export class Feeder {
  name!: string;
  type!: string;
  color!: string;
  styleFeederPoint;

  constructor(name: string, type: string, color: string) {
    this.name = name;
    this.type = type;
    this.color = color;

    // Setze Style für einen RangeData-Punkt
    // des Feeders mit der jeweiligen Farbe
    this.styleFeederPoint = new Style({
      image: new Circle({
        radius: 5,
        fill: new Fill({ color: this.color }),
        stroke: new Stroke({
          color: this.color,
          width: 2,
        }),
      }),
    });
  }
}
