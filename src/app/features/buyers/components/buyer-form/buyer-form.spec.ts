import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyerForm } from './buyer-form';

describe('BuyerForm', () => {
  let component: BuyerForm;
  let fixture: ComponentFixture<BuyerForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyerForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyerForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
