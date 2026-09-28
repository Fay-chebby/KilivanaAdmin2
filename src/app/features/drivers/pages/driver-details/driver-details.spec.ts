import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverDetails } from './driver-details';

describe('DriverDetails', () => {
  let component: DriverDetails;
  let fixture: ComponentFixture<DriverDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
