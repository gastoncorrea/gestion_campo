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
import { CompraDetalleService } from '../../shared/services/compras/compras-detalle-service';
import { RemitoDetalleService } from '../../shared/services/remito/remito-detalle-service';
import { OrdenTrabajoDetalle } from '../orden-trabajo-detalle/orden-trabajo-detalle';
import { CostoLaboresDetalle } from '../costo-labores-detalle/costo-labores-detalle';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-ot-cost-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, OrdenTrabajoDetalle, CostoLaboresDetalle, ReactiveFormsModule],
  templateUrl: './ot-cost-list.html',
  styleUrl: './ot-cost-list.scss',
})
export class OtCostList {
  private costoLaboresService = inject(CostoLaboresService);
  private ordenTrabajoService = inject(OrdenTrabajo);
  private ordenDetalleService = inject(OrdenDetalleService);
  private costoLaboresDetalleService = inject(CostoLaboresDetalleService);
  private compraDetalleService = inject(CompraDetalleService);
  private remitoDetalleService = inject(RemitoDetalleService);
  private fb = inject(FormBuilder);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  faExclamationTriangle = faExclamationTriangle;

  costs = signal<any[]>([]);
  pendingOts = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  otSeleccionada = signal<string | null>(null);
  detalle_orden = signal<any[]>([]);

  laborSeleccionada = signal<string | null>(null);
  detalles_labor = signal<any[]>([]);

  // Modal logic
  mostrarModal = signal(false);
  cargando = signal(false);
  laborForm!: FormGroup;

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
          
          // Nombres de campos según el usuario: costo_servicio, total_costo_ot
          const costoServicioUnitario = Number(cost.costo_servicio) || 0; 
          const totalCostoOt = Number(cost.total_costo_ot) || 0;
          
          const totalCostoServicio = cantidad * costoServicioUnitario;

          // Calcular sumatoria de insumos para esta labor
          const detallesDeEstaLabor = detallesCostos.filter((d: any) => String(d.id_labor).trim() === String(cost.id_labor).trim());
          const sumatoriaInsumos = detallesDeEstaLabor.reduce((acc: number, d: any) => acc + (Number(d.costo_total) || 0), 0);
          
          // Si total_costo_ot no viene del backend, lo calculamos para mostrar consistencia
          const totalCalculado = totalCostoOt || (totalCostoServicio + sumatoriaInsumos);

          return {
            ...cost,
            cantidad,
            costo_servicio_unitario: costoServicioUnitario,
            total_costo_servicio: totalCostoServicio,
            total_insumos_calculado: sumatoriaInsumos,
            total_final: totalCalculado
          };
        });

        this.costs.set(costosCalculados);
        
        const otsConCosto = costos.map(c => String(c.id_ot).trim());
        const pendientes = ordenes.filter(ot => !otsConCosto.includes(String(ot.OT_ID).trim()));
        
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
    this.otSeleccionada.set(otId);
    this.detalle_orden.set([]);
    this.ordenDetalleService.obtenerDetalleOrdenes(otId).subscribe(data => {
      this.detalle_orden.set(data);
    })
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

  abrirModalLabor(otId: string): void {
    const ot = this.pendingOts().find(o => String(o.OT_ID).trim() === String(otId).trim());
    if (!ot) return;

    this.cargando.set(true);
    const cantidadOt = Number(ot.CANTIDAD) || 0;

    // Obtener detalles de compras y remitos para calcular costos ponderados reales
    forkJoin({
      compras: this.compraDetalleService.obtenerTodosLosDetalles(),
      remitosDetalles: this.remitoDetalleService.obtenerTodosLosDetalles()
    }).subscribe({
      next: ({ compras, remitosDetalles }) => {
        const costosPonderados: { [producto: string]: number } = {};
        
        // Unir datos: necesitamos la cantidad del remito y el precio de la compra
        const comprasEnriquecidas = compras.map(c => {
          const remitoItem = remitosDetalles.find(r => String(r['Id_detalle']).trim() === String(c['id_det_rem']).trim());
          return {
            ...c,
            // Priorizamos la cantidad del remito vinculado
            cantidad_real: remitoItem ? (Number(remitoItem['Cantidad']) || 0) : 0,
            // El usuario dice que el costo está en 'precio' (o 'Costo un' según el mensaje anterior)
            precio_real: Number(c['precio']) || Number(c['Costo un']) || 0
          };
        });

        // Agrupar por producto (normalizado a mayúsculas)
        const comprasPorProducto = comprasEnriquecidas.reduce((acc, curr) => {
          const prod = String(curr.producto || '').trim().toUpperCase();
          if (!acc[prod]) acc[prod] = [];
          acc[prod].push(curr);
          return acc;
        }, {} as { [key: string]: any[] });

        // Calcular ponderado real: Suma(precio * cantidad) / Suma(cantidad)
        Object.keys(comprasPorProducto).forEach(prod => {
          const totalMonto = comprasPorProducto[prod].reduce((s: number, c: any) => s + (c.precio_real * c.cantidad_real), 0);
          const totalCant = comprasPorProducto[prod].reduce((s: number, c: any) => s + c.cantidad_real, 0);
          costosPonderados[prod] = totalCant > 0 ? totalMonto / totalCant : 0;
        });

        this.laborForm = this.fb.group({
          id_labor: ['LAB' + Date.now()],
          id_ot: [{ value: otId, disabled: true }],
          lote: [{ value: ot.LOTE, disabled: true }],
          servicio: [{ value: ot.SERVICIO, disabled: true }],
          contratista: [{ value: ot.PROVEEDOR, disabled: true }],
          cantidad_ot: [{ value: cantidadOt, disabled: true }],
          fecha: ['', Validators.required],
          costo_servicio: [0, [Validators.required, Validators.min(0)]],
          moneda: ['ARS', Validators.required],
          total_servicio_ot: [0],
          total_insumos: [0],
          total_final: [0],
          detalles: this.fb.array(this.detalle_orden().map(d => {
            const prodNombre = String(d.PRODUCTO || '').trim().toUpperCase();
            const costoSugerido = costosPonderados[prodNombre] || 0;
            const cantidad = Number(d.TOTAL) || 0;

            return this.fb.group({
              producto: [d.PRODUCTO],
              cantidad: [cantidad],
              costo_utilizado: [costoSugerido, [Validators.required, Validators.min(0)]],
              costo_total_producto: [cantidad * costoSugerido]
            });
          }))
        });

        this.calcularTotales();
        this.cargando.set(false);
        this.mostrarModal.set(true);
      },
      error: (err) => {
        console.error('Error al cargar historial de compras:', err);
        this.cargando.set(false);
        alert('Error al cargar datos de referencia.');
      }
    });
  }

  get detallesForm(): FormArray {
    return this.laborForm.get('detalles') as FormArray;
  }

  calcularTotales(): void {
    const costoServicio = this.laborForm.get('costo_servicio')?.value || 0;
    const ot = this.pendingOts().find(o => String(o.OT_ID).trim() === String(this.laborForm.get('id_ot')?.value).trim());
    const cantidadOt = ot ? Number(ot.CANTIDAD) || 0 : 0;
    
    const totalServicio = costoServicio * cantidadOt;
    
    let totalInsumos = 0;
    this.detallesForm.controls.forEach((group, index) => {
      const cantidad = group.get('cantidad')?.value || 0;
      const costoUtilizado = group.get('costo_utilizado')?.value || 0;
      const totalProducto = cantidad * costoUtilizado;
      group.get('costo_total_producto')?.setValue(totalProducto, { emitEvent: false });
      totalInsumos += totalProducto;
    });

    const totalFinal = totalServicio + totalInsumos;

    this.laborForm.patchValue({
      total_servicio_ot: totalServicio,
      total_insumos: totalInsumos,
      total_final: totalFinal
    }, { emitEvent: false });
  }

  guardarLabor(): void {
    if (this.laborForm.invalid) {
      alert('Por favor complete todos los campos.');
      return;
    }

    this.cargando.set(true);
    const formValue = this.laborForm.getRawValue();

    const data = {
      id_labor: formValue.id_labor,
      id_ot: formValue.id_ot,
      fecha: formValue.fecha,
      moneda: formValue.moneda,
      total_servicio: formValue.costo_servicio, // Guardamos el costo unitario como total_servicio según el servicio actual
      total_insumos: formValue.total_insumos,
      total: formValue.total_final,
      detalles: formValue.detalles.map((d: any) => ({
        id_det_labor: 'DET' + Date.now() + Math.floor(Math.random() * 1000),
        producto: d.producto,
        cantidad: d.cantidad,
        costo_sugerido: 0, // No lo tenemos en la OT, enviamos 0
        costo_utilizado: d.costo_utilizado,
        costo_total: d.costo_total_producto
      }))
    };

    this.costoLaboresService.crearCostoLabor(data).subscribe({
      next: () => {
        alert('Labor generada exitosamente.');
        this.mostrarModal.set(false);
        this.cargando.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al guardar labor:', err);
        alert('Error al guardar labor.');
        this.cargando.set(false);
      }
    });
  }
}
