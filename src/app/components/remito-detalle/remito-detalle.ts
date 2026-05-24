import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-remito-detalle',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './remito-detalle.html',
  styleUrl: './remito-detalle.scss',
})
export class RemitoDetalle {
  detalles = input<any[]>([]);

  faPen = faPen;
  faTrash = faTrash;
}
