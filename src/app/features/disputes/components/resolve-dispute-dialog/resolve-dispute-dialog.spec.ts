import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolveDisputeDialog } from './resolve-dispute-dialog';

describe('ResolveDisputeDialog', () => {
  let component: ResolveDisputeDialog;
  let fixture: ComponentFixture<ResolveDisputeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolveDisputeDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResolveDisputeDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
