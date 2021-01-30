import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Feeder } from '../../_classes/feeder';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  // Observable sources
  private timesAsTimestampsSource = new Subject<number[]>();
  private toggleHideRangeDataSource = new Subject<boolean>();
  private toggleMarkRangeDataByFeederSource = new Subject<boolean>();
  private toggleMarkRangeDataByHeightSource = new Subject<boolean>();
  private toggleShowAircraftLabelsSource = new Subject<boolean>();
  private listFeederSource = new Subject<Feeder[]>();
  private selectedFeederSource = new Subject<String>();
  private appNameAndVersionSource = new Subject<String[]>();

  // Observable streams
  timesAsTimestamps$ = this.timesAsTimestampsSource.asObservable();
  toggleHideRangeData$ = this.toggleHideRangeDataSource.asObservable();
  toggleMarkRangeDataByFeeder$ = this.toggleMarkRangeDataByFeederSource.asObservable();
  toggleMarkRangeDataByHeight$ = this.toggleMarkRangeDataByHeightSource.asObservable();
  toggleShowAircraftLabels$ = this.toggleShowAircraftLabelsSource.asObservable();
  listFeeder$ = this.listFeederSource.asObservable();
  selectedFeeder$ = this.selectedFeederSource.asObservable();
  appNameAndVersion$ = this.appNameAndVersionSource.asObservable();

  constructor() {}

  showRangeDataBetweenTimestamps(timesAsTimestamps: number[]) {
    this.timesAsTimestampsSource.next(timesAsTimestamps);
    return this.timesAsTimestampsSource;
  }

  toggleHideRangeData(hideRangeData: boolean) {
    this.toggleHideRangeDataSource.next(hideRangeData);
    return this.toggleHideRangeDataSource;
  }

  toggleMarkRangeDataByFeeder(markRangeDataByFeeder: boolean) {
    this.toggleMarkRangeDataByFeederSource.next(markRangeDataByFeeder);
    return this.toggleMarkRangeDataByFeederSource;
  }

  toggleMarkRangeDataByHeight(markRangeDataByHeight: boolean) {
    this.toggleMarkRangeDataByHeightSource.next(markRangeDataByHeight);
    return this.toggleMarkRangeDataByHeightSource;
  }

  toggleAircraftLabels(showAircraftLabels: boolean) {
    this.toggleShowAircraftLabelsSource.next(showAircraftLabels);
    return this.toggleShowAircraftLabelsSource;
  }

  sendReceiveListFeeder(listFeeder: Feeder[]) {
    this.listFeederSource.next(listFeeder);
    return this.listFeederSource;
  }

  selectRangeDataByFeeder(selectedFeederArray: String) {
    this.selectedFeederSource.next(selectedFeederArray);
    return this.selectedFeederSource;
  }

  sendReceiveAppNameAndVersion(appNameAndVersion: String[]) {
    this.appNameAndVersionSource.next(appNameAndVersion);
    return this.appNameAndVersionSource;
  }
}
