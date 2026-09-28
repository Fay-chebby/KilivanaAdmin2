import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropList } from './crop-list';

describe('CropList', () => {
  let component: CropList;
  let fixture: ComponentFixture<CropList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CropList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
