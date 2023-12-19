/**
 * Klasse mit Hilfsfunktionen für den Local Storage
 */
export class Storage {
  static getPropertyFromLocalStorage(itemKey: string, defaultValue: any): any {
    if (localStorage.getItem(itemKey) == null || !localStorage.getItem(itemKey))
      return defaultValue;
    return JSON.parse(localStorage.getItem(itemKey)!);
  }

  static savePropertyInLocalStorage(itemKey: string, itemValue: any) {
    localStorage.setItem(itemKey, JSON.stringify(itemValue));
  }

  static setDefaultSettingsValues() {
    this.savePropertyInLocalStorage(
      'aircraftLabels',
      this.getPropertyFromLocalStorage('aircraftLabels', false)
    );
    this.savePropertyInLocalStorage(
      'airportLabels',
      this.getPropertyFromLocalStorage('airportLabels', true)
    );
    this.savePropertyInLocalStorage(
      'ISS',
      this.getPropertyFromLocalStorage('ISS', true)
    );
    this.savePropertyInLocalStorage(
      'pomdFeature',
      this.getPropertyFromLocalStorage('pomdFeature', false)
    );
    this.savePropertyInLocalStorage(
      'devicePosForCalc',
      this.getPropertyFromLocalStorage('devicePosForCalc', false)
    );
    this.savePropertyInLocalStorage(
      'rainViewerRadar',
      this.getPropertyFromLocalStorage('rainViewerRadar', false)
    );
    this.savePropertyInLocalStorage(
      'rainViewerClouds',
      this.getPropertyFromLocalStorage('rainViewerClouds', false)
    );
    this.savePropertyInLocalStorage(
      'rainViewerForecast',
      this.getPropertyFromLocalStorage('rainViewerForecast', false)
    );
    this.savePropertyInLocalStorage(
      'aircraftPositions',
      this.getPropertyFromLocalStorage('aircraftPositions', true)
    );
    this.savePropertyInLocalStorage(
      'dimMap',
      this.getPropertyFromLocalStorage('dimMap', true)
    );
    this.savePropertyInLocalStorage(
      'darkStaticFeatures',
      this.getPropertyFromLocalStorage('darkStaticFeatures', true)
    );
    this.savePropertyInLocalStorage(
      'showAltitudeChart',
      this.getPropertyFromLocalStorage('showAltitudeChart', true)
    );
    this.savePropertyInLocalStorage(
      'showOnlyMilitary',
      this.getPropertyFromLocalStorage('showOnlyMilitary', false)
    );
    this.savePropertyInLocalStorage(
      'coordinatesDevicePosition',
      this.getPropertyFromLocalStorage('coordinatesDevicePosition', null)
    );
  }
}
