import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisputeDetails } from './dispute-details';

describe('DisputeDetails', () => {
  let component: DisputeDetails;
  let fixture: ComponentFixture<DisputeDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisputeDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisputeDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
