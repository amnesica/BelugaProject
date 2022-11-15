import { Globals } from 'src/app/_common/globals';

export class Markers {
  /**
   * Funktion liefert zu einer gegebenen category (cat) = "A2" und einem
   * typeDesignator (typ) = "A20N" das richtige shape-Objekt Hinweis zum
   * Vergleich mit Originalversion: typeDescription (bei Feeder nicht
   * vorhanden! -> kommt aus db) ="L2J"
   * @param category                      Kategorie des Flugzeugs
   * @param typeDesignator                Typdesignator des Flugzeugs
   * @returns [string, number]
   */
  static getTypeDesignatorAndScale(
    category: string,
    typeDesignator: string
  ): [string, number] {
    if (typeDesignator in Globals.typesMap) {
      let shape = Globals.typesMap[typeDesignator][0];
      let scaling = Globals.typesMap[typeDesignator][1];
      return [shape, scaling];
    }

    if (category in Globals.catMap) {
      return Globals.catMap[category];
    }

    return ['unidentified', 1];
  }

  /**
   * Funktion liefert zu einem gegebenen Shape-Objekt, einer fillColor
   * (Füllfarbe des Icons) ("hsl(55, 100%, 40%)"), strokeColor (Strich-
   * Farbe als "#000000") und strokeWidth (0.7) (Strich-Starke) eine URI
   * zu einer SVG-Datei zum Anzeigen des Icons
   * @param shape             Form des Icons
   * @param fillColor         Füllfarbe des Icons
   * @param strokeColor       Strichfarbe des Icons
   * @param strokeWidth       Strichstaerke des Icons
   * @returns {string}        Uri zu SVG
   */
  static svgShapeToURI(
    shape: any,
    fillColor: any,
    strokeColor: any,
    strokeWidth: any
  ) {
    strokeWidth *= shape.strokeScale ? shape.strokeScale : 1;

    if (!shape.path) {
      //debug only console.log(shape);
      let svg = shape.svg
        .replace('fillColor', fillColor)
        .replace('strokeColor', strokeColor)
        .replace('strokeWidth', strokeWidth);
      return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    let svg =
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="' +
      shape.viewBox +
      '" ' +
      (shape.noAspect ? 'preserveAspectRatio="none" ' : '') +
      'width="' +
      shape.w +
      '" height="' +
      shape.h +
      '">' +
      '<g' +
      (shape.transform ? ' transform="' + shape.transform + '"' : '') +
      '>';

    let path = shape.path;
    if (!Array.isArray(path)) path = [path];
    for (let i = 0; i < path.length; i++) {
      svg +=
        '<path paint-order="stroke" fill="' +
        fillColor +
        '" stroke="' +
        strokeColor +
        '" stroke-width="' +
        2 * strokeWidth +
        '" ' +
        'd="' +
        path[i] +
        '" style="shape-rendering: \'auto\'"' +
        '/>';
    }

    let accentWidth =
      0.6 * (shape.accentMult ? shape.accentMult * strokeWidth : strokeWidth);
    let accent = shape.accent;
    if (!Array.isArray(accent)) accent = [accent];
    for (let i = 0; i < accent.length; i++) {
      svg +=
        '<path fill="none" stroke="' +
        strokeColor +
        '" stroke-width="' +
        accentWidth +
        '" ' +
        'd="' +
        accent[i] +
        '"/>';
    }

    svg += '</g></svg>';

    return 'data:image/svg+xml;base64,' + btoa(svg);
  }

  /**
   * Funktion liefert die passende Farbe zu einer Hoehe in ft
   * @param altitude              Hoehe in ft
   * @param asHex                 Boolean, ob hex code zurückgegeben werden soll
   * @returns {string | []}       hex code oder rgb-Array
   */
  static getColorFromAltitude(
    altitude: number,
    onGround: boolean,
    asHex: boolean,
    isMarked: boolean
  ): any {
    let rgb;

    if (altitude === 0 || onGround === true) {
      rgb = [50, 50, 50];
    } else if (altitude > 0 && altitude <= 1000) {
      rgb = [100, 50, 0];
    } else if (altitude > 1000 && altitude <= 5000) {
      rgb = [100, 100, 0];
    } else if (altitude > 5000 && altitude <= 10000) {
      rgb = [0, 100, 0];
    } else if (altitude > 10000 && altitude <= 20000) {
      rgb = [0, 75, 100];
    } else if (altitude > 20000 && altitude <= 30000) {
      rgb = [0, 50, 100];
    } else if (altitude > 30000 && altitude <= 40000) {
      rgb = [50, 0, 100];
    } else if (altitude > 40000 && altitude <= 1000000) {
      rgb = [100, 0, 0];
    } else if (altitude > 1000000) {
      rgb = [100, 100, 100];
    } else {
      rgb = [25, 25, 25];
    }

    if (isMarked) {
      // Erhöhe Helligkeit. Wenn Werte "0" sind, setze diese,
      // damit sich die Farben Rot, Grün, Blau auch in der Helligkeit ändern
      rgb = [
        Math.min(100, rgb[0] === 0 ? 25 * 1.5 : rgb[0] * 1.25),
        Math.min(100, rgb[1] === 0 ? 25 * 1.5 : rgb[1] * 1.25),
        Math.min(100, rgb[2] === 0 ? 25 * 1.5 : rgb[2] * 1.25),
      ];
    }

    if (asHex) {
      // Gebe Hex-String zurück
      return Markers.rgbToHex(rgb[0], rgb[1], rgb[2]);
    }

    // Rechne RGB-Werte für Wertebereich 0-255 um
    return [rgb[0] * 2.55, rgb[1] * 2.55, rgb[2] * 2.55];
  }

  /**
   * Wandelt eine RGB-Farbe in den entsprechenden Hex-Code als String um
   * @param r number
   * @param g number
   * @param b number
   * @returns string
   */
  static rgbToHex(r: number, g: number, b: number): string {
    r = r * 2.55;
    g = g * 2.55;
    b = b * 2.55;
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Berechnet und gibt den Wert für cx und dx des glMarkers zurück
   * @param pngId
   * @returns number
   */
  static getSpriteX(pngId) {
    return pngId % Globals.glImapWidth;
  }

  /**
   * Berechnet und gibt den Wert für cy und dy des glMarkers zurück
   * @param pngId
   * @returns number
   */
  static getSpriteY(pngId) {
    return Math.floor(pngId / Globals.glImapWidth);
  }
}
