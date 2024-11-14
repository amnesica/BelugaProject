import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Aircraft } from 'src/app/_classes/aircraft';

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  // Observable sources
  private updateAircraftSource = new Subject<Aircraft>();

  // Observable streams
  updateAircraftSource$ = this.updateAircraftSource.asObservable();

  // Wenn neues Aircraft angeklickt/markiert wird
  updateAircraft(aircraft: Aircraft) {
    this.updateAircraftSource.next(aircraft);
    return this.updateAircraftSource;
  }
}
