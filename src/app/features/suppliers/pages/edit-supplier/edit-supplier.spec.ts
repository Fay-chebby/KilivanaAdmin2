import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSupplier } from './edit-supplier';

describe('EditSupplier', () => {
  let component: EditSupplier;
  let fixture: ComponentFixture<EditSupplier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSupplier]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSupplier);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
