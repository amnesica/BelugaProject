import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Aircraft } from 'src/app/_classes/aircraft';

@Injectable({
  providedIn: 'root',
})
export class AircraftTableService {
  // Observable sources
  private aircraftListSource = new Subject<any>();
  private isDesktopSource = new Subject<boolean>();
  private hexMarkUnmarkAircraftSource = new Subject<string>();
  private aircraftselectUnselectInTableSource = new Subject<Aircraft>();
  private unselectAllAircraftsInTableSource = new Subject<boolean>();

  // Observable streams
  aircraftList$ = this.aircraftListSource.asObservable();
  isDesktop$ = this.isDesktopSource.asObservable();
  hexMarkUnmarkAircraft$ = this.hexMarkUnmarkAircraftSource.asObservable();
  aircraftSelectUnselectInTable$ = this.aircraftselectUnselectInTableSource.asObservable();
  unselectAllAircraftsInTable$ = this.unselectAllAircraftsInTableSource.asObservable();

  constructor() {}

  updateWindowMode(isDesktop: boolean) {
    this.isDesktopSource.next(isDesktop);
    return this.isDesktopSource;
  }

  updateAircraftList(listAircraft: any) {
    this.aircraftListSource.next(listAircraft);
    return this.aircraftListSource;
  }

  markOrUnmarkAircraftOnMap(hex: string) {
    this.hexMarkUnmarkAircraftSource.next(hex);
    return this.hexMarkUnmarkAircraftSource;
  }

  selectOrUnselectAircraftInTable(aircraft: Aircraft) {
    this.aircraftselectUnselectInTableSource.next(aircraft);
    return this.aircraftselectUnselectInTableSource;
  }

  unselectAllAircraftsInTable() {
    this.unselectAllAircraftsInTableSource.next();
    return this.unselectAllAircraftsInTableSource;
  }
}
