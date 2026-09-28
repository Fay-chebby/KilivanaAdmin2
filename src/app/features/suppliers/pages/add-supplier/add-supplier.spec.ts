import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSupplier } from './add-supplier';

describe('AddSupplier', () => {
  let component: AddSupplier;
  let fixture: ComponentFixture<AddSupplier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSupplier]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSupplier);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
