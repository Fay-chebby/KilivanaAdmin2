import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmList } from './farm-list';

describe('FarmList', () => {
  let component: FarmList;
  let fixture: ComponentFixture<FarmList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
