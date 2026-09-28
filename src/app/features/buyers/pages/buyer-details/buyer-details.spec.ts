import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyerDetails } from './buyer-details';

describe('BuyerDetails', () => {
  let component: BuyerDetails;
  let fixture: ComponentFixture<BuyerDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyerDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyerDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
