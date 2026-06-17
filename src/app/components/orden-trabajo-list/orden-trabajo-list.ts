import { Component, inject, signal, OnInit } from '@angular/core';
import { OrdenTrabajo } from '../../shared/services/OT/orden-trabajo';
import { CommonModule } from '@angular/common';
import { OrdenTrabajoDetalle } from '../orden-trabajo-detalle/orden-trabajo-detalle';
import { OrdenDetalleService } from '../../shared/services/OT/orden-detalle-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from "@angular/router";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CostoLaboresService } from '../../shared/services/costo-labores/costo-labores-service';
import { CostoLabor } from '../../shared/models/costo-labor';

@Component({
  selector: 'app-orden-trabajo-list',
  standalone: true,
  imports: [CommonModule, OrdenTrabajoDetalle, FontAwesomeModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './orden-trabajo-list.html',
  styleUrl: './orden-trabajo-list.scss',
})
export class OrdenTrabajoList implements OnInit {

  private ordenTrabajoService = inject(OrdenTrabajo);
  private ordenDetalleService = inject(OrdenDetalleService);
  private costoLaboresService = inject(CostoLaboresService);
  private fb = inject(FormBuilder);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  ordenes = signal<any[]>([]);
  otSeleccionada = signal<string | null>(null);
  detalle_orden = signal<any[]>([]);
  todasLasLabores = signal<any[]>([]);

  mostrarModal = signal(false);
  cargando = signal(false);
  laborForm!: FormGroup;
  ordenParaLabor = signal<any>(null);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.ordenTrabajoService.obtenerOrdenes().subscribe(data => {
      this.ordenes.set(data);
    });
    this.costoLaboresService.obtenerCostosLabores().subscribe(data => {
      this.todasLasLabores.set(data);
    });
  }

  seleccionarOrden(otId: string): void {
    if (this.otSeleccionada() === otId) {
      this.otSeleccionada.set(null);
      this.detalle_orden.set([]);
      return;
    }
    this.otSeleccionada.set(otId);
    this.detalle_orden.set([]);
    this.ordenDetalleService.obtenerDetalleOrdenes(otId).subscribe(data => {
      this.detalle_orden.set(data);
    })
  }

  abrirModalGenerarLabor(otId: string): void {
    const orden = this.ordenes().find(o => o.OT_ID === otId);
    if (!orden) return;

    this.ordenParaLabor.set(orden);

    this.laborForm = this.fb.group({
      id_ot: [{ value: otId, disabled: true }],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      costo_servicio: [0, [Validators.required, Validators.min(0)]],
      moneda: ['ARS', Validators.required],
      cotizacion_moneda: [1, [Validators.required, Validators.min(1)]],
      total_servicio_ot: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });

    this.calcularTotales();
    this.mostrarModal.set(true);
  }

  calcularTotales(): void {
    const costoServicio = this.laborForm.get('costo_servicio')?.value || 0;
    const cantidad = parseFloat(this.ordenParaLabor()?.CANTIDAD) || 0;
    const totalServicioOt = costoServicio * cantidad;

    // sum(detalle_remito.subtotal) - For now we use the sum of items in the OT detail
    // as it's the only detail we have related to the OT. 
    // If the user meant something else, we can adjust.
    const sumDetalleInsumos = this.detalle_orden().reduce((acc, item) => {
      // Assuming OT detail has a 'TOTAL' field which represents cost or subtotal of the item
      return acc + (parseFloat(item.TOTAL) || 0);
    }, 0);

    const totalFinal = totalServicioOt + sumDetalleInsumos;

    this.laborForm.patchValue({
      total_servicio_ot: totalServicioOt.toFixed(2),
      total: totalFinal.toFixed(2)
    });
  }

  guardarLabor(): void {
    if (this.laborForm.invalid || this.cargando()) return;

    const rawData = this.laborForm.getRawValue();
    const costoLabor: CostoLabor = {
      id_labor: 'LAB' + Date.now(), // Temporarily generate ID
      id_ot: rawData.id_ot,
      fecha: rawData.fecha,
      costo_servicio: rawData.costo_servicio,
      moneda: rawData.moneda,
      cotizacion_moneda: rawData.cotizacion_moneda,
      total_servicio_ot: parseFloat(rawData.total_servicio_ot),
      total: parseFloat(rawData.total)
    };

    const data = {
      costoLabor,
      detalles: [] // Detalle labor will be implemented later as per user's request
    };

    this.cargando.set(true);
    this.costoLaboresService.crearCostoLabor(data).subscribe({
      next: () => {
        alert('Costo de labor generado exitosamente.');
        this.mostrarModal.set(false);
        this.cargando.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        alert('Error al generar labor: ' + err.message);
        this.cargando.set(false);
      }
    });
  }

  otTieneLabor(otId: string): boolean {
    return this.todasLasLabores().some(l => String(l.id_ot).trim() === String(otId).trim());
  }

  parseFloat(val: string): number {
    return parseFloat(val) || 0;
  }
}
