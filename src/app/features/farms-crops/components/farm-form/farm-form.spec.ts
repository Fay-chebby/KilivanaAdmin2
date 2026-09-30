import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmForm } from './farm-form';

describe('FarmForm', () => {
  let component: FarmForm;
  let fixture: ComponentFixture<FarmForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
