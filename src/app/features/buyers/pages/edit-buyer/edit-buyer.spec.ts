import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBuyer } from './edit-buyer';

describe('EditBuyer', () => {
  let component: EditBuyer;
  let fixture: ComponentFixture<EditBuyer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBuyer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditBuyer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
