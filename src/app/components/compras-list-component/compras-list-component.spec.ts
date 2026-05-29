import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasListComponent } from './compras-list-component';

describe('ComprasListComponent', () => {
  let component: ComprasListComponent;
  let fixture: ComponentFixture<ComprasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
