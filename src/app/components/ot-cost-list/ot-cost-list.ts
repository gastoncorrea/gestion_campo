import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from '@angular/router';
import { CostoLaboresService } from '../../shared/services/costo-labores/costo-labores-service';
import { CostoLaboresDetalleService } from '../../shared/services/costo-labores/costo-labores-detalle-service';
import { OrdenTrabajo } from '../../shared/services/OT/orden-trabajo';
import { OrdenDetalleService } from '../../shared/services/OT/orden-detalle-service';
import { OrdenTrabajoDetalle } from '../orden-trabajo-detalle/orden-trabajo-detalle';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-ot-cost-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, OrdenTrabajoDetalle],
  templateUrl: './ot-cost-list.html',
  styleUrl: './ot-cost-list.scss',
})
export class OtCostList {
  private costoLaboresService = inject(CostoLaboresService);
  private ordenTrabajoService = inject(OrdenTrabajo);
  private ordenDetalleService = inject(OrdenDetalleService);
  private costoLaboresDetalleService = inject(CostoLaboresDetalleService);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  faExclamationTriangle = faExclamationTriangle;

  costs = signal<any[]>([]);
  pendingOts = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  otSeleccionada = signal<string | null>(null);
  detalle_orden = signal<any[]>([]);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    
    forkJoin({
      costos: this.costoLaboresService.obtenerCostosLabores().pipe(
        catchError(err => { console.error('Error en CostoLaboresService:', err); return of([]); })
      ),
      ordenes: this.ordenTrabajoService.obtenerOrdenes().pipe(
        catchError(err => { console.error('Error en OrdenTrabajoService:', err); return of([]); })
      ),
      detallesCostos: this.costoLaboresDetalleService.obtenerTodosLosDetalles().pipe(
        catchError(err => { console.error('Error en CostoLaboresDetalleService:', err); return of([]); })
      )
    }).subscribe({
      next: ({ costos, ordenes, detallesCostos }: { costos: any[], ordenes: any[], detallesCostos: any[] }) => {
        // Enriquecer y calcular costos
        const costosCalculados = costos.map(cost => {
          const orden = ordenes.find(ot => String(ot.OT_ID).trim() === String(cost.id_ot).trim());
          const cantidad = orden ? Number(orden.CANTIDAD) || 0 : 0;
          const costoServicio = Number(cost.total_servicio) || 0; // Se asume que total_servicio es el costo unitario fijado
          
          const totalCostoServicio = cantidad * costoServicio;
          
          // Calcular sumatoria de insumos para esta labor
          const detallesDeEstaLabor = detallesCostos.filter((d: any) => String(d.id_labor).trim() === String(cost.id_labor).trim());
          const totalInsumos = detallesDeEstaLabor.reduce((acc: number, d: any) => acc + (Number(d.costo_total) || 0), 0);
          
          const totalFinal = totalCostoServicio + totalInsumos;

          return {
            ...cost,
            cantidad,
            total_costo_servicio: totalCostoServicio,
            total_insumos: totalInsumos,
            total: totalFinal
          };
        });

        this.costs.set(costosCalculados);
        
        // Filtrar OTs que no están en la lista de costos
        const otsConCosto = costos.map(c => String(c.id_ot).trim());
        console.log('IDs de OTs con costo:', otsConCosto);
        
        const pendientes = ordenes.filter(ot => {
          const idOt = String(ot.OT_ID).trim();
          const tieneCosto = otsConCosto.includes(idOt);
          console.log(`OT ID: ${idOt}, ¿Tiene costo?: ${tieneCosto}`);
          return !tieneCosto;
        });
        
        console.log('OTs Pendientes calculadas:', pendientes);
        
        this.pendingOts.set(pendientes);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.isLoading.set(false);
      }
    });
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
