import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropDonut } from './crop-donut';

describe('CropDonut', () => {
  let component: CropDonut;
  let fixture: ComponentFixture<CropDonut>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropDonut]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CropDonut);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
