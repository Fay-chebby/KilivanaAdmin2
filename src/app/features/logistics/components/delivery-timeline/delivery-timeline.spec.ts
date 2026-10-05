import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryTimeline } from './delivery-timeline';

describe('DeliveryTimeline', () => {
  let component: DeliveryTimeline;
  let fixture: ComponentFixture<DeliveryTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryTimeline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryTimeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
