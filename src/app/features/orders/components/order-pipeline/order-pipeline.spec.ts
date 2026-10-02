import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderPipeline } from './order-pipeline';

describe('OrderPipeline', () => {
  let component: OrderPipeline;
  let fixture: ComponentFixture<OrderPipeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderPipeline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderPipeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
