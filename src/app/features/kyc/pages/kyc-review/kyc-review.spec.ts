import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycReview } from './kyc-review';

describe('KycReview', () => {
  let component: KycReview;
  let fixture: ComponentFixture<KycReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KycReview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KycReview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
