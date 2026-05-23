import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleDollarToSlot, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-orden-trabajo-detalle',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './orden-trabajo-detalle.html',
  styleUrl: './orden-trabajo-detalle.scss',
})
export class OrdenTrabajoDetalle {
  detalles = input<any[]>([]);

  faCircleDollarToSlot = faCircleDollarToSlot;
  faPen = faPen;
  faTrash = faTrash;
}
