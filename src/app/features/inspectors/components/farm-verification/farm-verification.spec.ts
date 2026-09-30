import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmVerification } from './farm-verification';

describe('FarmVerification', () => {
  let component: FarmVerification;
  let fixture: ComponentFixture<FarmVerification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmVerification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmVerification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
