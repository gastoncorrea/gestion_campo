import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoteViewComponent } from './lote-view-component';

describe('LoteViewComponent', () => {
  let component: LoteViewComponent;
  let fixture: ComponentFixture<LoteViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoteViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoteViewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
