import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerDetails } from './farmer-details';

describe('FarmerDetails', () => {
  let component: FarmerDetails;
  let fixture: ComponentFixture<FarmerDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmerDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
