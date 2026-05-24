import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemitoListComponent } from './remito-list-component';

describe('RemitoListComponent', () => {
  let component: RemitoListComponent;
  let fixture: ComponentFixture<RemitoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemitoListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RemitoListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
