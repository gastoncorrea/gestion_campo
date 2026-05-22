import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orden-trabajo-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orden-trabajo-detalle.html',
  styleUrl: './orden-trabajo-detalle.scss',
})
export class OrdenTrabajoDetalle {
  detalles = input<any[]>([]);
}
