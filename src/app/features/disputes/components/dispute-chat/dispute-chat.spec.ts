import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisputeChat } from './dispute-chat';

describe('DisputeChat', () => {
  let component: DisputeChat;
  let fixture: ComponentFixture<DisputeChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisputeChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisputeChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
