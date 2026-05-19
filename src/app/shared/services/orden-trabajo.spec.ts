import { TestBed } from '@angular/core/testing';

import { OrdenTrabajo } from './orden-trabajo';

describe('OrdenTrabajo', () => {
  let service: OrdenTrabajo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdenTrabajo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
