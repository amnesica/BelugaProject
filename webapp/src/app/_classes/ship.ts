import { Circle, Geometry, Polygon } from 'ol/geom';
import * as olProj from 'ol/proj';

/**
 * Klasse, welche ein Ship darstellt.
 *
 * Beim Code wurde sich an https://github.com/jvde-github/AIS-catcher/blob/main/HTML/script.js orientert
 */
export class Ship {
  static cos100R = 0.9999999998770914; // cos(100m / R);
  static sin100R = 1.567855942823164e-5; // sin(100m / R)
  static rad = Math.PI / 180;
  static radInv = 180 / Math.PI;

  static ShippingClass = {
    OTHER: 0,
    UNKNOWN: 1,
    CARGO: 2,
    B: 3,
    PASSENGER: 4,
    SPECIAL: 5,
    TANKER: 6,
    HIGHSPEED: 7,
    FISHING: 8,
    PLANE: 9,
    HELICOPTER: 10,
    STATION: 11, // blue square
    ATON: 12, // yellow square
    SARTEPIRB: 13,
  };

  /**
   * Setze Style des AIS-Features entsprechend des Typs
   *
   * not used: PLANE, HELICOPTER, STATION, ATON, SARTEPIRB
   */
  private static getShipTypeAndClass(ship: any): any {
    let shipType = ship.type;
    if (shipType == undefined) shipType = 1;
    const shipTypeVal = Ship.getShipTypeVal(shipType);
    const shipClass: number = Ship.getShipClass(ship, shipTypeVal);
    ship.typeVal = shipTypeVal;
    ship.shipclass = shipClass;
  }

  private static getShipClass(ship: any, shipTypeVal: string): number {
    let shipType: number = ship.type;
    if (!shipType) shipType = 0;

    const typeString: string = shipType.toString();
    const firstDigit: string = typeString.charAt(0);

    if (typeString == '35' || typeString == '55') {
      return 5; // SPECIAL (military/law enforcement)
    } else if (firstDigit == '6') {
      return 4; // PASSENGER
    } else if (firstDigit == '7') {
      return 2; // CARGO
    } else if (firstDigit == '8') {
      return 6; // TANKER
    } else if (shipTypeVal == 'Fishing') {
      return 8; // FISHING
    } else if (shipTypeVal == 'High Speed Craft') {
      return 7; // HIGHSPEED
    } else if (shipTypeVal == 'Other' || (shipType > 30 && shipType <= 35)) {
      return 0; // OTHER
    } else if (shipTypeVal == 'Pleasure Craft' || shipTypeVal == 'Sailing') {
      return 3; // B
    } else if (shipTypeVal == 'N/A') {
      return 1; // UNKNOWN
    } else {
      return 0; // default is UNKNOWN
    }
  }

  static shippingMappings = {
    [Ship.ShippingClass.OTHER]: {
      cx: 120,
      cy: 20,
      hint: 'Other',
      imgSize: 20,
    },
    [Ship.ShippingClass.UNKNOWN]: {
      cx: 160,
      cy: 20,
      hint: 'Unknown',
      imgSize: 20,
    },
    [Ship.ShippingClass.CARGO]: {
      cx: 100,
      cy: 20,
      hint: 'Cargo',
      imgSize: 20,
    },
    [Ship.ShippingClass.TANKER]: {
      cx: 60,
      cy: 20,
      hint: 'Tanker',
      imgSize: 20,
    },
    [Ship.ShippingClass.PASSENGER]: {
      cx: 0,
      cy: 20,
      hint: 'Passenger',
      imgSize: 20,
    },
    [Ship.ShippingClass.HIGHSPEED]: {
      cx: 140,
      cy: 20,
      hint: 'High Speed',
      imgSize: 20,
    },
    [Ship.ShippingClass.SPECIAL]: {
      cx: 80,
      cy: 20,
      hint: 'Special',
      imgSize: 20,
    },
    [Ship.ShippingClass.FISHING]: {
      cx: 120,
      cy: 20,
      hint: 'Fishing',
      imgSize: 20,
    },
    [Ship.ShippingClass.ATON]: {
      cx: 0,
      cy: 40,
      hint: 'AtoN',
      imgSize: 20,
    },
    [Ship.ShippingClass.PLANE]: {
      cx: 0,
      cy: 60,
      hint: 'Aircraft',
      imgSize: 25,
    },
    [Ship.ShippingClass.HELICOPTER]: {
      cx: 0,
      cy: 85,
      hint: 'Helicopter',
      imgSize: 25,
    },
    [Ship.ShippingClass.B]: {
      cx: 20,
      cy: 20,
      hint: 'Class B',
      imgSize: 20,
    },
    [Ship.ShippingClass.STATION]: {
      cx: 20,
      cy: 40,
      hint: 'Base Station',
      imgSize: 20,
    },
    [Ship.ShippingClass.SARTEPIRB]: {
      cx: 40,
      cy: 40,
      hint: 'SART/EPIRB',
      imgSize: 20,
    },
  };

  static getSprite(ship: any) {
    Ship.getShipTypeAndClass(ship);
    let shipClass = ship.shipclass;
    let sprite = Ship.shippingMappings[shipClass] || {
      cx: 120,
      cy: 20,
      imgSize: 20,
      hint: '',
    };

    ship.rot = 0;
    ship.cx = sprite.cx;
    ship.cy = sprite.cy;
    ship.imgSize = sprite.imgSize;
    ship.hint = sprite.hint;

    if (sprite.cy === 20) {
      if (ship.sog != null && ship.sog > 0.5 && ship.cog != null) {
        ship.cy = 0;
        ship.rot = (ship.cog * 3.1415926) / 180;
      }
    } else if (
      (shipClass == Ship.ShippingClass.HELICOPTER ||
        shipClass == Ship.ShippingClass.PLANE) &&
      ship.cog != null
    ) {
      ship.rot = (ship.cog * 3.1415926) / 180;
    }

    return;
  }

  private static getShipTypeVal(s): string {
    if (s < 20) return 'N/A';
    if (s <= 29) return 'WIG';
    if (s <= 30) return 'Fishing';
    if (s <= 32) return 'Towing';
    if (s <= 34) return 'Dredging/Diving ops';
    if (s <= 35) return 'Military';
    if (s <= 36) return 'Sailing';
    if (s <= 37) return 'Pleasure Craft';
    if (s <= 39) return 'Reserved';
    if (s <= 49) return 'High Speed Craft';
    if (s <= 50) return 'Pilot';
    if (s <= 51) return 'Search And Rescue';
    if (s <= 52) return 'Tug';
    if (s <= 53) return 'Port tender';
    if (s <= 54) return 'Anti-pollution equipment';
    if (s <= 55) return 'Law Enforcement';
    if (s <= 57) return 'Local Vessel';
    if (s <= 58) return 'Medical Transport';
    if (s <= 59) return 'Noncombatant ship';
    if (s <= 69) return 'Passenger';
    if (s <= 79) return 'Cargo';
    if (s <= 89) return 'Tanker';
    if (s <= 99) return 'Other';

    if ((s >= 1500 && s <= 1920) || (s >= 8000 && s <= 8510)) {
      switch (s) {
        case 8000:
          return 'Unknown (inland AIS)';
        case 8010:
          return 'Motor Freighter';
        case 8020:
          return 'Motor Tanker';
        case 8021:
          return 'Motor Tanker (liquid)';
        case 8022:
          return 'Motor Tanker (liquid)';
        case 8023:
          return 'Motor Tanker (dry)';
        case 8030:
          return 'Container';
        case 8040:
          return 'Gas Tanker';
        case 8050:
          return 'Motor Freighter (tug)';
        case 8060:
          return 'Motor Tanker (tug)';
        case 8070:
          return 'Motor Freighter (alongside)';
        case 8080:
          return 'Motor Freighter (with tanker)';
        case 8090:
          return 'Motor Freighter (pushing)';
        case 8100:
          return 'Motor Freighter (pushing)';
        case 8110:
          return 'Tug, Freighter';
        case 8120:
          return 'Tug, Tanker';
        case 8130:
          return 'Tug Freighter (coupled)';
        case 8140:
          return 'Tug, freighter/tanker';
        case 8150:
          return 'Freightbarge';
        case 8160:
          return 'Tankbarge';
        case 8161:
          return 'Tankbarge (liquid)';
        case 8162:
          return 'Tankbarge (liquid)';
        case 8163:
          return 'Tankbarge (dry)';
        case 8170:
          return 'Freightbarge (with containers)';
        case 8180:
          return 'Tankbarge (gas)';
        case 8210:
          return 'Pushtow (one cargo barge)';
        case 8220:
          return 'Pushtow (two cargo barges)';
        case 8230:
          return 'Pushtow, (three cargo barges)';
        case 8240:
          return 'Pushtow (four cargo barges)';
        case 8250:
          return 'Pushtow (five cargo barges)';
        case 8260:
          return 'Pushtow (six cargo barges)';
        case 8270:
          return 'Pushtow (seven cargo barges)';
        case 8280:
          return 'Pushtow (eigth cargo barges)';
        case 8290:
          return 'Pushtow (nine or more barges)';
        case 8310:
          return 'Pushtow (one tank/gas barge)';
        case 8320:
          return 'Pushtow (two barges)';
        case 8330:
          return 'Pushtow (three barges)';
        case 8340:
          return 'Pushtow (four barges)';
        case 8350:
          return 'Pushtow (five barges)';
        case 8360:
          return 'Pushtow (six barges)';
        case 8370:
          return 'Pushtow (seven barges)';
        case 8380:
          return 'Pushtow (eight barges)';
        case 8390:
          return 'Pushtow (nine or more barges)';
        case 8400:
          return 'Tug (single)';
        case 8410:
          return 'Tug (one or more tows)';
        case 8420:
          return 'Tug (assisting)';
        case 8430:
          return 'Pushboat (single)';
        case 8440:
          return 'Passenger';
        case 8441:
          return 'Ferry';
        case 8442:
          return 'Red Cross';
        case 8443:
          return 'Cruise';
        case 8444:
          return 'Passenger';
        case 8450:
          return 'Service, Police or Port Service';
        case 8460:
          return 'Maintainance Craft';
        case 8470:
          return 'Object (towed)';
        case 8480:
          return 'Fishing';
        case 8490:
          return 'Bunkership';
        case 8500:
          return 'Barge, Tanker, Chemical';
        case 8510:
          return 'Object';
        case 1500:
          return 'General';
        case 1510:
          return 'Unit Carrier Maritime';
        case 1520:
          return 'bulk Carrier Maritime';
        case 1530:
          return 'Tanker';
        case 1540:
          return 'Liquified Gas Tanker';
        case 1850:
          return 'Pleasure';
        case 1900:
          return 'Fast Ship';
        case 1910:
          return 'Hydrofoil';
        case 1920:
          return 'Catamaran Fast';
      }
    }
    return 'Unknown (' + s + ')';
  }

  static getNavStatusVal(ship) {
    const StringFromStatus = [
      'Under way using engine',
      'At anchor',
      'Not under command',
      'Restricted manoeuverability',
      'Constrained',
      'Moored',
      'Aground',
      'Engaged in Fishing',
      'Under way sailing',
      'Reserved for HSC',
      'Reserved for WIG',
      'Reserved',
      'Reserved',
      'Reserved',
      'AIS-SART is active',
      'Not available',
    ];

    ship.status = StringFromStatus[Math.min(ship.navigationalStatus, 15)];
  }

  static createShipOutlineGeometry(ship: any): Geometry | undefined {
    if (!ship) return undefined;
    const coordinate = [ship.longitude, ship.latitude];

    let heading = ship.trueHeading;
    let { to_bow, to_stern, to_port, to_starboard } = ship.dimension;

    if (
      to_bow == null ||
      to_stern == null ||
      to_port == null ||
      to_starboard == null
    )
      return undefined;

    if (heading == null) {
      if (ship.cog != null && ship.sog > 1) heading = ship.cog;
      else
        return new Circle(
          olProj.fromLonLat(coordinate),
          Math.max(to_bow, to_stern)
        );
    }

    const deltaBow = Ship.calcOffset1M(coordinate, heading % 360);
    const deltaStarboard = Ship.calcOffset1M(coordinate, (heading + 90) % 360);

    const bow = Ship.calcMove(coordinate, deltaBow, to_bow);
    const stern = Ship.calcMove(coordinate, deltaBow, -to_stern);

    const A = Ship.calcMove(stern, deltaStarboard, to_starboard);
    const B = Ship.calcMove(stern, deltaStarboard, -to_port);
    const C = Ship.calcMove(B, deltaBow, 0.8 * (to_bow + to_stern));
    const Dmid = Ship.calcMove(
      C,
      deltaStarboard,
      0.5 * (to_starboard + to_port)
    );
    const D = Ship.calcMove(Dmid, deltaBow, 0.2 * (to_bow + to_stern));
    const E = Ship.calcMove(C, deltaStarboard, to_starboard + to_port);

    let shipOutlineCoords = [A, B, C, D, E, A].map((coord) =>
      olProj.fromLonLat(coord)
    );
    return new Polygon([shipOutlineCoords]);
  }

  private static calcOffset1M(coordinate, heading) {
    const lat = coordinate[1] * Ship.rad;
    const rheading = ((heading + 360) % 360) * Ship.rad;
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    let sinLat2 =
      sinLat * Ship.cos100R + cosLat * Ship.sin100R * Math.cos(rheading);
    let lat2 = Math.asin(sinLat2);
    let deltaLon = Math.atan2(
      Math.sin(rheading) * Ship.sin100R * cosLat,
      Ship.cos100R - sinLat * sinLat2
    );

    return [
      (lat2 * Ship.radInv - coordinate[1]) / 100,
      (deltaLon * Ship.radInv) / 100,
    ];
  }

  private static calcMove(coordinate, delta, distance) {
    return [
      coordinate[0] + delta[1] * distance,
      coordinate[1] + delta[0] * distance,
    ];
  }

  static mmsiToAircraftCarrier: Record<
    string,
    { name: string; type: string; dimension: any }
  > = {
    '303981000': {
      name: 'USS Nimitz (CVN-68)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '368962000': {
      name: 'USS Dwight D. Eisenhower (CVN-69)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '369970409': {
      name: 'USS Carl Vinson (CVN-70)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '366984000': {
      name: 'USS Theodore Roosevelt (CVN-71)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '369970406': {
      name: 'USS Abraham Lincoln (CVN-72)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '368913000': {
      name: 'USS George Washington (CVN-73)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '368912000': {
      name: 'USS John C. Stennis (CVN-74)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '368800000': {
      name: 'USS Harry S. Truman (CVN-75)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '369970410': {
      name: 'USS Ronald Reagan (CVN-76)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '369970663': {
      name: 'USS George H.W. Bush (CVN-77)',
      type: '35',
      dimension: {
        to_bow: 217.8,
        to_stern: 115,
        to_port: 66.8,
        to_starboard: 10,
      },
    },
    '338803000': {
      name: 'USS Gerald R. Ford (CVN-78)',
      type: '35',
      dimension: {
        to_bow: 230,
        to_stern: 107,
        to_port: 68,
        to_starboard: 10,
      },
    },
    '228711555': {
      name: 'Charles de Gaulle (R91)',
      type: '35',
      dimension: {
        to_bow: 106.5,
        to_stern: 155,
        to_port: 54.36,
        to_starboard: 10,
      },
    },
    '232002833': {
      name: 'HMS Queen Elizabeth (R08)',
      type: '35',
      dimension: {
        to_bow: 84,
        to_stern: 200,
        to_port: 63,
        to_starboard: 10,
      },
    },
    '235118002': {
      name: 'HMS Prince of Wales (R09)',
      type: '35',
      dimension: {
        to_bow: 84,
        to_stern: 200,
        to_port: 63,
        to_starboard: 10,
      },
    },
  };

  static checkAircraftCarrier(ship) {
    const mmsi: string = ship.mmsi.toString();
    if (!mmsi) return;

    const shipInfo = Ship.mmsiToAircraftCarrier[mmsi];
    if (shipInfo) {
      ship.shipName = shipInfo.name.toUpperCase();
      ship.type = shipInfo.type;
      if (Ship.missingOrInvalidDimensions(ship)) {
        ship.dimension = shipInfo.dimension;
        let heading = ship.trueHeading;
        if (heading == null || heading == 511) ship.trueHeading = 0;
      }
    }
  }

  static missingOrInvalidDimensions(ship): boolean {
    if (!ship) return true;
    if (ship.dimension == null) return true;

    let { to_bow, to_stern, to_port, to_starboard } = ship.dimension;
    if (to_bow === 0 || to_stern === 0 || to_port === 0 || to_starboard === 0)
      return true;

    return false;
  }
}
