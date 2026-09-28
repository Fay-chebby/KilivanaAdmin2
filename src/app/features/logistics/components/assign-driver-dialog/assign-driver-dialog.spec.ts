import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignDriverDialog } from './assign-driver-dialog';

describe('AssignDriverDialog', () => {
  let component: AssignDriverDialog;
  let fixture: ComponentFixture<AssignDriverDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignDriverDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignDriverDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
