import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerForm } from './farmer-form';

describe('FarmerForm', () => {
  let component: FarmerForm;
  let fixture: ComponentFixture<FarmerForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmerForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
