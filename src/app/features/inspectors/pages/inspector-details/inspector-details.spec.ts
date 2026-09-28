import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorDetails } from './inspector-details';

describe('InspectorDetails', () => {
  let component: InspectorDetails;
  let fixture: ComponentFixture<InspectorDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectorDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
