import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmCard } from './farm-card';

describe('FarmCard', () => {
  let component: FarmCard;
  let fixture: ComponentFixture<FarmCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
