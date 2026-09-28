import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBuyer } from './add-buyer';

describe('AddBuyer', () => {
  let component: AddBuyer;
  let fixture: ComponentFixture<AddBuyer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBuyer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBuyer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
