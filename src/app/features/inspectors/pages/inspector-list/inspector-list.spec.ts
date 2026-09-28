import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorList } from './inspector-list';

describe('InspectorList', () => {
  let component: InspectorList;
  let fixture: ComponentFixture<InspectorList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectorList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
