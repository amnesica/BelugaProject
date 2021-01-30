import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToolbarService {
  // Observable sources
  private counterAircraftSource = new Subject<number>();

  // Observable streams
  counterAircraft$ = this.counterAircraftSource.asObservable();

  constructor() {}

  updateAircraftCounter(counterAircraft: number) {
    this.counterAircraftSource.next(counterAircraft);
    return this.counterAircraftSource;
  }
}
