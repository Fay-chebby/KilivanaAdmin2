import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFarm } from './add-farm';

describe('AddFarm', () => {
  let component: AddFarm;
  let fixture: ComponentFixture<AddFarm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFarm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFarm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
