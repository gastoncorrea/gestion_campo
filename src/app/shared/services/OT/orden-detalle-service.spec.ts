import { TestBed } from '@angular/core/testing';

import { OrdenDetalleService } from './orden-detalle-service';

describe('OrdenDetalleService', () => {
  let service: OrdenDetalleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdenDetalleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
