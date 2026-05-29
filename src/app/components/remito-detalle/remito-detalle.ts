import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPen, faTrash, faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Compras } from '../../shared/services/compras';
import { CompraDetalleService } from '../../shared/services/compras-detalle-service';

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

  private fb = inject(FormBuilder);
  private comprasService = inject(Compras);
  private compraDetalleService = inject(CompraDetalleService);

  faPen = faPen;
  faTrash = faTrash;
  faCartPlus = faCartPlus;

  mostrarModal = signal(false);
  compraForm!: FormGroup;

  estaValorizado(producto: string): boolean {
    const idRem = String(this.idRemito()).trim();
    
    // 1. Encontrar las compras asociadas a este remito
    const comprasAsociadasIds = this.compras()
      .filter(c => String(c.id_rem).trim() === idRem)
      .map(c => String(c.id_compra).trim());

    if (comprasAsociadasIds.length === 0) return false;

    // 2. Verificar si el producto está en el detalle de alguna de esas compras
    return this.detallesCompras().some(itemCompra => 
      comprasAsociadasIds.includes(String(itemCompra.id_compra).trim()) && 
      String(itemCompra.Producto).trim() === String(producto).trim()
    );
  }

  abrirModalGenerarCompra(): void {
    const productosPendientes = this.detalles().filter(d => !this.estaValorizado(d.Producto));
    
    if (productosPendientes.length === 0) {
      alert('Todos los productos ya han sido valorizados.');
      return;
    }

    this.compraForm = this.fb.group({
      id_compra: [''], // Campo oculto, se generará en el servidor/Sheets
      id_rem: [this.idRemito()],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      proveedor: ['', Validators.required],
      moneda: ['ARS', Validators.required],
      total: [0],
      detalles: this.fb.array(productosPendientes.map(p => this.fb.group({
        detalle_rem_id: [p.Re_id || p['Nro Remito'] || p.Producto],
        producto: [p.Producto],
        cantidad: [p.Cantidad],
        precio: [0, [Validators.required, Validators.min(0.01)]],
        impuesto: [21, [Validators.required]],
        subtotal: [0]
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
    group.patchValue({ subtotal: subtotal.toFixed(2) });
    this.calcularTotal();
  }

  calcularTotal(): void {
    const total = this.detallesForm.controls.reduce((acc, curr) => {
      return acc + parseFloat(curr.get('subtotal')?.value || 0);
    }, 0);
    this.compraForm.patchValue({ total: total.toFixed(2) });
  }

  guardarCompra(): void {
    if (this.compraForm.invalid) {
      alert('Por favor complete todos los campos correctamente.');
      return;
    }

    const token = prompt('Por favor, ingrese su token de OAuth2 para guardar (Requerido para Sheets API):');
    if (!token) return;

    const compraData = this.compraForm.value;
    const detallesData = compraData.detalles.map((d: any) => ({
      ...d,
      id_detalle_compra: '', // Se generará en el servidor/Sheets
      id_compra: compraData.id_compra // Seguirá siendo el ID de la compra (que también está vacío para el servidor)
    }));

    this.comprasService.crearCompra(compraData, token).subscribe({
      next: () => {
        this.compraDetalleService.crearDetallesCompra(detallesData, token).subscribe({
          next: () => {
            alert('Compra generada exitosamente.');
            this.mostrarModal.set(false);
            // Idealmente refrescar los datos aquí
          },
          error: (err) => alert('Error al crear detalles: ' + err.message)
        });
      },
      error: (err) => alert('Error al crear compra: ' + err.message)
    });
  }
}
