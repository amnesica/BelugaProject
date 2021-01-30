import { TestBed } from '@angular/core/testing';

import { AircraftTableService } from './aircraft-table-service.service';

describe('AircraftTableService', () => {
  let service: AircraftTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AircraftTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
