import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Aircraft } from '../../_classes/aircraft';
import { Globals } from 'src/app/_common/globals';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-info',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css'],
})
export class InfoComponent implements OnInit {
  // Flugzeug, wofür die Info angezeigt wird als Eingabeparameter
  @Input() aircraft: Aircraft | null = null;

  // Boolean, ob System im DarkMode ist
  @Input() darkMode: boolean = false;

  // Boolean, ob große Info-Box-Variante angezeigt werden soll
  showInfoLarge: boolean | undefined;

  // Breite der Info-Box
  widthInfoBox: string | undefined;

  // Abstand top der Info-Box
  topInfoBox: string | undefined;

  // Boolean, ob es sich um einen Desktop-Browser-Fenster handelt
  isDesktop: boolean | undefined;

  // Anzahl der Spalten im Footer der Info-Box
  amountColumnsFooter: number | undefined;

  // Output-Variable, um Map-Component zu kontaktieren
  @Output() showRouteEvent = new EventEmitter<boolean>();

  // Boolean, ob Route erstellt und gezeigt werden soll in Map-Component
  showRoute: boolean = false;

  private ngUnsubscribe = new Subject();

  constructor(
    public breakpointObserver: BreakpointObserver,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Initiiere Abonnements
    this.initSubscriptions();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  initSubscriptions() {
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
    } else {
      this.widthInfoBox = '100%';
      this.topInfoBox = '0';
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
      }
    }

    // Kontaktiere Map-Component und übergebe
    // showRoute-Boolean
    this.showRouteEvent.emit(this.showRoute);
  }

  /**
   * Platzhalter für weitere Funktionalität
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
}
