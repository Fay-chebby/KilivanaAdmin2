import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFarmer } from './add-farmer';

describe('AddFarmer', () => {
  let component: AddFarmer;
  let fixture: ComponentFixture<AddFarmer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFarmer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFarmer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
