import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderActionDialog } from './order-action-dialog';

describe('OrderActionDialog', () => {
  let component: OrderActionDialog;
  let fixture: ComponentFixture<OrderActionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderActionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderActionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
