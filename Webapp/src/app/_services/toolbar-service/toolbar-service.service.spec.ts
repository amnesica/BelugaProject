import { TestBed } from '@angular/core/testing';

import { ToolbarService } from './toolbar-service.service';

describe('ToolbarServiceService', () => {
  let service: ToolbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
