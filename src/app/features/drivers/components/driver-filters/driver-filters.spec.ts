import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverFilters } from './driver-filters';

describe('DriverFilters', () => {
  let component: DriverFilters;
  let fixture: ComponentFixture<DriverFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
