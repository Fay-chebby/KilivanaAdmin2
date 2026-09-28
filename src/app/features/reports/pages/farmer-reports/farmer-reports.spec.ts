import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerReports } from './farmer-reports';

describe('FarmerReports', () => {
  let component: FarmerReports;
  let fixture: ComponentFixture<FarmerReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmerReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
