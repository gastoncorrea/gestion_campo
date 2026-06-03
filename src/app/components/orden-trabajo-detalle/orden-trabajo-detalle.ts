import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleDollarToSlot, faPen, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-orden-trabajo-detalle',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './orden-trabajo-detalle.html',
  styleUrl: './orden-trabajo-detalle.scss',
})
export class OrdenTrabajoDetalle {
  detalles = input<any[]>([]);
  otId = input<string | null>(null);
  showGenerarLabor = input<boolean>(false);
  showEditDelete = input<boolean>(true);

  faCircleDollarToSlot = faCircleDollarToSlot;
  faPen = faPen;
  faTrash = faTrash;
  faPlus = faPlus;
}
