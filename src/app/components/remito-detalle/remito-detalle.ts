import { Component, input, signal, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPen, faTrash, faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Compras } from '../../shared/services/compras/compras';

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
    // Filtrar solo los productos que son pendientes (no valorizados)
    const productosPendientes = this.detallesConEstado().filter(d => d.esPendiente);
    
    if (productosPendientes.length === 0) {
      alert('No hay productos pendientes para valorizar.');
      return;
    }

    // Buscar si ya existe una compra para este remito
    const nroRemitoActual = String(this.nroRemito() || '').trim();
    const compraExistente = this.compras().find(c => 
      String(c['Nro Remito'] || '').trim() === nroRemitoActual
    );

    // Si existe, mantenemos el ID; si no, generamos uno nuevo
    const idCompra = compraExistente ? compraExistente['id_compra'] : 'CMP' + Date.now();
    const moneda = compraExistente ? (compraExistente['moneda'] || 'ARS') : 'ARS';

    this.compraForm = this.fb.group({
      id_compra: [idCompra], 
      id_rem: [{ value: this.idRemito(), disabled: true }],
      nro_remito: [{ value: this.nroRemito(), disabled: true }],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      proveedor: [{ value: this.proveedor(), disabled: true }, Validators.required],
      moneda: [moneda, Validators.required],
      total: [0],
      detalles: this.fb.array(productosPendientes.map(p => this.fb.group({
        id_det_rem: [p['Id_detalle']],
        producto: [p.Producto],
        cantidad: [p.Cantidad],
        precio: [0, [Validators.min(0), Validators.required]],
        impuesto: [21, [Validators.required]],
        total: [0]
      })))
    });

    this.calcularTotal(); // Inicializar el total considerando items previos si existen
    this.mostrarModal.set(true);
  }

  get detallesForm(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  calcularSubtotal(index: number): void {
    const group = this.detallesForm.at(index);
    const precio = group.get('precio')?.value || 0;
    const impuesto = group.get('impuesto')?.value || 0;
    const cantidad = group.get('cantidad')?.value || 1;
    
    const subtotal = (precio + (precio * impuesto / 100)) * cantidad;
    group.patchValue({ total: subtotal.toFixed(2) });
    this.calcularTotal();
  }

  calcularTotal(): void {
    // Sumar items nuevos del formulario
    const totalNuevos = this.detallesForm.controls.reduce((acc, curr) => {
      const precio = parseFloat(curr.get('precio')?.value || 0);
      if (precio > 0) {
        return acc + parseFloat(curr.get('total')?.value || 0);
      }
      return acc;
    }, 0);

    // Sumar items previos ya guardados en esta misma compra
    const idCompraActual = this.compraForm.get('id_compra')?.value;
    const totalPrevio = this.detallesCompras()
      .filter(d => String(d.id_compra).trim() === String(idCompraActual).trim())
      .reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);

    const totalFinal = totalPrevio + totalNuevos;
    this.compraForm.patchValue({ total: totalFinal.toFixed(2) });
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
    const detallesFiltrados = rawData.detalles.filter((d: any) => parseFloat(d.precio) > 0);

    if (detallesFiltrados.length === 0) {
      alert('Debe ingresar el precio de al menos un producto para generar la compra.');
      return;
    }

    // 3. Verificaciones de duplicados (basado en datos locales actuales)
    const idCompraActual = String(rawData.id_compra || '').trim();
    
    // 4. Verificación CRÍTICA: ¿Alguno de los items YA fue valorizado?
    // Esto previene que se manden los mismos items en una re-entrada accidental
    const detallesExistentes = this.detallesCompras();
    const itemsYaValorizados = detallesFiltrados.filter((df: any) => {
      const idDetRem = String(df.id_det_rem || '').trim();
      return idDetRem && detallesExistentes.some(de => String(de.id_det_rem || '').trim() === idDetRem);
    });

    if (itemsYaValorizados.length > 0) {
      const nombresItems = itemsYaValorizados.map((i: any) => i.producto).join(', ');
      alert(`Los siguientes ítems ya han sido valorizados y no se pueden duplicar: ${nombresItems}`);
      return;
    }

    // 5. Proceder al guardado (el backend debe manejar el upsert por id_compra)
    const compraData = {
      ...rawData,
      id_rem: this.idRemito(), 
      detalles: detallesFiltrados,
      total: this.compraForm.get('total')?.value 
    };

    this.cargando.set(true);
    this.comprasService.crearCompra(compraData).subscribe({
      next: (res) => {
        alert('Compra generada exitosamente.');
        this.mostrarModal.set(false);
        this.cargando.set(false);
        this.compraGuardada.emit();
      },
      error: (err) => {
        this.cargando.set(false);
        alert('Error al crear compra: ' + err.message);
      }
    });
  }
}
