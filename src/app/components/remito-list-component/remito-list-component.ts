import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { RemitoService } from '../../shared/services/remito/remito-service';
import { RemitoDetalleService } from '../../shared/services/remito/remito-detalle-service';
import { RemitoDetalle } from '../remito-detalle/remito-detalle';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-remito-list-component',
  standalone: true,
  imports: [CommonModule, RemitoDetalle, FontAwesomeModule, RouterLink],
  templateUrl: './remito-list-component.html',
  styleUrl: './remito-list-component.scss',
})
export class RemitoListComponent {
  private remitoService = inject(RemitoService);
  private remitoDetalleService = inject(RemitoDetalleService);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  remitos = signal<any[]>([]);
  remitoSeleccionado = signal<string | null>(null);
  detalle_remito = signal<any[]>([]);

  ngOnInit(): void {
    this.remitoService.obtenerRemitos().subscribe(data => {
      this.remitos.set(data);
    })
  }

  seleccionarRemito(remito: any): void {
    const id = remito.Re_id || remito['Nro Remito'] || remito['N° Remito'];
    
    if (this.remitoSeleccionado() === id) {
      this.remitoSeleccionado.set(null);
      this.detalle_remito.set([]);
      return;
    }
    // abrir fila inmediatamente
    this.remitoSeleccionado.set(id);

    // limpiar datos viejos
    this.detalle_remito.set([]);
    
    // Usamos el número de remito como vínculo principal si existe
    const linkId = remito['Nro Remito'] || remito['N° Remito'] || remito.Re_id;
    
    this.remitoDetalleService.obtenerDetalleRemitos(linkId).subscribe(data => {
      this.detalle_remito.set(data);
    })
  }
}
