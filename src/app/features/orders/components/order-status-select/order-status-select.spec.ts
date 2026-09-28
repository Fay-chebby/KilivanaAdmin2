import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderStatusSelect } from './order-status-select';

describe('OrderStatusSelect', () => {
  let component: OrderStatusSelect;
  let fixture: ComponentFixture<OrderStatusSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderStatusSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
