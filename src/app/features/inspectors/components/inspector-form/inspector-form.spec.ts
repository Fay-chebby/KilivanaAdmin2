import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorForm } from './inspector-form';

describe('InspectorForm', () => {
  let component: InspectorForm;
  let fixture: ComponentFixture<InspectorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectorForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
