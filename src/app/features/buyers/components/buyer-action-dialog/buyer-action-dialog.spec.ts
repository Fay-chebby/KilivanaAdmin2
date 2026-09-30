import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyerActionDialog } from './buyer-action-dialog';

describe('BuyerActionDialog', () => {
  let component: BuyerActionDialog;
  let fixture: ComponentFixture<BuyerActionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyerActionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyerActionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
