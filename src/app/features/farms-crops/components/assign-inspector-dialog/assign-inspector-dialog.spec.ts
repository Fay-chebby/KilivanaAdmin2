import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignInspectorDialog } from './assign-inspector-dialog';

describe('AssignInspectorDialog', () => {
  let component: AssignInspectorDialog;
  let fixture: ComponentFixture<AssignInspectorDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignInspectorDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignInspectorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
