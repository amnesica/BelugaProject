import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatLegacySlideToggleChange as MatSlideToggleChange } from '@angular/material/legacy-slide-toggle';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { UntypedFormControl, FormGroup, Validators } from '@angular/forms';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { Helper } from 'src/app/_classes/helper';
import { ServerService } from 'src/app/_services/server-service/server-service.service';
import { environment } from 'src/environments/environment';
import { Globals } from 'src/app/_common/globals';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import {
  MtxCalendarView,
  MtxDatetimepickerMode,
  MtxDatetimepickerType,
} from '@ng-matero/extensions/datetimepicker';
import {
  DatetimeAdapter,
  MTX_DATETIME_FORMATS,
} from '@ng-matero/extensions/core';
import { MomentDatetimeAdapter } from '@ng-matero/extensions-moment-adapter';
import { slideInOutRight } from 'src/app/_common/animations';
import { Feeder } from 'src/app/_classes/feeder';
import { Storage } from 'src/app/_classes/storage';

export interface DialogData {
  times: string[];
}

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  providers: [
    {
      provide: DatetimeAdapter,
      useClass: MomentDatetimeAdapter,
    },
    {
      provide: MTX_DATETIME_FORMATS,
      useValue: {
        parse: {
          dateInput: 'YYYY-MM-DD',
          monthInput: 'MMMM',
          yearInput: 'YYYY',
          timeInput: 'HH:mm',
          datetimeInput: 'YYYY-MM-DD HH:mm',
        },
        display: {
          dateInput: 'YYYY-MM-DD',
          monthInput: 'MMMM',
          yearInput: 'YYYY',
          timeInput: 'HH:mm',
          datetimeInput: 'YYYY-MM-DD HH:mm',
          monthYearLabel: 'YYYY MMMM',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
          popupHeaderDateLabel: 'MMM DD, ddd',
        },
      },
    },
  ],
  animations: [slideInOutRight],
})
export class SettingsComponent implements OnInit {
  // Boolean, ob System im DarkMode ist
  @Input() darkMode: boolean = false;

  // Boolean, ob RangeData versteckt werden soll
  @Input() hideRangeData: boolean = false;

  // Boolean, ob Settings angezeigt werden sollen
  showSettingsDiv = false;

  // Breite der Settings
  settingsDivWidth: string | undefined;

  // Boolean, ob alle Range Data vom Server angezeigt werden soll
  isCheckedShowAllRange = false;

  // Boolean, ob Anwendung im Desktop-Modus ist
  isDesktop: boolean | undefined;

  // Boolean, ob RangeData nach Feedern angezeigt werden soll
  markRangeDataByFeeder: boolean = false;

  // Boolean, ob RangeData nach Höhe angezeigt werden soll
  markRangeDataByHeight: boolean = false;

  // Boolean, ob Toggle-Switch "hideRangeData" disabled angezeigt werden soll
  disableRangeData: boolean = true;

  // String-Array für Ergebnis aus DateTimePickern
  times: Date[] = [];

  // Referenz zu DialogCustomRangeDataComponent
  dialogRef;

  // STartzeit vom Datetimepicker
  @Input() selectedStarttime: Date | null | undefined;

  // STartzeit vom Datetimepicker
  @Input() selectedEndtime: Date | null | undefined;

  // Einstellungen für Datetime-Picker
  type: MtxDatetimepickerType = 'datetime';
  mode: MtxDatetimepickerMode = 'auto';
  startView: MtxCalendarView = 'month';
  multiYearSelector = false;
  touchUi = false;
  twelvehour = false;
  timeInterval = 1;
  timeInput = true;

  datetimeStart = new UntypedFormControl();
  datetimeEnd = new UntypedFormControl();

  // Ausgewählte Start- und Endzeit als DateString zur Anzeige im FrontEnd
  timesAsDateStrings: String[] | undefined;

  // Booleans für Toggles (mit Default-Werten, wenn nötig)
  showAircraftLabels: boolean = false;
  showAirports: boolean = true;
  showOpenskyPlanes: boolean = false;
  showAirplanesLivePlanes: boolean = false;
  showIss: boolean = true;
  showAircraftPositions: boolean = true;
  showOnlyMilitaryPlanes: boolean = false;

  // Boolean, ob Range Data verbunden angezeigt werden soll
  showFilteredRangeDatabyFeeder: boolean | undefined;

  // Liste an Feeder (Verlinkung zu Globals, enthält 'All Feeder'-Feeder)
  listFeeder: any;

  // Ausgewählte Feeder in Multi-Select
  selectedFeeder: Feeder[] = [];

  // Ausgewählte Feeder für Range Data in Multi-Select
  selectedFeederRangeData: Feeder[] = [];

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

  private ngUnsubscribe = new Subject();

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

    this.toggleDarkMode(Storage.getPropertyFromLocalStorage('darkMode', false));

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
      1.3
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
  }

  ngOnInit(): void {
    // Initiiere Abonnements
    this.initSubscriptions();

    // Hole IP-Adresse des Servers aus Environment
    this.serverAddress = environment.baseUrl;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
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
        } else {
          // Setze Variable auf 'Desktop'
          this.isDesktop = true;
          this.settingsDivWidth = '20rem';
        }
      });

    // Weise Liste an Feeder zu
    this.settingsService.listFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((listFeeder) => {
        this.listFeeder = listFeeder;

        // Füge default-Liste an Feedern hinzu
        this.selectedFeeder.push(...listFeeder);
        this.selectedFeederRangeData.push(...listFeeder);

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
   * Methode erstellt ein Array mit Timestamps aus der bestimmten
   * Start- und EndZeit und ruft Methode zum Senden dieser an die
   * Map-Komponente auf. Methode wird durch Button "Show Data"
   * aufgerufen
   */
  showRangeDataBetweenCustomTimestamps() {
    if (this.selectedStarttime && this.selectedEndtime) {
      // Wandle Dates in timestamps um
      let timesAsTimestamps = [
        new Date(this.selectedStarttime).getTime(),
        new Date(this.selectedEndtime).getTime(),
      ];

      this.showRangeDataBetweenTimestamps(timesAsTimestamps);
    }
  }

  /**
   * Zeigt RangeData eines bestimmten Zeitraumes an
   */
  showRangeDataBetweenTimestamps(timesAsTimestampsArray: number[]) {
    if (timesAsTimestampsArray[0] && timesAsTimestampsArray[1]) {
      // Enable Toggle-Switch "hideRangeData"
      this.disableRangeData = false;

      // Zeige ausgewählte Zeit formatiert im FrontEnd an
      this.timesAsDateStrings = [
        new Date(timesAsTimestampsArray[0]).toLocaleDateString() +
          ' ' +
          new Date(timesAsTimestampsArray[0]).toLocaleTimeString(),
        new Date(timesAsTimestampsArray[1]).toLocaleDateString() +
          ' ' +
          new Date(timesAsTimestampsArray[1]).toLocaleTimeString(),
      ];

      let selectedFeederNames = this.getNamesOfSelectedFeeder(
        this.selectedFeederRangeData
      );

      // Kontaktiere Map-Komponente, damit Server-Aufruf
      // gemacht wird mit Start- und Endzeit
      this.settingsService.showRangeDataBetweenTimestamps(
        selectedFeederNames,
        timesAsTimestampsArray
      );
    }
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

  /**
   * Methode zeigt oder versteckt die RangeData
   * @param event MatSlideToggleChange
   */
  toggleHideRangeData(event: MatSlideToggleChange) {
    this.hideRangeData = event.checked;

    // Kontaktiere Map-Component und übergebe hideRangeData-Boolean
    this.settingsService.toggleHideRangeData(this.hideRangeData);
  }

  /**
   * Methode markiert die RangeData farblich nach den Feedern
   * @param event MatSlideToggleChange
   */
  toggleMarkRangeDataByFeeder(event: MatSlideToggleChange) {
    this.markRangeDataByFeeder = event.checked;

    // Unchecke den Button "Filter by Height" und sorge für eine
    // Default-Ausgangsbasis, indem die Points wieder auf Default
    // zurückgesetzt werden. Nur ein Toggle-Switch ist zur Zeit aktiv
    // (a little hacky)
    if (this.markRangeDataByHeight) {
      this.toggleMarkRangeDataByHeight(
        new MatSlideToggleChange(event.source, !event.checked)
      );
    }

    // Kontaktiere Map-Component und übergebe
    // isCheckedFilterRangeDataByFeeder-Boolean
    this.settingsService.toggleMarkRangeDataByFeeder(
      this.markRangeDataByFeeder
    );
  }

  /**
   * Methode zeigt die RangeData der laufenden Stunde an
   */
  showRangeDataLastHour() {
    let startTime;
    let endTime;

    // Bestimme aktuelle Zeit
    let currentDate = new Date();

    // Erstelle Start- und EndZeit
    startTime = currentDate.setHours(currentDate.getHours() - 1);
    endTime = currentDate.setHours(currentDate.getHours() + 1);

    this.showRangeDataBetweenTimestamps([startTime, endTime]);
  }

  /**
   * Methode zeigt die RangeData des aktuellen Tages an
   */
  showRangeDataToday() {
    let startTime;
    let endTime;

    // Bestimme aktuelle Zeit
    let currentDate = new Date();

    // Erstelle Start- und EndZeit
    startTime = currentDate.setHours(0, 0, 0);
    endTime = currentDate.setHours(23, 59, 59);

    this.showRangeDataBetweenTimestamps([startTime, endTime]);
  }

  /**
   * Methode zeigt die RangeData der letzten 7 Tage an
   */
  showRangeDataLastSevenDays() {
    let startTime;
    let endTime;

    // Bestimme aktuelle Zeit
    let currentDate = new Date();

    // Erstelle Start- und EndZeit
    endTime = currentDate.getTime();
    startTime = new Date(
      currentDate.setDate(currentDate.getDate() - 7)
    ).getTime();

    this.showRangeDataBetweenTimestamps([startTime, endTime]);
  }

  /**
   * Methode markiert die RangeData nach der Höhe
   * @param event MatSlideToggleChange
   */
  toggleMarkRangeDataByHeight(event: MatSlideToggleChange) {
    this.markRangeDataByHeight = event.checked;

    // Unchecke den Button "Filter by Feeder" und sorge für eine
    // Default-Ausgangsbasis, indem die Points wieder auf Default
    // zurückgesetzt werden. Nur ein Toggle-Switch ist zur Zeit aktiv
    // (a little hacky)
    if (this.markRangeDataByFeeder) {
      this.toggleMarkRangeDataByFeeder(
        new MatSlideToggleChange(event.source, !event.checked)
      );
    }

    // Kontaktiere Map-Component und übergebe
    // filterRangeDataByHeight-Boolean
    this.settingsService.toggleMarkRangeDataByHeight(
      this.markRangeDataByHeight
    );
  }

  /**
   * Zeige Range Data der selektierten Feeder an
   */
  selectRangeDataByFeeder() {
    let selectedFeederNames = this.getNamesOfSelectedFeeder(
      this.selectedFeederRangeData
    );

    // Kontaktiere Map-Component und übergebe selectFeeder-Name
    this.settingsService.selectRangeDataByFeeder(selectedFeederNames);
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
    this.darkMode = checked;

    Storage.savePropertyInLocalStorage('darkMode', this.darkMode);

    // Kontaktiere Map-Component und übergebe showDarkMode-Boolean
    this.settingsService.toggleDarkMode(this.darkMode);
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
}
