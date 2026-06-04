import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-costo-labores-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './costo-labores-detalle.html',
  styleUrl: './costo-labores-detalle.scss',
})
export class CostoLaboresDetalle {
  detalles = input<any[]>([]);
  moneda = input<string>('ARS');

  calcularTotalInsumos(): number {
    return this.detalles().reduce((acc, curr) => acc + (Number(curr.costo_total) || 0), 0);
  }
}
