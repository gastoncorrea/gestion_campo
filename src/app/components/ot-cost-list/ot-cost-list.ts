import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ot-cost-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './ot-cost-list.html',
  styleUrl: './ot-cost-list.scss',
})
export class OtCostList {
  faPlus = faPlus;
  faCircleLeft = faCircleLeft;

  costs = signal<any[]>([]);

  ngOnInit(): void {
    // Para demostración, podrías inicializar con datos vacíos o de ejemplo
    this.costs.set([
      {
        id: 1,
        ot_id: 'OT-001',
        fecha: '2024-05-20',
        costo_servicio: 1500,
        costo_insumos: 500,
        costo_total: 2000,
        moneda: 'ARS',
      },
    ]);
  }
}
