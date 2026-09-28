import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportButton } from './export-button';

describe('ExportButton', () => {
  let component: ExportButton;
  let fixture: ComponentFixture<ExportButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
