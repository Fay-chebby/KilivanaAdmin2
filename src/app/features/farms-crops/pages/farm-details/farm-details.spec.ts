import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmDetails } from './farm-details';

describe('FarmDetails', () => {
  let component: FarmDetails;
  let fixture: ComponentFixture<FarmDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
