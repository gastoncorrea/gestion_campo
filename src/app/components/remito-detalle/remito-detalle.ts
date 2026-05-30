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
    
    console.log('--- DEPURACIÓN DE VALORIZACIÓN ---');
    console.log('Detalles Remito:', detalles);
    console.log('Detalles Compras:', comprasDetalles);

    return detalles.map(item => {
      const itemDetId = String(item['Id_detalle']).trim();
      
      const existeEnCompra = comprasDetalles.some(compraItem => {
        const idCompraDet = String(compraItem.id_det_rem).trim();
        const match = idCompraDet === itemDetId;
        if (match) {
            console.log(`MATCH ENCONTRADO: RemitoID: ${itemDetId}, CompraDetID: ${idCompraDet}`);
        }
        return match;
      });
      
      if (!existeEnCompra) {
          console.log(`NO MATCH: RemitoID: ${itemDetId}`);
      }
      
      return {
        ...item,
        esValorizado: existeEnCompra,
        claseEstado: existeEnCompra ? '' : 'item-pendiente'
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
  compraForm!: FormGroup;

  abrirModalGenerarCompra(): void {
    const productosPendientes = this.detallesConEstado().filter(d => !d.esValorizado);
    
    if (productosPendientes.length === 0) {
      alert('Todos los productos ya han sido valorizados.');
      return;
    }

    this.compraForm = this.fb.group({
      id_compra: [''], 
      id_rem: [{ value: this.idRemito(), disabled: true }],
      nro_remito: [{ value: this.nroRemito(), disabled: true }],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      proveedor: [{ value: this.proveedor(), disabled: true }, Validators.required],
      moneda: ['ARS', Validators.required],
      total: [0],
      detalles: this.fb.array(productosPendientes.map(p => this.fb.group({
        id_det_rem: [p['Id_detalle']],
        producto: [p.Producto],
        cantidad: [p.Cantidad],
        precio: [0, [Validators.min(0)]],
        impuesto: [21, [Validators.required]],
        total: [0]
      })))
    });

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
    const total = this.detallesForm.controls.reduce((acc, curr) => {
      const precio = parseFloat(curr.get('precio')?.value || 0);
      if (precio > 0) {
        return acc + parseFloat(curr.get('total')?.value || 0);
      }
      return acc;
    }, 0);
    this.compraForm.patchValue({ total: total.toFixed(2) });
  }

  guardarCompra(): void {
    const rawData = this.compraForm.getRawValue();
    
    const detallesFiltrados = rawData.detalles.filter((d: any) => parseFloat(d.precio) > 0);

    if (detallesFiltrados.length === 0) {
      alert('Debe ingresar el precio de al menos un producto para generar la compra.');
      return;
    }

    if (this.compraForm.get('fecha')?.invalid || 
        this.compraForm.get('proveedor')?.invalid || 
        this.compraForm.get('moneda')?.invalid) {
      alert('Por favor complete la fecha, proveedor y moneda.');
      return;
    }

    const compraData = {
      ...rawData,
      id_rem: this.idRemito(), 
      detalles: detallesFiltrados,
      total: this.compraForm.get('total')?.value 
    };

    this.comprasService.crearCompra(compraData).subscribe({
      next: (res) => {
        alert('Compra generada exitosamente.');
        this.mostrarModal.set(false);
        this.compraGuardada.emit();
      },
      error: (err) => {
        alert('Error al crear compra: ' + err.message);
      }
    });
  }
}
