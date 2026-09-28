import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniStatsRow } from './mini-stats-row';

describe('MiniStatsRow', () => {
  let component: MiniStatsRow;
  let fixture: ComponentFixture<MiniStatsRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniStatsRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniStatsRow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
