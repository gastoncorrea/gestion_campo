import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoteMap } from './lote-map';

describe('LoteMap', () => {
  let component: LoteMap;
  let fixture: ComponentFixture<LoteMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoteMap],
    }).compileComponents();

    fixture = TestBed.createComponent(LoteMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
