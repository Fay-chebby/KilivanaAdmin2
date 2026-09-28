import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverStatusBadge } from './driver-status-badge';

describe('DriverStatusBadge', () => {
  let component: DriverStatusBadge;
  let fixture: ComponentFixture<DriverStatusBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverStatusBadge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverStatusBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
