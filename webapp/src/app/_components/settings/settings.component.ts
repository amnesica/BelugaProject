import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { MatSlideToggleChange as MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { UntypedFormControl } from '@angular/forms';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServerService } from 'src/app/_services/server-service/server-service.service';
import { environment } from 'src/environments/environment';
import { Globals } from 'src/app/_common/globals';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { slideInOutRight } from 'src/app/_common/animations';
import { Feeder } from 'src/app/_classes/feeder';
import { Storage } from 'src/app/_classes/storage';
import { ThemeManager } from 'src/app/_services/theme-service/theme-manager.service';

export interface DialogData {
  times: string[];
}

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [],
  animations: [slideInOutRight],
})
export class SettingsComponent implements OnInit {
  // Boolean, ob Settings angezeigt werden sollen
  showSettingsDiv = false;

  // Breite der Settings
  settingsDivWidth: string | undefined;
  margin: string | undefined;
  marginTop: string | undefined;
  borderRadius: string | undefined;

  // Boolean, ob Anwendung im Desktop-Modus ist
  isDesktop: boolean | undefined;

  // Boolean, ob Outline-Data nach Feedern angezeigt werden soll
  markOutlineDataByFeeder: boolean = false;

  // Boolean, ob Outline-Data nach Höhe angezeigt werden soll
  markOutlineDataByHeight: boolean = false;

  // Booleans für Toggles (mit Default-Werten, wenn nötig)
  showAircraftLabels: boolean = false;
  showAirports: boolean = true;
  showOpenskyPlanes: boolean = false;
  showAirplanesLivePlanes: boolean = false;
  showIss: boolean = true;
  showAircraftPositions: boolean = true;
  showOnlyMilitaryPlanes: boolean = false;

  // Liste an Feeder (Verlinkung zu Globals, enthält 'All Feeder'-Feeder)
  listFeeder: any;

  // Ausgewählte Feeder in Multi-Select
  selectedFeeder: Feeder[] = [];

  // App-Name
  appName: any;

  // App-Version
  appVersion: any;

  // App-Stage (dev / Master)
  appStage: any;

  // App-BuildTime
  appBuildTime: any;

  // Boolean, ob POMD-Point angezeigt werden soll
  showPOMDPoint: boolean = false;

  // Boolean, ob WebGL verwendet werden soll
  webgl: boolean = false;

  // Boolean, ob WebGL vom Browser unterstützt wird
  webglNotSupported: boolean = false;

  // IP-Adresse des Clients
  clientAddress: string = '';

  // IP-Adresse des Servers
  serverAddress: string = '';

  // Boolean, ob die Karte über der ISS zentriert ist
  centerMapOnIss: boolean = false;

  // Boolean, ob Geräte-Standort Basis für Berechnungen
  // sein soll
  devicePositionAsBasis: boolean = false;

  // Boolean, ob Opensky-Credentials existieren, wenn nicht disable switch
  openskyCredentialsExist: boolean = false;

  // Boolean, ob Rainviewer (Rain) Daten angezeigt werden sollen
  rainViewerRain: boolean = false;

  // Boolean, ob Rainviewer (Cloud) Daten angezeigt werden sollen
  rainViewerClouds: boolean = false;

  // Boolean, ob Rainviewer Forecast (Rain) Daten angezeigt werden sollen
  rainViewerRainForecast: boolean = false;

  // Liste an Maps (Verlinkung zu Map-Komponente)
  listAvailableMaps: any;

  // Default-Map-Stil value
  selectedMapStyleValue: any;

  // Ausgewählte Feeder in Multi-Select
  selectedMapsArray = new UntypedFormControl();

  // Dimmen der Map
  dimMap: boolean = true;

  // dunkle Range Ringe und dunkles Antenna-Icon
  darkStaticFeatures: boolean = true;

  // Global icon size multiplier für Plane-Icons
  sliderGlobalIconSizeValue: any;

  // Small icon size multiplier für Plane-Icons
  sliderSmallIconSizeValue: any;

  // Min Zoom Level für AIS outlines
  sliderAisOutlinesZoomValue: any;

  // Boolean, ob Altitude Chart angezeigt werden soll
  showAltitudeChart: boolean = Storage.getPropertyFromLocalStorage(
    'showAltitudeChart',
    true
  );

  // Boolean, ob Trail-Data angezeigt werden soll
  showTrailData: boolean = false;

  // Boolean, ob aisstream API-Key existiert, wenn nicht disable switch
  aisstreamApiKeyExists: boolean = false;

  // Boolean, ob AIS-Daten angezeigt werden sollen
  showAisData: boolean = false;

  // Aktuelles Zoom-Level der Map
  currentMapZoomLevel: number = 0;

  // Boolean, ob actual range outline angezeigt werden soll
  showActualRangeOutline: boolean = true;

  themeManager = inject(ThemeManager);
  isDark$ = this.themeManager.isDark$;

  private ngUnsubscribe = new Subject();

  constructor(
    public settingsService: SettingsService,
    public breakpointObserver: BreakpointObserver,
    public serverService: ServerService,
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  setSettingsFromLocalStorage() {
    this.toggleAircraftLabels(
      Storage.getPropertyFromLocalStorage('aircraftLabels', false)
    );

    this.toggleAircraftPositions(
      Storage.getPropertyFromLocalStorage('aircraftPositions', true)
    );

    this.toggleAirports(
      Storage.getPropertyFromLocalStorage('airportLabels', true)
    );

    //this.toggleDarkMode(Storage.getPropertyFromLocalStorage('darkMode', false));

    this.toggleDarkStaticFeatures(
      Storage.getPropertyFromLocalStorage('darkStaticFeatures', true)
    );

    this.toggleDevicePositionAsBasis(
      Storage.getPropertyFromLocalStorage('devicePosForCalc', false),
      true
    );

    this.toggleDimMap(Storage.getPropertyFromLocalStorage('dimMap', true));

    this.toggleIss(Storage.getPropertyFromLocalStorage('ISS', true));

    this.togglePOMDPoint(
      Storage.getPropertyFromLocalStorage('pomdFeature', false)
    );

    this.toggleRainViewerRain(
      Storage.getPropertyFromLocalStorage('rainViewerRadar', false)
    );

    this.toggleRainViewerClouds(
      Storage.getPropertyFromLocalStorage('rainViewerClouds', false)
    );

    this.toggleRainViewerRainForecast(
      Storage.getPropertyFromLocalStorage('rainViewerForecast', false)
    );

    this.toggleAltitudeChart(
      Storage.getPropertyFromLocalStorage('showAltitudeChart', true)
    );

    this.toggleShowOnlyMilitaryPlanes(
      Storage.getPropertyFromLocalStorage('showOnlyMilitary', false)
    );

    this.sliderGlobalIconSizeValue = Storage.getPropertyFromLocalStorage(
      'globalIconSize',
      1.6
    );
    this.settingsService.setGlobalIconSize(+this.sliderGlobalIconSizeValue);

    this.sliderSmallIconSizeValue = Storage.getPropertyFromLocalStorage(
      'smallIconSize',
      1.0
    );
    this.settingsService.setSmallIconSize(+this.sliderSmallIconSizeValue);

    this.toggleOpenskyPlanes(
      Storage.getPropertyFromLocalStorage('showOpenskyPlanes', false)
    );

    this.toggleAirplanesLivePlanes(
      Storage.getPropertyFromLocalStorage('showAirplanesLive', false)
    );

    this.toggleAisData(
      Storage.getPropertyFromLocalStorage('showAisData', false)
    );

    this.sliderAisOutlinesZoomValue = Storage.getPropertyFromLocalStorage(
      'aisOutlineMinZoom',
      11.5
    );
    this.settingsService.setAisOutlineMinZoom(+this.sliderAisOutlinesZoomValue);

    this.toggleActualRangeOutline(
      Storage.getPropertyFromLocalStorage('showActualRangeOutline', true)
    );
  }

  ngOnInit(): void {
    // Initiiere Abonnements
    this.initSubscriptions();

    // Hole IP-Adresse des Servers aus Environment
    this.serverAddress = environment.baseUrl;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next(void 0);
    this.ngUnsubscribe.complete();
  }

  /**
   * Initiierung der Abonnements
   */
  initSubscriptions() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          // Setze Variable auf 'Mobile'
          this.isDesktop = false;
          this.settingsDivWidth = '100%';
          this.margin = '0';
          this.marginTop = '3.5rem';
          this.borderRadius = '0';
        } else {
          // Setze Variable auf 'Desktop'
          this.isDesktop = true;
          this.settingsDivWidth = '25rem';
          this.margin = '0.3rem';
          this.marginTop = '3.8rem';
          this.borderRadius = '15px';
        }
      });

    // Weise Liste an Feeder zu
    this.settingsService.listFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((listFeeder) => {
        this.listFeeder = listFeeder;

        // Füge default-Liste an Feedern hinzu
        this.selectedFeeder.push(...listFeeder);

        // Map ist fertig mit Initialisierung -> setze Default-werte
        this.setSettingsFromLocalStorage();
      });

    // Weise App-Name, App-Version, App-Stage und App-Buildtime zu
    this.settingsService.appNameAndVersion$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((appNameAndVersion) => {
        this.appName = appNameAndVersion[0];
        this.appVersion = appNameAndVersion[1];
        this.appStage = appNameAndVersion[2];
        this.appBuildTime = appNameAndVersion[3];
      });

    // Weise IP-Adresse des Clients zu
    this.settingsService.clientIpSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((clientIp) => {
        this.clientAddress = clientIp;
      });

    // Weise openskyCredentialsExist zu, damit Switch
    // disabled werden kann, falls diese nicht vorhanden sind
    this.settingsService.openskyCredentialsExistSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((openskyCredentialsExist) => {
        this.openskyCredentialsExist = openskyCredentialsExist;
      });

    // Weise Liste an verfügbaren Map-Stilen zu
    this.settingsService.listAvailableMapsSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((listAvailableMaps) => {
        this.listAvailableMaps = listAvailableMaps;
        this.selectCurrentlySelectedMapStyle();
      });

    // Weise aisstreamApiKeyExists zu, damit Switch
    // disabled werden kann, falls diese nicht vorhanden sind
    this.settingsService.aisstreamApiKeyExistsSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((aisstreamApiKeyExists) => {
        this.aisstreamApiKeyExists = aisstreamApiKeyExists;
      });

    // Aktuelles Zoom-Level der Karte anzeigen
    this.settingsService.mapZoomLevelSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((mapZoomLevel) => {
        this.currentMapZoomLevel = mapZoomLevel;
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * Methode zeigt oder versteckt die Labels der Flugzeuge
   * @param checked: boolean
   */
  toggleAircraftLabels(checked: boolean) {
    this.showAircraftLabels = checked;

    Storage.savePropertyInLocalStorage(
      'aircraftLabels',
      this.showAircraftLabels
    );

    // Kontaktiere Map-Component und übergebe showAircraftLabels-Boolean
    this.settingsService.toggleAircraftLabels(this.showAircraftLabels);
  }

  toggleMarkOutlineDataByFeeder(event: MatSlideToggleChange) {
    this.markOutlineDataByFeeder = event.checked;

    // Unchecke den Button "Filter by Height" und sorge für eine
    // Default-Ausgangsbasis, indem die Points wieder auf Default
    // zurückgesetzt werden. Nur ein Toggle-Switch ist zur Zeit aktiv
    // (a little hacky)
    if (this.markOutlineDataByHeight) {
      this.toggleMarkOutlineDataByHeight(
        new MatSlideToggleChange(event.source, !event.checked)
      );
    }

    // Kontaktiere Map-Component und übergebe boolean
    this.settingsService.toggleMarkOutlineDataByFeeder(
      this.markOutlineDataByFeeder
    );
  }

  toggleMarkOutlineDataByHeight(event: MatSlideToggleChange) {
    this.markOutlineDataByHeight = event.checked;

    // Unchecke den Button "Filter by Feeder" und sorge für eine
    // Default-Ausgangsbasis, indem die Points wieder auf Default
    // zurückgesetzt werden. Nur ein Toggle-Switch ist zur Zeit aktiv
    // (a little hacky)
    if (this.markOutlineDataByFeeder) {
      this.toggleMarkOutlineDataByFeeder(
        new MatSlideToggleChange(event.source, !event.checked)
      );
    }

    // Kontaktiere Map-Component und übergebe boolean
    this.settingsService.toggleMarkOutlineDataByHeight(
      this.markOutlineDataByHeight
    );
  }

  /**
   * Selektiere Flugzeuge nach dem ausgewählten Feeder
   */
  selectPlanesByFeeder() {
    let selectedFeederNames = this.getNamesOfSelectedFeeder(
      this.selectedFeeder
    );

    // Kontaktiere Map-Component und übergebe selectFeeder-Namen
    this.settingsService.selectPlanesByFeeder(selectedFeederNames);
  }

  getNamesOfSelectedFeeder(selectedFeederList: Feeder[]): string[] {
    let selectedFeederNames: string[] = [];
    for (let i = 0; i < selectedFeederList.length; i++) {
      selectedFeederNames.push(selectedFeederList[i].name);
    }
    return selectedFeederNames;
  }

  /**
   * Methode zeigt oder versteckt die Flughäfen
   * auf der Karte
   * @param checked: boolean
   */
  toggleAirports(checked: boolean) {
    this.showAirports = checked;

    Storage.savePropertyInLocalStorage('airportLabels', this.showAirports);

    // Kontaktiere Map-Component und übergebe toggleAirports-Boolean
    this.settingsService.toggleAirports(this.showAirports);
  }

  /**
   * Refreshe Flugzeuge nach ausgewähltem Feeder
   */
  refreshSelectedFeeder() {
    if (this.selectedFeeder) {
      this.selectPlanesByFeeder();
    }
  }

  /**
   * Toggle Anzeige der Opensky Flugzeuge
   */
  toggleOpenskyPlanes(checked: boolean) {
    this.showOpenskyPlanes = checked;

    Storage.savePropertyInLocalStorage(
      'showOpenskyPlanes',
      this.showOpenskyPlanes
    );

    // Kontaktiere Map-Component und übergebe showOpenskyPlanes-Boolean
    this.settingsService.toggleOpenskyPlanes(this.showOpenskyPlanes);
  }

  /**
   * Toggle Anzeige der ISS
   */
  toggleIss(checked: boolean) {
    this.showIss = checked;

    Storage.savePropertyInLocalStorage('ISS', this.showIss);

    // Kontaktiere Map-Component und übergebe showIss-Boolean
    this.settingsService.toggleIss(this.showIss);
  }

  /**
   * Toggle Dark Mode
   * @param checked: boolean
   */
  toggleDarkMode(checked: boolean) {
    let theme = checked ? 'dark' : 'light';
    this.changeTheme(theme);

    // Kontaktiere Map-Component und übergebe boolean
    this.settingsService.toggleDarkMode(checked);
  }

  changeTheme(theme: string) {
    this.themeManager.changeTheme(theme);
  }

  /**
   * Toggle WebGL
   * @param checked: boolean
   */
  toggleWebgl(checked: boolean) {
    this.webgl = checked;

    // Kontaktiere Map-Component und übergebe WebGL-Boolean
    this.settingsService.toggleWebgl(this.webgl);
  }

  /**
   * Toggle POMD-Point
   * @param checked: boolean
   */
  togglePOMDPoint(checked: boolean) {
    this.showPOMDPoint = checked;

    Storage.savePropertyInLocalStorage('pomdFeature', this.showPOMDPoint);

    // Kontaktiere Map-Component und übergebe showPOMDPoint-Boolean
    this.settingsService.togglePOMDPoint(this.showPOMDPoint);
  }

  /**
   * Ruft die Map-Komponente, damit die Karte über der
   * ISS zentriert wird
   */
  toggleCenterMapOnIss() {
    this.centerMapOnIss = !this.centerMapOnIss;

    // Kontaktiere Map-Component und übergebe centerMapOnIss-Boolean
    this.settingsService.toggleCenterMapOnIss(this.centerMapOnIss);
  }

  /**
   * Ruft die Map-Komponente, damit die aktuelle Geräte-Position
   * bestimmt werden kann
   */
  setCurrentDevicePosition() {
    // Kontaktiere Map-Component
    this.settingsService.setCurrentDevicePosition(true);
  }

  /**
   * Toggle Geräte-Position als Basis für weitere Berechnungen (Distanz, Range-Ringe)
   * @param checked: boolean
   */
  toggleDevicePositionAsBasis(checked: boolean, isInit: boolean) {
    this.devicePositionAsBasis = checked;

    if (isInit && checked == false) {
      this.devicePositionAsBasis = false;
      return;
    }

    if (this.devicePositionAsBasis && Globals.DevicePosition === undefined) {
      console.log(
        'Device position needs to be set before enabling this toggle!'
      );
      this.openSnackbar(
        'Device position needs to be set before enabling this toggle'
      );
      this.devicePositionAsBasis = false;
      return;
    } else {
      // Kontaktiere Map-Component und übergebe devicePositionAsBasis-Boolean
      this.settingsService.toggleDevicePositionAsBasis(
        this.devicePositionAsBasis
      );
    }

    Storage.savePropertyInLocalStorage(
      'devicePosForCalc',
      this.devicePositionAsBasis
    );
  }

  /**
   * Öffnet eine Snackbar mit einem Text für zwei Sekunden
   * @param message Text, der als Titel angezeigt werden soll
   */
  openSnackbar(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 2000,
    });
  }

  /**
   * Toggle Rainviewer (Rain)
   * @param checked: boolean
   */
  toggleRainViewerRain(checked: boolean) {
    this.rainViewerRain = checked;

    Storage.savePropertyInLocalStorage('rainViewerRadar', this.rainViewerRain);

    // Kontaktiere Map-Component und übergebe Rainviewer (Rain) Boolean
    this.settingsService.toggleRainViewerRain(this.rainViewerRain);
  }

  /**
   * Toggle Rainviewer (Clouds)
   * @param checked: boolean
   */
  toggleRainViewerClouds(checked: boolean) {
    this.rainViewerClouds = checked;

    Storage.savePropertyInLocalStorage(
      'rainViewerClouds',
      this.rainViewerClouds
    );

    // Kontaktiere Map-Component und übergebe Rainviewer (Clouds) Boolean
    this.settingsService.toggleRainViewerClouds(this.rainViewerClouds);
  }

  /**
   * Toggle Rainviewer Forecast(Rain)
   * @param checked: boolean
   */
  toggleRainViewerRainForecast(checked: boolean) {
    this.rainViewerRainForecast = checked;

    Storage.savePropertyInLocalStorage(
      'rainViewerForecast',
      this.rainViewerRainForecast
    );

    // Kontaktiere Map-Component und übergebe Rainviewer Forecast (Rain) Boolean
    this.settingsService.toggleRainViewerRainForecast(
      this.rainViewerRainForecast
    );
  }

  /**
   * Methode zeigt oder versteckt die Flugzeuge
   * @param checked: boolean
   */
  toggleAircraftPositions(checked: boolean) {
    this.showAircraftPositions = checked;

    Storage.savePropertyInLocalStorage(
      'aircraftPositions',
      this.showAircraftPositions
    );

    // Kontaktiere Map-Component und übergebe showAircraftPositions-Boolean
    this.settingsService.toggleAircraftPositions(this.showAircraftPositions);
  }

  changeMapStyle() {
    if (this.selectedMapsArray.value) {
      // Kontaktiere Map-Component und übergebe
      // selectedMapsArray-Name
      this.settingsService.selectMapStyle(this.selectedMapsArray.value);
    }
  }

  selectCurrentlySelectedMapStyle() {
    for (let i = 0; i < this.listAvailableMaps.length; i++) {
      if (this.listAvailableMaps[i].isSelected) {
        this.selectedMapStyleValue = this.listAvailableMaps[i].name;
      }
    }
  }

  /**
   * Toggle Dimming der Map
   * @param checked: boolean
   */
  toggleDimMap(checked: boolean) {
    this.dimMap = checked;

    Storage.savePropertyInLocalStorage('dimMap', this.dimMap);

    // Kontaktiere Map-Component und übergebe DimMap-Boolean
    this.settingsService.toggleDimMap(this.dimMap);
  }

  /**
   * Löscht die aktuelle Geräte-Position auf der Map
   */
  deleteCurrentDevicePosition() {
    // Kontaktiere Map-Component
    this.settingsService.setCurrentDevicePosition(false);
  }

  /**
   * Toggle dunkle Range Ringe und dunkles Antenna-Icon
   * @param checked: boolean
   */
  toggleDarkStaticFeatures(checked: boolean) {
    this.darkStaticFeatures = checked;

    Storage.savePropertyInLocalStorage(
      'darkStaticFeatures',
      this.darkStaticFeatures
    );

    // Kontaktiere Map-Component und übergebe darkStaticFeatures-Boolean
    this.settingsService.toggleDarkStaticFeatures(this.darkStaticFeatures);
  }

  onInputChangeGlobalIconSize(event: any) {
    this.sliderGlobalIconSizeValue = event.target.valueAsNumber;

    Storage.savePropertyInLocalStorage(
      'globalIconSize',
      this.sliderGlobalIconSizeValue
    );

    // Kontaktiere Map-Component
    this.settingsService.setGlobalIconSize(+this.sliderGlobalIconSizeValue);
  }

  onInputChangeSmallIconSize(event: any) {
    this.sliderSmallIconSizeValue = event.target.valueAsNumber;

    Storage.savePropertyInLocalStorage(
      'smallIconSize',
      this.sliderSmallIconSizeValue
    );

    // Kontaktiere Map-Component
    this.settingsService.setSmallIconSize(+this.sliderSmallIconSizeValue);
  }

  onInputChangeAisOutlineMinZoom(event: any) {
    this.sliderAisOutlinesZoomValue = event.target.valueAsNumber;

    Storage.savePropertyInLocalStorage(
      'aisOutlineMinZoom',
      this.sliderAisOutlinesZoomValue
    );

    // Kontaktiere Map-Component
    this.settingsService.setAisOutlineMinZoom(+this.sliderAisOutlinesZoomValue);
  }

  resetIconSizeSlider() {
    this.sliderGlobalIconSizeValue = Globals.defaultGlobalScaleFactorIcons;
    this.sliderSmallIconSizeValue = Globals.defaultSmallScaleFactorIcons;
    this.sliderAisOutlinesZoomValue = 11.5;

    Storage.savePropertyInLocalStorage(
      'globalIconSize',
      this.sliderGlobalIconSizeValue
    );
    Storage.savePropertyInLocalStorage(
      'smallIconSize',
      this.sliderSmallIconSizeValue
    );
    Storage.savePropertyInLocalStorage(
      'aisOutlineMinZoom',
      this.sliderAisOutlinesZoomValue
    );

    // Kontaktiere Map-Component
    this.settingsService.setGlobalIconSize(this.sliderGlobalIconSizeValue);
    this.settingsService.setSmallIconSize(this.sliderSmallIconSizeValue);
    this.settingsService.setAisOutlineMinZoom(+this.sliderAisOutlinesZoomValue);
  }

  toggleAltitudeChart(checked: boolean) {
    this.showAltitudeChart = checked;

    Storage.savePropertyInLocalStorage(
      'showAltitudeChart',
      this.showAltitudeChart
    );

    // Kontaktiere Map-Component und übergebe showAltitudeChart-Boolean
    this.settingsService.toggleAltitudeChart(this.showAltitudeChart);
  }

  toggleShowOnlyMilitaryPlanes(checked: boolean) {
    this.showOnlyMilitaryPlanes = checked;

    Storage.savePropertyInLocalStorage(
      'showOnlyMilitary',
      this.showOnlyMilitaryPlanes
    );

    // Kontaktiere Map-Component und übergebe showOnlyMilitaryPlanes-Boolean
    this.settingsService.toggleOnlyMilitaryPlanes(this.showOnlyMilitaryPlanes);
  }

  toggleTrailData(checked: boolean) {
    this.showTrailData = checked;

    this.settingsService.toggleTrailData(this.showTrailData);
  }

  toggleAirplanesLivePlanes(checked: boolean) {
    this.showAirplanesLivePlanes = checked;

    Storage.savePropertyInLocalStorage(
      'showAirplanesLive',
      this.showAirplanesLivePlanes
    );

    // Kontaktiere Map-Component und übergebe showAirplanesLivePlanes-Boolean
    this.settingsService.toggleAirplanesLivePlanes(
      this.showAirplanesLivePlanes
    );
  }

  toggleAisData(checked: boolean) {
    this.showAisData = checked;

    Storage.savePropertyInLocalStorage('showAisData', this.showAisData);

    // Kontaktiere Map-Component und übergebe showAisData-Boolean
    this.settingsService.toggleAisData(this.showAisData);
  }

  toggleActualRangeOutline(checked: boolean) {
    this.showActualRangeOutline = checked;

    Storage.savePropertyInLocalStorage(
      'showActualRangeOutline',
      this.showActualRangeOutline
    );

    // Kontaktiere Map-Component und übergebe showActualRangeOutline-Boolean
    this.settingsService.toggleActualRangeOutline(this.showActualRangeOutline);
  }
}
