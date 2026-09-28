import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderChart } from './order-chart';

describe('OrderChart', () => {
  let component: OrderChart;
  let fixture: ComponentFixture<OrderChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
