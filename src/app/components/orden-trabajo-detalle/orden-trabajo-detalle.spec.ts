import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenTrabajoDetalle } from './orden-trabajo-detalle';

describe('OrdenTrabajoDetalle', () => {
  let component: OrdenTrabajoDetalle;
  let fixture: ComponentFixture<OrdenTrabajoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenTrabajoDetalle],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdenTrabajoDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
