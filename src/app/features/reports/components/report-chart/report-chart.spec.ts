import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportChart } from './report-chart';

describe('ReportChart', () => {
  let component: ReportChart;
  let fixture: ComponentFixture<ReportChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
