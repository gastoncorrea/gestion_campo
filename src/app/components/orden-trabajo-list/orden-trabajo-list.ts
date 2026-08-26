import { Component, inject, signal, OnInit } from '@angular/core';
import { OrdenTrabajo } from '../../shared/services/OT/orden-trabajo';
import { CommonModule } from '@angular/common';
import { OrdenTrabajoDetalle } from '../orden-trabajo-detalle/orden-trabajo-detalle';
import { OrdenDetalleService } from '../../shared/services/OT/orden-detalle-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from "@angular/router";
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CostoLaboresService } from '../../shared/services/costo-labores/costo-labores-service';
import { CostoLabor } from '../../shared/models/costo-labor';
import { CostoLaboresDetalleService } from '../../shared/services/costo-labores/costo-labores-detalle-service';
import { CompraDetalleService } from '../../shared/services/compras/compras-detalle-service';
import { RemitoDetalleService } from '../../shared/services/remito/remito-detalle-service';
import { Compras } from '../../shared/services/compras/compras';
import { DetalleLabor } from '../../shared/models/detalle-labor';
import { Compra } from '../../shared/models/compra';
import { DetalleCompra } from '../../shared/models/detalle-compra';
import { forkJoin } from 'rxjs';

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
  private costoLaboresDetalleService = inject(CostoLaboresDetalleService);
  private compraDetalleService = inject(CompraDetalleService);
  private remitoDetalleService = inject(RemitoDetalleService);
  private comprasService = inject(Compras);
  private fb = inject(FormBuilder);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  faExclamationTriangle = faExclamationTriangle;

  private lastMoneda = 'ARS';
  private lastCotizacion = 1;
  ponderadosBase: { 
    [producto: string]: { 
        totalMontoARS: number; 
        totalMontoUSD: number; 
        totalMontoUSD_a_ARS: number; 
        totalCant: number;
        compras: any[]; 
    } 
  } = {};
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
    forkJoin({
      ordenes: this.ordenTrabajoService.obtenerOrdenes(),
      labores: this.costoLaboresService.obtenerCostosLabores()
    }).subscribe(({ ordenes, labores }) => {
      this.todasLasLabores.set(labores);
      const mapped = ordenes.map(o => {
        const tieneLabor = labores.some(l => String(l.id_ot).trim() === String(o.OT_ID).trim());
        return {
          ...o,
          estado: tieneLabor ? 'Facturado' : 'No facturado',
          claseEstado: tieneLabor ? 'estado-completo' : 'estado-pendiente'
        };
      });
      this.ordenes.set(mapped);
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
    const orden = this.ordenes().find(o => String(o.OT_ID).trim() === String(otId).trim());
    if (!orden) return;

    this.ordenParaLabor.set(orden);
    this.cargando.set(true);
    const cantidadOt = Number(orden.CANTIDAD) || 0;
    this.lastMoneda = 'ARS';
    this.lastCotizacion = 1;

    forkJoin({
      comprasHeaders: this.comprasService.obtenerCompras(),
      comprasDetalles: this.compraDetalleService.obtenerTodosLosDetalles(),
      remitosDetalles: this.remitoDetalleService.obtenerTodosLosDetalles()
    }).subscribe({
      next: ({ comprasHeaders, comprasDetalles, remitosDetalles }) => {
        const base: typeof this.ponderadosBase = {};
        
        comprasDetalles.forEach(cd => {
          const cdIdCompra = String(cd.id_compra || '').trim();
          const header = comprasHeaders.find(h => 
            String(h.id_compra || h['id_compra'] || h['ID Compra'] || '').trim() === cdIdCompra
          );
          
          if (!header) return;

          const cdIdDetRem = String(cd.id_det_rem || '').trim();
          const remitoItem = remitosDetalles.find(r => 
            String(r.id_detalle || r['id_detalle'] || r['ID Detalle'] || '').trim() === cdIdDetRem
          );
          
          const cotizacionCompra = header ? Number(header.cotizacion_moneda || header['cotizacion_moneda'] || header['tipo_de_cambio'] || header['tipo_cambio'] || header['cotizacion'] || 1) : 1;
          const monedaCompraRaw = (header?.moneda || header?.['moneda'] || 'ARS').toString().toUpperCase();
          const monedaCompra = (monedaCompraRaw.includes('USD') || monedaCompraRaw.includes('U$S') || monedaCompraRaw.includes('DOLAR')) ? 'USD' : 'ARS';

          const precioUnitario = Number(cd.precio || 0);
          const cantidad = remitoItem ? Number(remitoItem.cantidad || remitoItem['cantidad'] || 0) : 0;
          const prodNombre = String(cd.producto || '').trim().toUpperCase();

          if (!prodNombre || cantidad <= 0) return;

          if (!base[prodNombre]) {
            base[prodNombre] = { totalMontoARS: 0, totalMontoUSD: 0, totalMontoUSD_a_ARS: 0, totalCant: 0, compras: [] };
          }

          base[prodNombre].compras.push({
            compra_id: cdIdCompra,
            moneda: monedaCompra,
            cotizacion: cotizacionCompra,
            precio_original: precioUnitario,
            cantidad: cantidad
          });

          if (monedaCompra === 'USD') {
            const precioEnPesos = precioUnitario * cotizacionCompra;
            const montoConvertido = precioEnPesos * cantidad;
            base[prodNombre].totalMontoUSD += precioUnitario * cantidad;
            base[prodNombre].totalMontoUSD_a_ARS += montoConvertido;
          } else {
            const montoARS = precioUnitario * cantidad;
            base[prodNombre].totalMontoARS += montoARS;
          }
          base[prodNombre].totalCant += cantidad;
        });

        this.ponderadosBase = base;

        this.laborForm = this.fb.group({
          id_labor: ['LAB' + Date.now()],
          id_ot: [{ value: otId, disabled: true }],
          lote: [{ value: orden.LOTE, disabled: true }],
          servicio: [{ value: orden.SERVICIO, disabled: true }],
          contratista: [{ value: orden.PROVEEDOR, disabled: true }],
          cantidad_ot: [{ value: cantidadOt, disabled: true }],
          fecha: [new Date().toISOString().split('T')[0], [Validators.required]],
          costo_servicio: [0, [Validators.required, Validators.min(0.01)]],
          moneda: ['ARS', [Validators.required]],
          cotizacion_moneda: [1, [Validators.required, Validators.min(1)]],
          total_servicio_ot: [0],
          total_insumos: [0],
          total_final: [0],
          total_final_ars: [0],
          detalles: this.fb.array(this.detalle_orden().map(d => {
            const prodNombre = String(d.producto).trim().toUpperCase();
            const dataProd = base[prodNombre];
            const cantidadNecesaria = Number(d.total || 0);

            let costoInicialSugerido = 0;
            if (dataProd && dataProd.totalCant > 0) {
                costoInicialSugerido = (dataProd.totalMontoARS + dataProd.totalMontoUSD_a_ARS) / dataProd.totalCant;
            }

            return this.fb.group({
              producto: [d.producto, [Validators.required]],
              cantidad: [cantidadNecesaria, [Validators.required, Validators.min(0.0001)]],
              costo_utilizado: [Number(costoInicialSugerido.toFixed(2)), [Validators.required, Validators.min(0.01)]],
              costo_total_producto: [Number((cantidadNecesaria * costoInicialSugerido).toFixed(2))]
            });
          }))
        });
        
        this.laborForm.updateValueAndValidity();
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

  cambiarMonedaLabor(): void {
    const formRaw = this.laborForm.getRawValue();
    const nuevaMoneda = formRaw.moneda;
    const nuevaCotizacion = Number(formRaw.cotizacion_moneda) || 1;
    const cotizacionValida = nuevaCotizacion > 0 ? nuevaCotizacion : 1;

    let costoServicio = Number(formRaw.costo_servicio) || 0;
    if (this.lastMoneda === 'ARS' && nuevaMoneda === 'USD') {
      costoServicio = costoServicio / cotizacionValida;
    } else if (this.lastMoneda === 'USD' && nuevaMoneda === 'ARS') {
      costoServicio = costoServicio * this.lastCotizacion;
    } else if (this.lastMoneda === 'USD' && nuevaMoneda === 'USD' && this.lastCotizacion !== cotizacionValida) {
      costoServicio = (costoServicio * this.lastCotizacion) / cotizacionValida;
    }
    this.laborForm.get('costo_servicio')?.setValue(Number(Math.max(0, costoServicio).toFixed(2)), { emitEvent: false });

    this.detallesForm.controls.forEach((group) => {
      const prodNombre = String(group.get('producto')?.value || '').trim().toUpperCase();
      const dataProd = this.ponderadosBase[prodNombre];
      
      if (!dataProd || dataProd.totalCant === 0) return;

      let nuevoCostoSugerido = 0;
      if (nuevaMoneda === 'ARS') {
        nuevoCostoSugerido = (dataProd.totalMontoARS + dataProd.totalMontoUSD_a_ARS) / dataProd.totalCant;
      } else {
        const montoARSenUSD = dataProd.totalMontoARS / cotizacionValida;
        nuevoCostoSugerido = (dataProd.totalMontoUSD + montoARSenUSD) / dataProd.totalCant;
      }
      
      group.get('costo_utilizado')?.setValue(Number(Math.max(0, nuevoCostoSugerido).toFixed(2)), { emitEvent: false });
    });

    this.lastMoneda = nuevaMoneda;
    this.lastCotizacion = cotizacionValida;
    this.calcularTotales();
  }

  calcularTotales(): void {
    const formRaw = this.laborForm.getRawValue();
    const costoServicio = Number(formRaw.costo_servicio) || 0;
    const otId = String(formRaw.id_ot).trim();
    const orden = this.ordenes().find(o => String(o.OT_ID).trim() === otId);
    const cantidadOt = orden ? Number(orden.CANTIDAD) || 0 : 0;
    
    const totalServicio = costoServicio * cantidadOt;
    const monedaLabor = formRaw.moneda;
    const cotizacionLabor = Number(formRaw.cotizacion_moneda) || 1;
    
    let totalInsumos = 0;
    this.detallesForm.controls.forEach((group) => {
      const cantidad = Number(group.get('cantidad')?.value) || 0;
      const costoUtilizado = Number(group.get('costo_utilizado')?.value) || 0;
      
      const totalProducto = cantidad * costoUtilizado;
      group.get('costo_total_producto')?.setValue(Number(totalProducto.toFixed(2)));
      totalInsumos += totalProducto;
    });

    const totalFinal = totalServicio + totalInsumos;
    const totalFinalArs = monedaLabor === 'USD' ? totalFinal * cotizacionLabor : totalFinal;

    this.laborForm.patchValue({
      total_servicio_ot: totalServicio.toFixed(2),
      total_insumos: totalInsumos.toFixed(2),
      total_final: totalFinal.toFixed(2),
      total_final_ars: totalFinalArs.toFixed(2)
    });
  }

  guardarLabor(): void {
    if (this.laborForm.invalid) {
      return;
    }

    const formValue = this.laborForm.getRawValue();

    if (Number(formValue.costo_servicio) <= 0) {
      alert('El costo del servicio debe ser mayor a cero.');
      return;
    }

    const tieneInsumosSinCosto = formValue.detalles.some((d: any) => Number(d.costo_utilizado) <= 0);
    if (tieneInsumosSinCosto) {
      alert('Todos los insumos deben tener un costo definido mayor a cero.');
      return;
    }

    this.cargando.set(true);
    const idLabor = formValue.id_labor;
    const idCompraVirtual = 'CMP_' + idLabor;

    const data = {
      costoLabor: {
        id_labor: idLabor,
        id_ot: formValue.id_ot,
        fecha: formValue.fecha,
        moneda: formValue.moneda,
        cotizacion_moneda: formValue.cotizacion_moneda,
        costo_servicio: formValue.costo_servicio,
        total_servicio_ot: formValue.total_servicio_ot,
        total: formValue.total_final
      },
      detalles: formValue.detalles.map((d: any) => {
        const prodNombre = String(d.producto || '').trim().toUpperCase();
        const dataProd = this.ponderadosBase[prodNombre];
        
        let sugeridoARS = 0;
        if (dataProd && dataProd.totalCant > 0) {
            sugeridoARS = (dataProd.totalMontoARS + dataProd.totalMontoUSD_a_ARS) / dataProd.totalCant;
        }

        return {
            id_labor: idLabor,
            id_det_labor: 'DET' + Date.now() + Math.floor(Math.random() * 1000),
            producto: d.producto,
            cantidad: d.cantidad,
            costo_sugerido: Number(sugeridoARS.toFixed(2)), 
            costo_utilizado: d.costo_utilizado,
            costo_total: d.costo_total_producto
        } as DetalleLabor;
      })
    };

    this.costoLaboresService.crearCostoLabor(data).subscribe({
      next: () => {
        const detallesCompraParaEnviar: DetalleCompra[] = formValue.detalles.map((d: any, index: number) => ({
          id_det_compra: 'DTC_' + idLabor + '_' + index,
          id_compra: idCompraVirtual,
          id_det_rem: 'OT_INSUMO_' + idLabor + '_' + index,
          producto: d.producto,
          precio: Number(d.costo_utilizado),
          impuesto: 0,
          subtotal: Number(d.costo_total_producto)
        }));

        if (detallesCompraParaEnviar.length > 0) {
          const compraVirtual: Compra = {
            id_compra: idCompraVirtual,
            nro_remito: 'OT-' + formValue.id_ot,
            fecha: formValue.fecha,
            proveedor: formValue.contratista,
            moneda: formValue.moneda,
            cotizacion_moneda: Number(formValue.cotizacion_moneda),
            total_remito: Number(formValue.total_insumos)
          };

          this.comprasService.crearCompra({ compra: compraVirtual, detalles: detallesCompraParaEnviar }).subscribe({
            next: () => {
              this.finalizarGuardadoLabor();
            },
            error: (err) => {
              console.error('Error al guardar en Detalle compra:', err);
              alert('La labor se guardó pero hubo un error al guardar los insumos en Detalle compra.');
              this.finalizarGuardadoLabor();
            }
          });
        } else {
          this.finalizarGuardadoLabor();
        }
      },
      error: (err) => {
        console.error('Error al guardar labor:', err);
        alert('Error al guardar labor.');
        this.cargando.set(false);
      }
    });
  }

  private finalizarGuardadoLabor(): void {
    this.mostrarModal.set(false);
    this.otSeleccionada.set(null);
    this.detalle_orden.set([]);
    this.cargando.set(false);
    this.cargarDatos();
    alert('Labor generada exitosamente.');
  }

  otTieneLabor(otId: string): boolean {
    return this.todasLasLabores().some(l => String(l.id_ot).trim() === String(otId).trim());
  }

  parseFloat(val: string): number {
    return parseFloat(val) || 0;
  }
}
