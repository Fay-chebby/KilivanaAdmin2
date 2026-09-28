import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryList } from './delivery-list';

describe('DeliveryList', () => {
  let component: DeliveryList;
  let fixture: ComponentFixture<DeliveryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
