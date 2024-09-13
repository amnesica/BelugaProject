import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Feeder } from '../../_classes/feeder';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  // Observable sources
  private timesAsTimestampsSource = new Subject<number[]>();
  private toggleHideRangeDataSource = new Subject<boolean>();
  private toggleMarkRangeDataByFeederSource = new Subject<boolean>();
  private toggleMarkRangeDataByHeightSource = new Subject<boolean>();
  private toggleShowAircraftLabelsSource = new Subject<boolean>();
  private listFeederSource = new Subject<Feeder[]>();
  private selectedFeederSource = new Subject<string[]>();
  private appNameAndVersionSource = new Subject<string[]>();
  private selectedFeederUpdateSource = new Subject<string[]>();
  private showAirportsSource = new Subject<boolean>();
  private showOpenskyPlanesSource = new Subject<boolean>();
  private showISSSource = new Subject<boolean>();
  private showDarkModeSource = new Subject<boolean>();
  private showPOMDPointSource = new Subject<boolean>();
  private useWebglSource = new Subject<boolean>();
  private clientIpSource = new Subject<string>();
  private centerMapOnIssSource = new Subject<boolean>();
  private setCurrentDevicePositionSource = new Subject<boolean>();
  private devicePositionAsBasisSource = new Subject<boolean>();
  private openskyCredentialsExistSource = new Subject<boolean>();
  aircraftTrailAltitudeData$ = new BehaviorSubject({});
  private rainViewerRainSource = new Subject<boolean>();
  private rainViewerCloudsSource = new Subject<boolean>();
  private rainViewerRainForecastSource = new Subject<boolean>();
  private toggleShowAircraftPositionsSource = new Subject<boolean>();
  private selectMapStyleSource = new Subject<string>();
  private listAvailableMapsSource = new Subject<object[]>();
  private dimMapSource = new Subject<boolean>();
  private darkStaticFeaturesSource = new Subject<boolean>();
  private setIconGlobalSizeSource = new Subject<number>();
  private setIconSmallSizeSource = new Subject<number>();
  private showAltitudeChartSource = new Subject<boolean>();
  private showOnlyMilitaryPlanesSource = new Subject<boolean>();
  private showTrailDataSource = new Subject<boolean>();
  private showAirplanesLivePlanesSource = new Subject<boolean>();
  private showAisDataSource = new Subject<boolean>();
  private aisstreamApiKeyExistsSource = new Subject<boolean>();

  // Observable streams
  timesAsTimestamps$ = this.timesAsTimestampsSource.asObservable();
  toggleHideRangeData$ = this.toggleHideRangeDataSource.asObservable();
  toggleMarkRangeDataByFeeder$ =
    this.toggleMarkRangeDataByFeederSource.asObservable();
  toggleMarkRangeDataByHeight$ =
    this.toggleMarkRangeDataByHeightSource.asObservable();
  toggleShowAircraftLabels$ =
    this.toggleShowAircraftLabelsSource.asObservable();
  listFeeder$ = this.listFeederSource.asObservable();
  selectedFeeder$ = this.selectedFeederSource.asObservable();
  appNameAndVersion$ = this.appNameAndVersionSource.asObservable();
  selectedFeederUpdate$ = this.selectedFeederUpdateSource.asObservable();
  showAirportsUpdate$ = this.showAirportsSource.asObservable();
  showOpenskyPlanes$ = this.showOpenskyPlanesSource.asObservable();
  showISS$ = this.showISSSource.asObservable();
  showDarkMode$ = this.showDarkModeSource.asObservable();
  showPOMDPoint$ = this.showPOMDPointSource.asObservable();
  useWebgl$ = this.useWebglSource.asObservable();
  clientIpSource$ = this.clientIpSource.asObservable();
  centerMapOnIssSource$ = this.centerMapOnIssSource.asObservable();
  setCurrentDevicePositionSource$ =
    this.setCurrentDevicePositionSource.asObservable();
  devicePositionAsBasisSource$ =
    this.devicePositionAsBasisSource.asObservable();
  openskyCredentialsExistSource$ =
    this.openskyCredentialsExistSource.asObservable();
  rainViewerRain$ = this.rainViewerRainSource.asObservable();
  rainViewerClouds$ = this.rainViewerCloudsSource.asObservable();
  rainViewerRainForecast$ = this.rainViewerRainForecastSource.asObservable();
  toggleShowAircraftPositions$ =
    this.toggleShowAircraftPositionsSource.asObservable();
  selectMapStyleSource$ = this.selectMapStyleSource.asObservable();
  listAvailableMapsSource$ = this.listAvailableMapsSource.asObservable();
  dimMapSource$ = this.dimMapSource.asObservable();
  darkStaticFeaturesSource$ = this.darkStaticFeaturesSource.asObservable();
  setIconGlobalSizeSource$ = this.setIconGlobalSizeSource.asObservable();
  setIconSmallSizeSource$ = this.setIconSmallSizeSource.asObservable();
  showAltitudeChartSource$ = this.showAltitudeChartSource.asObservable();
  showOnlyMilitaryPlanesSource$ =
    this.showOnlyMilitaryPlanesSource.asObservable();
  showTrailDataSource$ = this.showTrailDataSource.asObservable();
  showAirplanesLivePlanesSource$ =
    this.showAirplanesLivePlanesSource.asObservable();
  showAisDataSourceSource$ = this.showAisDataSource.asObservable();
  aisstreamApiKeyExistsSource$ =
    this.aisstreamApiKeyExistsSource.asObservable();

  constructor() {}

  showRangeDataBetweenTimestamps(
    selectedFeederRangeData: string[],
    timesAsTimestamps: number[]
  ) {
    this.timesAsTimestampsSource.next(timesAsTimestamps);
    this.selectedFeederSource.next(selectedFeederRangeData);
    return this.timesAsTimestampsSource;
  }

  toggleHideRangeData(hideRangeData: boolean) {
    this.toggleHideRangeDataSource.next(hideRangeData);
    return this.toggleHideRangeDataSource;
  }

  toggleMarkRangeDataByFeeder(markRangeDataByFeeder: boolean) {
    this.toggleMarkRangeDataByFeederSource.next(markRangeDataByFeeder);
    return this.toggleMarkRangeDataByFeederSource;
  }

  toggleMarkRangeDataByHeight(markRangeDataByHeight: boolean) {
    this.toggleMarkRangeDataByHeightSource.next(markRangeDataByHeight);
    return this.toggleMarkRangeDataByHeightSource;
  }

  toggleAircraftLabels(showAircraftLabels: boolean) {
    this.toggleShowAircraftLabelsSource.next(showAircraftLabels);
    return this.toggleShowAircraftLabelsSource;
  }

  sendReceiveListFeeder(listFeeder: Feeder[]) {
    this.listFeederSource.next(listFeeder);
    return this.listFeederSource;
  }

  selectRangeDataByFeeder(selectedFeederArray: string[]) {
    this.selectedFeederSource.next(selectedFeederArray);
    return this.selectedFeederSource;
  }

  sendReceiveAppNameAndVersion(appNameAndVersion: string[]) {
    this.appNameAndVersionSource.next(appNameAndVersion);
    return this.appNameAndVersionSource;
  }

  selectPlanesByFeeder(selectedFeederArray: string[]) {
    this.selectedFeederUpdateSource.next(selectedFeederArray);
    return this.selectedFeederUpdateSource;
  }

  toggleAirports(showAirports: boolean) {
    this.showAirportsSource.next(showAirports);
    return this.showAirportsSource;
  }

  toggleOpenskyPlanes(showOpenskyPlanes: boolean) {
    this.showOpenskyPlanesSource.next(showOpenskyPlanes);
    return this.showOpenskyPlanesSource;
  }

  toggleIss(showISS: boolean) {
    this.showISSSource.next(showISS);
    return this.showISSSource;
  }

  toggleDarkMode(showDarkMode: boolean) {
    this.showDarkModeSource.next(showDarkMode);
    return this.showDarkModeSource;
  }

  togglePOMDPoint(showPOMDPoint: boolean) {
    this.showPOMDPointSource.next(showPOMDPoint);
    return this.showPOMDPointSource;
  }

  toggleWebgl(webgl: boolean) {
    this.useWebglSource.next(webgl);
    return this.useWebglSource;
  }

  sendReceiveClientIp(clientIp: string) {
    this.clientIpSource.next(clientIp);
    return this.clientIpSource;
  }

  toggleCenterMapOnIss(centerMapOnIss: boolean) {
    this.centerMapOnIssSource.next(centerMapOnIss);
    return this.centerMapOnIssSource;
  }

  setCurrentDevicePosition(setCurrentDevicePosition: boolean) {
    this.setCurrentDevicePositionSource.next(setCurrentDevicePosition);
    return this.setCurrentDevicePositionSource;
  }

  toggleDevicePositionAsBasis(devicePositionAsBasis: boolean) {
    this.devicePositionAsBasisSource.next(devicePositionAsBasis);
    return this.devicePositionAsBasisSource;
  }

  sendReceiveOpenskyCredentialsExist(openskyCredentialsExist: boolean) {
    this.openskyCredentialsExistSource.next(openskyCredentialsExist);
    return this.openskyCredentialsExistSource;
  }

  sendReceiveAisstreamApiKeyExists(aisstreamApiKeyExists: boolean) {
    this.aisstreamApiKeyExistsSource.next(aisstreamApiKeyExists);
    return this.aisstreamApiKeyExistsSource;
  }

  sendAircraftAltitudeData(aircraftTrailAltitudeData: Object) {
    this.aircraftTrailAltitudeData$.next(aircraftTrailAltitudeData);
  }

  toggleRainViewerRain(rainViewerRain: boolean) {
    this.rainViewerRainSource.next(rainViewerRain);
    return this.rainViewerRainSource;
  }

  toggleRainViewerClouds(rainViewerClouds: boolean) {
    this.rainViewerCloudsSource.next(rainViewerClouds);
    return this.rainViewerCloudsSource;
  }

  toggleRainViewerRainForecast(rainViewerRainForecast: boolean) {
    this.rainViewerRainForecastSource.next(rainViewerRainForecast);
    return this.rainViewerRainForecastSource;
  }

  toggleAircraftPositions(showAircraftPositions: boolean) {
    this.toggleShowAircraftPositionsSource.next(showAircraftPositions);
    return this.toggleShowAircraftPositionsSource;
  }

  selectMapStyle(mapStyle: any) {
    this.selectMapStyleSource.next(mapStyle);
    return this.selectMapStyleSource;
  }

  sendReceiveListAvailableMaps(listAvailableMaps: object[]) {
    this.listAvailableMapsSource.next(listAvailableMaps);
    return this.listAvailableMapsSource;
  }

  toggleDimMap(dimMap: boolean) {
    this.dimMapSource.next(dimMap);
    return this.dimMapSource;
  }

  toggleDarkStaticFeatures(darkStaticFeatures: boolean) {
    this.darkStaticFeaturesSource.next(darkStaticFeatures);
    return this.darkStaticFeaturesSource;
  }

  setGlobalIconSize(value: number) {
    this.setIconGlobalSizeSource.next(value);
    return this.setIconGlobalSizeSource;
  }

  setSmallIconSize(value: number) {
    this.setIconSmallSizeSource.next(value);
    return this.setIconSmallSizeSource;
  }

  toggleAltitudeChart(showAltitudeChart: boolean) {
    this.showAltitudeChartSource.next(showAltitudeChart);
    return this.showAltitudeChartSource;
  }

  toggleOnlyMilitaryPlanes(showOnlyMilitaryPlanes: boolean) {
    this.showOnlyMilitaryPlanesSource.next(showOnlyMilitaryPlanes);
    return this.showOnlyMilitaryPlanesSource;
  }

  toggleTrailData(showTrailData: boolean) {
    this.showTrailDataSource.next(showTrailData);
    return this.showTrailDataSource;
  }

  toggleAirplanesLivePlanes(showAirplanesLivePlanes: boolean) {
    this.showAirplanesLivePlanesSource.next(showAirplanesLivePlanes);
    return this.showAirplanesLivePlanesSource;
  }

  toggleAisData(showAisData: boolean) {
    this.showAisDataSource.next(showAisData);
    return this.showAisDataSource;
  }
}
