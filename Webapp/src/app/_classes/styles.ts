import { Style, Fill, Stroke, Circle, Icon } from 'ol/style';

export class Styles {
  // Default Fill und Stroke für Default-Style
  static DefaultFillPoint = new Fill({
    color: 'rgba(255,255,255,0.4)',
  });
  static DefaultStroke = new Stroke({
    color: '#3399CC',
    width: 1.25,
  });

  // Default-Style für Points
  static DefaultPointStyle = new Style({
    image: new Circle({
      fill: Styles.DefaultFillPoint,
      stroke: Styles.DefaultStroke,
      radius: 5,
    }),
    fill: Styles.DefaultFillPoint,
    stroke: Styles.DefaultStroke,
  });

  // Style für einen Large-Flughafen
  static LargeAirportStyle = new Style({
    image: new Icon({
      src: '../../assets/airport.svg',
      offset: [0, 0],
      opacity: 1,
      scale: 0.9,
    }),
  });

  // Style für einen Medium-Flughafen
  static MediumAirportStyle = new Style({
    image: new Icon({
      src: '../../assets/airport.svg',
      offset: [0, 0],
      opacity: 1,
      scale: 0.7,
    }),
  });

  // Style für einen Small-Flughafen
  static SmallAirportStyle = new Style({
    image: new Icon({
      src: '../../assets/airport.svg',
      offset: [0, 0],
      opacity: 1,
      scale: 0.5,
    }),
  });

  // Style für einen Heliport
  static HeliportStyle = new Style({
    image: new Icon({
      src: '../../assets/heliport.svg',
      offset: [0, 0],
      opacity: 1,
      scale: 0.5,
    }),
  });

  // Style für einen geschlossenen Flughafen
  static ClosedAirportStyle = new Style({
    image: new Icon({
      src: '../../assets/closed_airport.svg',
      offset: [0, 0],
      opacity: 1,
      scale: 0.5,
    }),
  });

  // Style für einen See-Flughafen
  static SeaplaneBaseStyle = new Style({
    image: new Icon({
      src: '../../assets/seaplane_airport.svg',
      offset: [0, 0],
      opacity: 1,
      scale: 0.5,
    }),
  });

  // Gestrichelte Linie als Style des LineString,
  // sollte Flugzeug ein reeteredAircraft sein
  static DashedLineStyle = new Style({
    stroke: new Stroke({
      width: 4,
      color: 'rgba(0, 0, 0, 1)',
      lineDash: [1, 5],
    }),
  });

  // Style für den POMD-Marker
  static pomdMarkerStyle: Style = new Style({
    image: new Circle({
      radius: 7,
      fill: new Fill({ color: 'yellow' }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  });

  // Style für Range-Data Polygon
  static RangeDataPolygonStyle: Style = new Style({
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.3)',
    }),
  });

  // Style für Range-Data Points
  static RangeDataPointStyle: Style = new Style({
    image: new Circle({
      fill: new Fill({
        color: 'rgba(30, 30, 30, 1)',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 1,
      }),
      radius: 5,
    }),
  });

  // Style für Geräte-Position
  static DevicePositionStyle = new Style({
    image: new Circle({
      radius: 7,
      fill: new Fill({ color: 'black' }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  });
}
