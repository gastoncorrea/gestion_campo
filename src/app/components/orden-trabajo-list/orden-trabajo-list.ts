import { Component, inject, signal } from '@angular/core';
import { OrdenTrabajo } from '../../shared/services/OT/orden-trabajo';
import { CommonModule } from '@angular/common';
import { OrdenTrabajoDetalle } from '../orden-trabajo-detalle/orden-trabajo-detalle';
import { OrdenDetalleService } from '../../shared/services/OT/orden-detalle-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-orden-trabajo-list',
  standalone: true,
  imports: [CommonModule, OrdenTrabajoDetalle, FontAwesomeModule, RouterLink],
  templateUrl: './orden-trabajo-list.html',
  styleUrl: './orden-trabajo-list.scss',
})
export class OrdenTrabajoList {

  private ordenTrabajoService = inject(OrdenTrabajo);
  private ordenDetalleService = inject(OrdenDetalleService);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  ordenes = signal<any[]>([]);
  otSeleccionada = signal<string | null>(null);
  detalle_orden = signal<any[]>([]);

  ngOnInit(): void {
    this.ordenTrabajoService.obtenerOrdenes().subscribe(data => {
      this.ordenes.set(data);
    })
  }

  seleccionarOrden(otId: string): void {
    if (this.otSeleccionada() === otId) {
      this.otSeleccionada.set(null);
      this.detalle_orden.set([]);
      return;
    }
    // abrir fila inmediatamente
    this.otSeleccionada.set(otId);

    // limpiar datos viejos
    this.detalle_orden.set([]);
    this.ordenDetalleService.obtenerDetalleOrdenes(otId).subscribe(data => {
      this.detalle_orden.set(data);
    })
  }
}
