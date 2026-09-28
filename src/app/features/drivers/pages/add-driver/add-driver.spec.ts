import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDriver } from './add-driver';

describe('AddDriver', () => {
  let component: AddDriver;
  let fixture: ComponentFixture<AddDriver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDriver]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDriver);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
