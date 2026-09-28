import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderItemsTable } from './order-items-table';

describe('OrderItemsTable', () => {
  let component: OrderItemsTable;
  let fixture: ComponentFixture<OrderItemsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderItemsTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderItemsTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
