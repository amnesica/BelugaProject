import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AircraftTableComponent } from './aircraft-table.component';

describe('AircraftTableComponent', () => {
  let component: AircraftTableComponent;
  let fixture: ComponentFixture<AircraftTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AircraftTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AircraftTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
