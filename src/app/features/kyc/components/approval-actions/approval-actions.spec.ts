import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalActions } from './approval-actions';

describe('ApprovalActions', () => {
  let component: ApprovalActions;
  let fixture: ComponentFixture<ApprovalActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalActions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalActions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
