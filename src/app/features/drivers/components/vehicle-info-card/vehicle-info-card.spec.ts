import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleInfoCard } from './vehicle-info-card';

describe('VehicleInfoCard', () => {
  let component: VehicleInfoCard;
  let fixture: ComponentFixture<VehicleInfoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleInfoCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleInfoCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
