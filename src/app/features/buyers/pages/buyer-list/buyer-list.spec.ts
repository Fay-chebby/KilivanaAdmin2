import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyerList } from './buyer-list';

describe('BuyerList', () => {
  let component: BuyerList;
  let fixture: ComponentFixture<BuyerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
