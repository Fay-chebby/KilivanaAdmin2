import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductReports } from './product-reports';

describe('ProductReports', () => {
  let component: ProductReports;
  let fixture: ComponentFixture<ProductReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
