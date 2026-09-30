import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmGallery } from './farm-gallery';

describe('FarmGallery', () => {
  let component: FarmGallery;
  let fixture: ComponentFixture<FarmGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
