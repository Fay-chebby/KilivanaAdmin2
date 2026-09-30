import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFarm } from './edit-farm';

describe('EditFarm', () => {
  let component: EditFarm;
  let fixture: ComponentFixture<EditFarm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFarm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFarm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
