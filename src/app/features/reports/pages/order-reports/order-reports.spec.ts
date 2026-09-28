import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderReports } from './order-reports';

describe('OrderReports', () => {
  let component: OrderReports;
  let fixture: ComponentFixture<OrderReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
