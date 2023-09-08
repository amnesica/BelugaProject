import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CesiumService {
  // Observable sources
  private aircraftSource = new Subject<any>();
  private aircraftChangedPositionSource = new Subject<any>();

  // Observable streams
  aircraftSource$ = this.aircraftSource.asObservable();
  aircraftChangedPositionSource$ =
    this.aircraftChangedPositionSource.asObservable();

  // Wenn neues Aircraft angeklickt/markiert wird
  updateAircraft(aircraft: any) {
    this.aircraftSource.next(aircraft);
    return this.aircraftSource;
  }

  // Wenn Trail des aktuelle angeklickten Aircraft aktualisiert wurde
  updateView(aircraft: any) {
    this.aircraftChangedPositionSource.next(aircraft);
    return this.aircraftChangedPositionSource;
  }
}
