import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationPanel } from './verification-panel';

describe('VerificationPanel', () => {
  let component: VerificationPanel;
  let fixture: ComponentFixture<VerificationPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificationPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
