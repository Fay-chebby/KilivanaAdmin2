import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDriver } from './edit-driver';

describe('EditDriver', () => {
  let component: EditDriver;
  let fixture: ComponentFixture<EditDriver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDriver]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDriver);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
