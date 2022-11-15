import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AircraftTableService } from 'src/app/_services/aircraft-table-service/aircraft-table-service.service';
import { Aircraft } from 'src/app/_classes/aircraft';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-aircraft-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aircraft-table.component.html',
  styleUrls: ['./aircraft-table.component.css'],
})
export class AircraftTableComponent implements OnInit {
  // Boolean, ob System im DarkMode ist
  @Input() darkMode: boolean = false;

  // Liste mit anzuzeigenden Flugzeugen
  aircraftList: any = new MatTableDataSource<Aircraft>([]);

  // Boolean, ob Tabelle angezeigt werden soll
  showAircraftTableDiv: boolean = false;

  // Breite der Tabelle
  showAircraftTableWidth: string = 'auto';

  // Breite des Filter-Divs
  filterFieldWidth: string = '60rem';

  // Anzuzeigende Spalten der Tabelle
  displayedColumns: string[] = [
    'hex',
    'flightId',
    'type',
    'registration',
    'altitude',
    'verticalRate',
    'speed',
    'track',
    'lastSeen',
    'feeder',
    'distance',
  ];

  // Parameter für Checkboxen zur Auswahl einzelner Zeilen
  initialSelection = [];
  allowMultiSelect = false;
  selection = new SelectionModel<Aircraft>(this.allowMultiSelect, []);

  @ViewChild(MatSort) sort!: MatSort;

  private ngUnsubscribe = new Subject();

  constructor(
    private aircraftTableService: AircraftTableService,
    private changeDetectorRefs: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initiiere Abonnements
    this.initSubscriptions();
  }

  ngAfterViewInit() {
    // Sortiere Liste an Flugzeugen entsprechend
    // der aktuellen Sortier-Vorgabe
    this.aircraftList.sort = this.sort;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  initSubscriptions() {
    // Ändere Breite der Tabelle im mobilen Modus
    this.aircraftTableService.isDesktop$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((isDesktop) => {
        if (isDesktop == true) {
          this.showAircraftTableWidth = 'auto';
          this.filterFieldWidth = '45rem';
        } else {
          this.showAircraftTableWidth = '100%';
          this.filterFieldWidth = '100%';
        }
      });

    // Zeige neue Daten an, wenn Flugzeuge aktualisiert wurden
    this.aircraftTableService.aircraftList$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((aircraftListNew: Aircraft[]) => {
        this.aircraftList.data = aircraftListNew;
        this.changeDetectorRefs.detectChanges();
      });

    // Markiere oder entferne Markierung bei Flugzeug
    // in Tabelle, wenn es markiert ist
    this.aircraftTableService.aircraftSelectUnselectInTable$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((aircraftToBeToggledInTable) => {
        this.aircraftList.data.forEach((aircraft) =>
          aircraft.hex == aircraftToBeToggledInTable.hex
            ? this.selection.toggle(aircraft)
            : null
        );
        this.changeDetectorRefs.detectChanges();
      });

    // Entferne Markierung bei allen Flugzeugen in der Tabelle
    this.aircraftTableService.unselectAllPlanesInTable$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.aircraftList.data.forEach((aircraft) =>
          this.selection.deselect(aircraft)
        );
        this.changeDetectorRefs.detectChanges();
      });
  }

  /**
   * Funktion zum Filtern der Tabelle
   * @param event Event
   */
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.aircraftList.filter = filterValue.trim().toLowerCase();
  }

  /**
   * Methode prüft, ob die Anzahl der ausgewählten Elemente
   * mit der Anzahl aller Elemente übereinstimmt
   */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.aircraftList.data.length;
    return numSelected === numRows;
  }

  /**
   * Die Checkbox der jeweiligen Zeile
   * @param aircraft Aircraft
   */
  checkboxLabel(aircraft?: Aircraft): string {
    if (!aircraft) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${
      this.selection.isSelected(aircraft) ? 'deselect' : 'select'
    } row ${aircraft.position.length + 1}`;
  }

  /**
   * Wird aufgerufen, wenn eine Zeile ausgewählt wird. Methode
   * triggert das Markieren des ausgewählten Flugzeugs an und
   * zentriert die Karte an die Position des Flugzeugs
   * @param $event Event
   * @param aircraft Ausgewähltes Aircraft
   */
  selectRow(aircraft) {
    if (aircraft.hex) {
      // Markiere Flugzeug auf Karte
      this.aircraftTableService.markOrUnmarkAircraftOnMap(aircraft.hex);
    }
  }
}
