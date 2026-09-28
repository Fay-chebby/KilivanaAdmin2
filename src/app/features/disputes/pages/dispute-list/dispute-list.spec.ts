import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisputeList } from './dispute-list';

describe('DisputeList', () => {
  let component: DisputeList;
  let fixture: ComponentFixture<DisputeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisputeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisputeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
