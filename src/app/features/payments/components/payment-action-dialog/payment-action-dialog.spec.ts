import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentActionDialog } from './payment-action-dialog';

describe('PaymentActionDialog', () => {
  let component: PaymentActionDialog;
  let fixture: ComponentFixture<PaymentActionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentActionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentActionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
