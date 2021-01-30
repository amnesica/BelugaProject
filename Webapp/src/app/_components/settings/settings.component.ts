import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

export interface DialogData {
  times: string[];
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  // Boolean, ob Settings angezeigt werden sollen
  showSettingsDiv = false;

  // Breite der Settings
  settingsDivWidth: string | undefined;

  // Boolean, ob alle Range Data vom Server angezeigt werden soll
  isCheckedShowAllRange = false;

  // Boolean, ob Anwendung im Desktop-Modus ist
  isDesktop: boolean | undefined;

  // Boolean, ob RangeData versteckt werden soll
  hideRangeData: boolean = false;

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

  // Boolean, ob Flugzeug-Label gezeigt werden sollen
  showAircraftLabels: boolean | undefined;

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

  constructor(
    public settingsService: SettingsService,
    public breakpointObserver: BreakpointObserver
  ) {
    // Weise Liste an Feeder zu
    this.settingsService.listFeeder$.subscribe(
      (listFeeder) => (this.listFeeder = listFeeder)
    );

    // Weise App-Name und App-Version zu
    this.settingsService.appNameAndVersion$.subscribe((appNameAndVersion) => {
      this.appName = appNameAndVersion[0];
      this.appVersion = appNameAndVersion[1];
    });
  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
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
}
