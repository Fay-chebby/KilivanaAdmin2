import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerList } from './farmer-list';

describe('FarmerList', () => {
  let component: FarmerList;
  let fixture: ComponentFixture<FarmerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
