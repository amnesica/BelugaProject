import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CesiumService {
  // Observable sources
  private updateAircraftSource = new Subject<any>();
  private unmarkAircraftSource = new Subject<any>();

  // Observable streams
  updateAircraftSource$ = this.updateAircraftSource.asObservable();
  unmarkAircraftSource$ = this.unmarkAircraftSource.asObservable();

  // Wenn neues Aircraft angeklickt/markiert wird
  updateAircraft(aircraft: any) {
    this.updateAircraftSource.next(aircraft);
    return this.updateAircraftSource;
  }

  // Löschen alle Entitäten eines Flugzeugs, wenn dieses
  // nicht mehr markiert ist
  unmarkAircraft() {
    this.unmarkAircraftSource.next(true);
    return this.unmarkAircraftSource;
  }
}
