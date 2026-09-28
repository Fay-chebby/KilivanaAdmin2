import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditInspector } from './edit-inspector';

describe('EditInspector', () => {
  let component: EditInspector;
  let fixture: ComponentFixture<EditInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
