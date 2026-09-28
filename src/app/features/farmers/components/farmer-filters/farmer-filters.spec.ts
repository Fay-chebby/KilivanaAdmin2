import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerFilters } from './farmer-filters';

describe('FarmerFilters', () => {
  let component: FarmerFilters;
  let fixture: ComponentFixture<FarmerFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmerFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
