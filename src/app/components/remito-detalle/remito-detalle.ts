import { Component, input, signal, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPen, faTrash, faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Compras } from '../../shared/services/compras/compras';
import { Compra } from '../../shared/models/compra';
import { DetalleCompra } from '../../shared/models/detalle-compra';

@Component({
  selector: 'app-remito-detalle',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, ReactiveFormsModule],
  templateUrl: './remito-detalle.html',
  styleUrl: './remito-detalle.scss',
})
export class RemitoDetalle {
  detalles = input<any[]>([]);
  compras = input<any[]>([]);
  detallesCompras = input<any[]>([]);
  idRemito = input<string | number>('');
  nroRemito = input<string>('');
  proveedor = input<string>('');
  estado = input<string>('');

  detallesConEstado = computed(() => {
    const detalles = this.detalles();
    const comprasDetalles = this.detallesCompras();
    
    return detalles.map(item => {
      const itemDetId = String(item['Id_detalle'] || '').trim();
      
      let existeEnCompra = false;
      if (itemDetId) {
        existeEnCompra = comprasDetalles.some(compraItem => {
          const idCompraDet = String(compraItem.id_det_rem || '').trim();
          return idCompraDet === itemDetId;
        });
      }
      
      // El estado del item es pendiente si no existe en ninguna compra
      // y si tiene un campo Estado, que este sea 'Pendiente'
      const esPendiente = !existeEnCompra && (item['Estado'] ? item['Estado'] === 'Pendiente' : true);

      return {
        ...item,
        esValorizado: existeEnCompra,
        esPendiente: esPendiente,
        claseEstado: esPendiente ? 'item-pendiente' : ''
      };
    });
  });

  compraGuardada = output<void>();

  private fb = inject(FormBuilder);
  private comprasService = inject(Compras);

  faPen = faPen;
  faTrash = faTrash;
  faCartPlus = faCartPlus;

  mostrarModal = signal(false);
  cargando = signal(false);
  compraForm!: FormGroup;

  abrirModalGenerarCompra(): void {
    const todosLosDetalles = this.detallesConEstado();
    
    // Buscar si ya existe una compra para este remito
    const nroRemitoActual = String(this.nroRemito() || '').trim();
    const compraExistente = this.compras().find(c => 
      String(c['Nro Remito'] || '').trim() === nroRemitoActual
    );

    // Si existe, mantenemos los datos originales; si no, generamos nuevos
    const idCompra = compraExistente ? compraExistente['id_compra'] : 'CMP' + Date.now();
    const moneda = compraExistente ? (compraExistente['moneda'] || 'ARS') : 'ARS';
    const fecha = compraExistente ? (compraExistente['fecha'] || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
    const cotizacion = compraExistente ? (compraExistente['cotizacion_moneda'] || 1) : 1;

    const tieneCompra = !!compraExistente;

    this.compraForm = this.fb.group({
      id_compra: [idCompra], 
      id_rem: [{ value: this.idRemito(), disabled: true }],
      nro_remito: [{ value: this.nroRemito(), disabled: true }],
      fecha: [{ value: fecha, disabled: tieneCompra }, Validators.required],
      proveedor: [{ value: this.proveedor(), disabled: true }, Validators.required],
      moneda: [{ value: moneda, disabled: tieneCompra }, Validators.required],
      cotizacion_moneda: [{ value: cotizacion, disabled: tieneCompra }, [Validators.min(1)]],
      total_remito: [0],
      total_ars: [0],
      detalles: this.fb.array(todosLosDetalles.map(p => {
        const itemDetId = String(p['Id_detalle'] || '').trim();
        // Buscar si este item específico ya está en los detalles de la compra
        const registroExistente = this.detallesCompras().find(dc => 
            String(dc.id_det_rem || '').trim() === itemDetId && 
            String(dc.id_compra).trim() === String(idCompra).trim()
        );

        const esValorizado = !!registroExistente;

        return this.fb.group({
          id_det_rem: [p['Id_detalle']],
          producto: [p.Producto],
          cantidad: [p['Cant total'] || 0],
          precio: [{ value: registroExistente?.precio || 0, disabled: esValorizado }, [Validators.min(0), Validators.required]],
          impuesto: [{ value: registroExistente?.impuesto || 21, disabled: esValorizado }, [Validators.required]],
          subtotal: [{ value: registroExistente?.subtotal || 0, disabled: true }]
        });
      }))
    });

    this.calcularTotal();
    this.mostrarModal.set(true);
  }

  get detallesForm(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  calcularSubtotal(index: number): void {
    const group = this.detallesForm.at(index);
    const precio = group.get('precio')?.value || 0;
    const impuesto = group.get('impuesto')?.value || 0;
    const cantidadValue = group.get('cantidad')?.value;
    const cantidad = parseFloat(cantidadValue) || 0;
    
    const subtotal = (precio + (precio * impuesto / 100)) * cantidad;
    group.patchValue({ subtotal: subtotal.toFixed(2) });
    this.calcularTotal();
  }

  calcularTotal(): void {
    // Usamos getRawValue para incluir campos deshabilitados en el cálculo
    const detallesRaw = this.detallesForm.getRawValue();
    const totalFinal = detallesRaw.reduce((acc: number, curr: any) => {
      return acc + parseFloat(curr.subtotal || 0);
    }, 0);

    const formRaw = this.compraForm.getRawValue();
    const cotizacion = formRaw.cotizacion_moneda || 1;
    const moneda = formRaw.moneda;
    const totalArs = moneda === 'USD' ? totalFinal * cotizacion : totalFinal;

    this.compraForm.patchValue({ 
      total_remito: totalFinal.toFixed(2),
      total_ars: totalArs.toFixed(2)
    });
  }

  guardarCompra(): void {
    // 1. Evitar re-entrada si ya está cargando
    if (this.cargando()) return;

    // 2. Validar formulario
    if (this.compraForm.invalid) {
        alert('Por favor complete todos los campos obligatorios y asegúrese de que los precios sean válidos.');
        return;
    }

    const rawData = this.compraForm.getRawValue();
    // Solo enviamos los detalles que NO estaban valorizados previamente o que tienen precio > 0
    // En realidad, para un "Generar compra" parcial, enviamos solo lo nuevo
    const detallesNuevos = rawData.detalles.filter((d: any) => {
        const itemDetId = String(d.id_det_rem || '').trim();
        const yaExistia = this.detallesCompras().some(dc => 
            String(dc.id_det_rem || '').trim() === itemDetId && 
            String(dc.id_compra).trim() === String(rawData.id_compra).trim()
        );
        return !yaExistia && parseFloat(d.precio) > 0;
    });

    if (detallesNuevos.length === 0) {
      alert('No hay nuevos productos para valorizar en esta compra.');
      return;
    }

    const detallesParaEnviar: DetalleCompra[] = detallesNuevos.map((d: any) => ({
      id_compra: rawData.id_compra,
      id_det_rem: d.id_det_rem,
      producto: d.producto,
      precio: d.precio,
      impuesto: d.impuesto,
      subtotal: parseFloat(d.subtotal)
    }));

    // El total_remito debe ser la sumatoria de TODO (existente + nuevo)
    const totalFinal = rawData.detalles.reduce((acc: number, d: any) => acc + parseFloat(d.subtotal || 0), 0);

    const compra: Compra = {
      id_compra: rawData.id_compra,
      nro_remito: String(this.nroRemito()),
      fecha: rawData.fecha,
      proveedor: String(this.proveedor()),
      moneda: rawData.moneda,
      cotizacion_moneda: rawData.cotizacion_moneda,
      total_remito: Number(totalFinal.toFixed(2))
    };

    const compraData = {
      compra: compra,
      detalles: detallesParaEnviar
    };

    this.cargando.set(true);
    this.comprasService.crearCompra(compraData).subscribe({
      next: (res) => {
        alert('Compra actualizada exitosamente.');
        this.mostrarModal.set(false);
        this.cargando.set(false);
        this.compraGuardada.emit();
      },
      error: (err) => {
        this.cargando.set(false);
        alert('Error al actualizar compra: ' + err.message);
      }
    });
  }
}
