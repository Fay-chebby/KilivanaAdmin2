import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionPanel } from './inspection-panel';

describe('InspectionPanel', () => {
  let component: InspectionPanel;
  let fixture: ComponentFixture<InspectionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectionPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
