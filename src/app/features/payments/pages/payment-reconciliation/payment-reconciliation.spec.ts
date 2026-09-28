import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentReconciliation } from './payment-reconciliation';

describe('PaymentReconciliation', () => {
  let component: PaymentReconciliation;
  let fixture: ComponentFixture<PaymentReconciliation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentReconciliation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentReconciliation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
