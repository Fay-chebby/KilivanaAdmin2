import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverActionDialog } from './driver-action-dialog';

describe('DriverActionDialog', () => {
  let component: DriverActionDialog;
  let fixture: ComponentFixture<DriverActionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverActionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverActionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
