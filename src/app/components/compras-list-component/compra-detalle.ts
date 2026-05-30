import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compra-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compra-detalle.html',
  styleUrl: './compra-detalle.scss',
})
export class CompraDetalle {
  detalles = input<any[]>([]);
}
