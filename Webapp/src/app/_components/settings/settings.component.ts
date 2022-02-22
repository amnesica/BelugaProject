import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Helper } from 'src/app/_classes/helper';
import { ServerService } from 'src/app/_services/server-service/server-service.service';
import { environment } from 'src/environments/environment';
import { Globals } from 'src/app/_common/globals';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DialogData {
  times: string[];
}

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
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

  // Datetime-Picker
  @ViewChild('picker1') picker: any;
  @ViewChild('picker2') picker2: any;

  // Einstellungen für Datetime-Picker
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  // Picker wird als Modal-Dialog angezeigt
  public touchUi = true;
  public enableMeridian = false;
  public minDate!: Date;
  public maxDate!: Date;
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = 'primary';
  public disableMinute = false;
  public hideTime = false;
  public dateControlStart = new FormControl(null);
  public dateControlEnd = new FormControl(null);
  public formGroup = new FormGroup({
    date: new FormControl(null, [Validators.required]),
    date2: new FormControl(null, [Validators.required]),
  });
  public options = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ];
  public listColors = ['primary', 'accent', 'warn'];
  public stepHours = [1, 2, 3, 4, 5];
  public stepMinutes = [1, 5, 10, 15, 20, 25];
  public stepSeconds = [1, 5, 10, 15, 20, 25];

  // Ausgewählte Start- und Endzeit als DateString zur Anzeige im FrontEnd
  timesAsDateStrings: String[] | undefined;

  // Booleans für Toggles (mit Default-Werten, wenn nötig)
  showAircraftLabels: boolean | undefined;
  showAirports: boolean = true;
  showOpenskyPlanes: boolean | undefined;
  showIss: boolean = true;

  // Boolean, ob Range Data verbunden angezeigt werden soll
  showFilteredRangeDatabyFeeder: boolean | undefined;

  // Liste an Feeder (Verlinkung zu Globals)
  listFeeder: any;

  // Ausgewählte Feeder in Multi-Select
  selectedFeederArray = new FormControl();

  // App-Name
  appName: any;

  // App-Version
  appVersion: any;

  // Boolean, ob POMD-Point angezeigt werden soll
  showPOMDPoint: boolean | undefined;

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

  constructor(
    public settingsService: SettingsService,
    public breakpointObserver: BreakpointObserver,
    public serverService: ServerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Initiiere Abonnements
    this.initSubscriptions();

    // Prüfe WebGL-Support des Browsers und
    // setze Default-Boolean entsprechend
    this.checkWebglSupport();

    // Hole IP-Adresse des Servers aus Environment
    this.serverAddress = environment.baseUrl;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Prüfe WebGL-Support des Browsers und setze Default-Boolean entsprechend.
   * Sollte WebGL nicht supportet werden, wird der Toggle deaktiviert
   */
  checkWebglSupport() {
    const webglSupported = Helper.detectWebGL();
    if (webglSupported == 1) {
      this.webgl = true;
    } else if (webglSupported == 0) {
      this.webgl = false;
      console.log(
        'WebGL is currently disabled in your browser. For better performance enable WebGL.'
      );
    } else {
      this.webgl = false;
      console.log(
        'WebGL is not supported in your browser. For better performance use a browser with WebGL support.'
      );
    }

    // Deaktiviere Toggle, wenn WebGL nicht unterstützt wird
    if (!this.webgl) {
      this.webglNotSupported = true;
    }

    // Setze Boolean, ob WebGL beim Start der Anwendung benutzt werden soll
    Globals.useWebglOnStartup = this.webgl;
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
      .subscribe((listFeeder) => (this.listFeeder = listFeeder));

    // Weise App-Name und App-Version zu
    this.settingsService.appNameAndVersion$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((appNameAndVersion) => {
        this.appName = appNameAndVersion[0];
        this.appVersion = appNameAndVersion[1];
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
  }

  /**
   * Methode erstellt ein Array mit Timestamps aus der bestimmten
   * Start- und EndZeit und ruft Methode zum Senden dieser an die
   * Map-Komponente auf. Methode wird durch Button "Show Data"
   * aufgerufen
   */
  showRangeDataBetweenCustomTimestamps() {
    if (this.times[0] && this.times[1]) {
      // Wandle Dates in timestamps um
      let timesAsTimestamps = [
        new Date(this.times[0]).getTime(),
        new Date(this.times[1]).getTime(),
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

      // Kontaktiere Map-Komponente, damit Server-Aufruf
      // gemacht wird mit Start- und Endzeit
      this.settingsService.showRangeDataBetweenTimestamps(
        timesAsTimestampsArray
      );
    }
  }

  /**
   * Methode zeigt oder versteckt die Labels der Flugzeuge
   * @param event MatSlideToggleChange
   */
  toggleAircraftLabels(event: MatSlideToggleChange) {
    this.showAircraftLabels = event.checked;

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
    if (this.selectedFeederArray.value) {
      // Kontaktiere Map-Component und übergebe
      // selectFeeder-Name
      this.settingsService.selectRangeDataByFeeder(
        this.selectedFeederArray.value
      );
    }
  }

  /**
   * Selektiere Flugzeuge nach dem ausgewählten Feeder
   */
  selectPlanesByFeeder() {
    // Kontaktiere Map-Component und übergebe
    // selectFeeder-Name
    this.settingsService.selectPlanesByFeeder(this.selectedFeederArray.value);
  }

  /**
   * Methode zeigt oder versteckt die Flughäfen
   * auf der Karte
   * @param event MatSlideToggleChange
   */
  toggleAirports(event: MatSlideToggleChange) {
    this.showAirports = event.checked;

    // Kontaktiere Map-Component und übergebe toggleAirports-Boolean
    this.settingsService.toggleAirports(this.showAirports);
  }

  /**
   * Refreshe Flugzeuge nach ausgewähltem Feeder
   */
  refreshSelectedFeeder() {
    if (this.selectedFeederArray.value) {
      this.selectPlanesByFeeder();
    }
  }

  /**
   * Toggle Anzeige der Opensky Flugzeuge
   */
  toggleOpenskyPlanes(event: MatSlideToggleChange) {
    this.showOpenskyPlanes = event.checked;

    // Kontaktiere Map-Component und übergebe showOpenskyPlanes-Boolean
    this.settingsService.toggleOpenskyPlanes(this.showOpenskyPlanes);
  }

  /**
   * Toggle Anzeige der ISS
   */
  toggleIss(event: MatSlideToggleChange) {
    this.showIss = event.checked;

    // Kontaktiere Map-Component und übergebe showIss-Boolean
    this.settingsService.toggleIss(this.showIss);
  }

  /**
   * Toggle Dark Mode
   * @param event MatSlideToggleChange
   */
  toggleDarkMode(event: MatSlideToggleChange) {
    this.darkMode = event.checked;

    // Kontaktiere Map-Component und übergebe showDarkMode-Boolean
    this.settingsService.toggleDarkMode(this.darkMode);
  }

  /**
   * Toggle WebGL
   * @param event MatSlideToggleChange
   */
  toggleWebgl(event: MatSlideToggleChange) {
    this.webgl = event.checked;

    // Kontaktiere Map-Component und übergebe WebGL-Boolean
    this.settingsService.toggleWebgl(this.webgl);
  }

  /**
   * Toggle POMD-Point
   * @param event MatSlideToggleChange
   */
  togglePOMDPoint(event: MatSlideToggleChange) {
    this.showPOMDPoint = event.checked;

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
   * @param event MatSlideToggleChange
   */
  toggleDevicePositionAsBasis(event: MatSlideToggleChange) {
    this.devicePositionAsBasis = event.checked;

    if (Globals.DevicePosition === undefined) {
      console.log(
        'Device position needs to be set before enabling this toggle!'
      );
      this.openSnackbar(
        'Device position needs to be set before enabling this toggle'
      );
      this.devicePositionAsBasis = false;
    } else {
      // Kontaktiere Map-Component und übergebe devicePositionAsBasis-Boolean
      this.settingsService.toggleDevicePositionAsBasis(
        this.devicePositionAsBasis
      );
    }
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
}
