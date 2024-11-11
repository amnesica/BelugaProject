import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Aircraft } from '../../_classes/aircraft';
import { Globals } from 'src/app/_common/globals';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexAnnotations,
  ApexYAxis,
} from 'ng-apexcharts';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { trigger, style, animate, transition } from '@angular/animations';
import { ThemeManager } from 'src/app/_services/theme-service/theme-manager.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  annotations: ApexAnnotations;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  labels: string[];
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  yaxis: ApexYAxis;
};

@Component({
  selector: 'app-info',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
  animations: [
    trigger('slideInOutLeft', [
      transition(':enter', [
        style({ transform: '{{translateTypeValue}}' }),
        animate(
          '200ms ease-out',
          style({ transform: '{{translateTypeAxis}}(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-out',
          style({ transform: '{{translateTypeValue}}' })
        ),
      ]),
    ]),
  ],
})
export class InfoComponent implements OnInit, OnDestroy {
  // Flugzeug, wofür die Info angezeigt wird als Eingabeparameter
  @Input() aircraft: Aircraft | null = null;

  // Boolean, ob System im DarkMode ist
  darkMode: boolean = false; // TODO

  // Boolean, ob große Info-Box-Variante angezeigt werden soll
  showInfoLarge: boolean | undefined;

  // CSS für Info-Box
  widthInfoBox: string | undefined;
  topInfoBox: string | undefined;
  marginInfoBox: string | undefined;
  borderRadiusInfoBox: string | undefined;

  // Boolean, ob es sich um einen Desktop-Browser-Fenster handelt
  isDesktop: boolean = true;

  // Anzahl der Spalten im Footer der Info-Box
  amountColumnsFooter: number | undefined;

  // Output-Variable, um Map-Component zu kontaktieren
  @Output() showRouteEvent = new EventEmitter<boolean>();

  // Boolean, ob Route erstellt und gezeigt werden soll in Map-Component
  showRoute: boolean = false;

  // Altitude Chart
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  // Output-Variable, um Map-Component zu kontaktieren
  @Output() show3dMapEvent = new EventEmitter<boolean>();

  // Daten für das Altitude Chart
  altitudeData: any;

  themeManager = inject(ThemeManager);
  isDark$ = this.themeManager.isDark$;

  private ngUnsubscribe = new Subject();

  constructor(
    public breakpointObserver: BreakpointObserver,
    public snackBar: MatSnackBar,
    private settingsService: SettingsService
  ) {
    this.chartOptions = {
      series: [
        {
          name: 'Altitude',
          data: [],
        },
      ],
      chart: {
        id: 'mychart',
        type: 'area',
        height: '150',
        parentHeightOffset: 0,
        toolbar: {
          show: false,
          autoSelected: 'selection',
        },
        animations: {
          enabled: true,
          dynamicAnimation: {
            enabled: false,
          },
        },
        fontFamily: 'font-family: Roboto, Helvetica Neue, sans-serif;',
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'straight',
        width: 3,
      },
      labels: [],
      xaxis: {
        type: 'datetime',
        labels: {
          show: true,
          minHeight: 0,
          formatter: function (value: any, timestamp: number) {
            return new Date(timestamp).toLocaleTimeString('de-DE');
          },
        },
      },
      yaxis: {
        min: 0,
      },
    };
  }

  ngOnInit() {
    // Initiiere Abonnements
    this.initSubscriptions();
  }

  ngOnDestroy() {
    if (this.chart != undefined) this.chart.destroy();
    this.ngUnsubscribe.next(void 0);
    this.ngUnsubscribe.complete();
  }

  initSubscriptions() {
    this.settingsService.aircraftTrailAltitudeData$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((altitudeData) => {
        if (altitudeData) {
          this.altitudeData = altitudeData;
          this.updateAltitudeData();

          // Update auch text color, wenn view noch nicht initialisiert wurde
          this.updateThemeColorsInOptions();
        }
      });

    this.isDark$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((isDark) => {
      this.darkMode = isDark;
      this.updateThemeColorsInOptions();
    });

    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          // Setze Variable auf 'Mobile'
          this.isDesktop = false;

          // Setze Spaltenanzahl des Footers auf drei, damit "show more/less"
          // wieder eingeblendet werden kann
          this.amountColumnsFooter = 3;

          // Zeige kleine Info-Box mit Möglichkeit zur
          // großen Variante zu wechseln
          this.showSmallInfo();
        } else {
          // Setze Variable auf 'Desktop'
          this.isDesktop = true;

          // Setze Spaltenanzahl des Footers auf zwei und schließe
          // so die Lücke, die durch das Weglassen von "show more/less"
          // entsteht
          this.amountColumnsFooter = 2;

          // Zeige große Info-Box mit Möglichkeit zur
          // kleinen Variante zu wechseln
          this.showLargeInfo();
        }
      });
  }

  /**
   * Zeigt das aircraft in der Info-Box
   * @param aircraft Aircraft
   */
  public showAircraftInInfoBox(aircraft: Aircraft) {
    this.aircraft = aircraft;
  }

  /**
   * Zeigt große Variante der Info-Box (Desktop-Modus)
   */
  showLargeInfo() {
    // Setze Breite der Box
    if (this.isDesktop) {
      this.widthInfoBox = '21rem';
      this.topInfoBox = '3.5rem';
      this.marginInfoBox = '0.3rem';
      this.borderRadiusInfoBox = '15px';
    } else {
      this.widthInfoBox = '100%';
      this.topInfoBox = '0';
      this.marginInfoBox = '0';
      this.borderRadiusInfoBox = '0';
    }

    // Setze Variable, dass große Info-Box
    // gezeigt werden soll
    this.showInfoLarge = true;
  }

  /**
   * Zeigt kleine Variante der Info-Box (Mobile-Modus)
   */
  showSmallInfo() {
    // Setze Breite der Box
    if (this.isDesktop) {
      this.widthInfoBox = '21rem';
    } else {
      this.widthInfoBox = '100%';
    }

    // Setze Variable, dass große Info-Box
    // nicht gezeigt werden soll
    this.showInfoLarge = false;
  }

  /**
   * Schließt die Info-Box
   */
  closeInfoBox() {
    Globals.displayAircraftInfoLarge = false;
  }

  /**
   * Methode, die Map-Component kontaktiert
   * und anweist eine Route zu zeichnen und
   * darzustellen
   */
  toggleShowAircraftRoute() {
    // toggle showRoute
    if (this.showRoute) {
      this.showRoute = false;
    } else {
      // Setze showRoute nur auf true, wenn das Flugzeug auch die
      // Positionen des Herkunfts- und Zielorts hat
      if (
        this.aircraft &&
        this.aircraft.positionOrg &&
        this.aircraft.positionDest
      ) {
        this.showRoute = true;
      } else {
        this.openSnackBar('No route info available', 'OK');
      }
    }

    // Kontaktiere Map-Component und übergebe
    // showRoute-Boolean
    this.showRouteEvent.emit(this.showRoute);
  }

  /**
   * Zeige eine Snackbar mit message und action string
   */
  openSnackBar(message: string, action: string) {
    if (this.showInfoLarge) {
      // Zeige in Desktop-Ansicht die Snackbar unten
      this.snackBar.open(message, action, {
        duration: 2000,
        verticalPosition: 'bottom',
      });
    } else {
      // Zeige in Mobile-Ansicht die Snackbar oben
      this.snackBar.open(message, action, {
        duration: 2000,
        verticalPosition: 'top',
      });
    }
  }

  roundValue(altitude: number) {
    return Math.round(altitude);
  }

  /**
   * Updated die Daten (x und y) des Altitude Charts
   */
  updateAltitudeData() {
    if (this.altitudeData == undefined || this.chart == undefined) return;
    this.chart.updateSeries(this.altitudeData);
  }

  /**
   * Updated die Farben des Altitude Charts nach Dark-Mode
   */
  updateThemeColorsInOptions(): void {
    if (this.chart == undefined) return;

    const newTextColor = this.darkMode ? '#fff' : '#000';
    const newBackgroundColor = this.darkMode ? '#383838' : '#efeff4';

    let newOptions = {
      chart: {
        foreColor: newTextColor,
        background: newBackgroundColor,
        id: 'mychart',
      },
    };

    this.chart.updateOptions(newOptions);
  }

  /**
   * Methode, die Map-Component kontaktiert
   * und anweist die 3d-Map anzuzeigen oder
   * nicht
   */
  toggleShow3dMap() {
    if (this.aircraft?.altitude == undefined) {
      this.openSnackBar(
        'Current aircraft has no altitude. 3D view is not available',
        'OK'
      );
      return;
    }

    // Kontaktiere Map-Component
    this.show3dMapEvent.emit();
  }

  getAnimationTransformAxisValue(): string {
    return this.isDesktop ? 'translateX' : 'translateY';
  }

  getAnimationTransformValue(): string {
    return this.isDesktop ? 'translateX(-100%)' : 'translateY(100%)';
  }
}
