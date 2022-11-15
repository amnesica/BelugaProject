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
  private aircraftSelectUnselectInTableSource = new Subject<Aircraft>();
  private unselectAllPlanesInTableSource = new Subject<boolean>();

  // Observable streams
  aircraftList$ = this.aircraftListSource.asObservable();
  isDesktop$ = this.isDesktopSource.asObservable();
  hexMarkUnmarkAircraft$ = this.hexMarkUnmarkAircraftSource.asObservable();
  aircraftSelectUnselectInTable$ =
    this.aircraftSelectUnselectInTableSource.asObservable();
  unselectAllPlanesInTable$ =
    this.unselectAllPlanesInTableSource.asObservable();

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
    this.aircraftSelectUnselectInTableSource.next(aircraft);
    return this.aircraftSelectUnselectInTableSource;
  }

  unselectAllPlanesInTable() {
    this.unselectAllPlanesInTableSource.next();
    return this.unselectAllPlanesInTableSource;
  }
}
