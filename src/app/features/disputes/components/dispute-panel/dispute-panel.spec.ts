import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisputePanel } from './dispute-panel';

describe('DisputePanel', () => {
  let component: DisputePanel;
  let fixture: ComponentFixture<DisputePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisputePanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisputePanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
