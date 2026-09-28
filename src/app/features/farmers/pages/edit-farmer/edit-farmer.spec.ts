import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFarmer } from './edit-farmer';

describe('EditFarmer', () => {
  let component: EditFarmer;
  let fixture: ComponentFixture<EditFarmer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFarmer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFarmer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
