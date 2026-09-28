import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddInspector } from './add-inspector';

describe('AddInspector', () => {
  let component: AddInspector;
  let fixture: ComponentFixture<AddInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddInspector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
