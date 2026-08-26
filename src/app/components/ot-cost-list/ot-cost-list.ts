import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from '@angular/router';
import { CostoLaboresService } from '../../shared/services/costo-labores/costo-labores-service';
import { CostoLaboresDetalleService } from '../../shared/services/costo-labores/costo-labores-detalle-service';
import { OrdenTrabajo } from '../../shared/services/OT/orden-trabajo';
import { CostoLaboresDetalle } from '../costo-labores-detalle/costo-labores-detalle';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-ot-cost-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, CostoLaboresDetalle],
  templateUrl: './ot-cost-list.html',
  styleUrl: './ot-cost-list.scss',
})
export class OtCostList implements OnInit {
  private costoLaboresService = inject(CostoLaboresService);
  private ordenTrabajoService = inject(OrdenTrabajo);
  private costoLaboresDetalleService = inject(CostoLaboresDetalleService);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;

  costs = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  laborSeleccionada = signal<string | null>(null);
  detalles_labor = signal<any[]>([]);

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
        const costosCalculados = costos.map(cost => {
          const idOt = String(cost.id_ot || cost.OT_ID || '').trim();
          const orden = ordenes.find(ot => String(ot.OT_ID).trim() === idOt);
          const cantidad = orden ? Number(orden.CANTIDAD) || 0 : 0;
          const lote = orden ? orden.LOTE : (cost.lote || ''); 
          
          const costoServicioUnitario = Number(cost.costo_servicio) || 0; 
          const totalCostoServicio = cantidad * costoServicioUnitario;

          const detallesDeEstaLabor = detallesCostos.filter((d: any) => String(d.id_labor).trim() === String(cost.id_labor).trim());
          const sumatoriaInsumos = detallesDeEstaLabor.reduce((acc: number, d: any) => acc + (Number(d.costo_total) || 0), 0);
          
          let totalFinal = Number(cost.total || cost.costo_total) || 0;
          if (totalFinal === 0) {
            totalFinal = totalCostoServicio + sumatoriaInsumos;
          }
          
          return {
            ...cost,
            cantidad,
            lote,
            costo_servicio_unitario: costoServicioUnitario,
            total_costo_servicio: totalCostoServicio,
            total_insumos_calculado: sumatoriaInsumos,
            total_final: totalFinal
          };
        });

        this.costs.set(costosCalculados);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.isLoading.set(false);
      }
    });
  }

  seleccionarLabor(laborId: string): void {
    if (this.laborSeleccionada() === laborId) {
      this.laborSeleccionada.set(null);
      this.detalles_labor.set([]);
      return;
    }
    this.laborSeleccionada.set(laborId);
    this.detalles_labor.set([]);
    this.costoLaboresDetalleService.obtenerDetallesPorLabor(laborId).subscribe(data => {
      this.detalles_labor.set(data);
    });
  }
}
