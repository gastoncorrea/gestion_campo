import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtCostList } from './ot-cost-list';

describe('OtCostList', () => {
  let component: OtCostList;
  let fixture: ComponentFixture<OtCostList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtCostList],
    }).compileComponents();

    fixture = TestBed.createComponent(OtCostList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
