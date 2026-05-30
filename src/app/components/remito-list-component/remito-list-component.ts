import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { RemitoDetalle } from '../remito-detalle/remito-detalle';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from "@angular/router";
import { Compras } from '../../shared/services/compras/compras';
import { RemitoDetalleService } from '../../shared/services/remito/remito-detalle-service';

@Component({
  selector: 'app-remito-list-component',
  standalone: true,
  imports: [CommonModule, RemitoDetalle, FontAwesomeModule, RouterLink],
  templateUrl: './remito-list-component.html',
  styleUrl: './remito-list-component.scss',
})
export class RemitoListComponent implements OnInit {
  private remitoDetalleService = inject(RemitoDetalleService);
  private comprasService = inject(Compras);

  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  remitos = signal<any[]>([]);
  remitoSeleccionado = signal<string | null>(null);
  detalle_remito = signal<any[]>([]);
  todasLasCompras = signal<any[]>([]);
  todosLosDetallesCompras = signal<any[]>([]);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.comprasService.obtenerRemitosConEstado().subscribe((remitosConEstado) => {
      this.remitos.set(remitosConEstado);
    });
    
    // Necesitamos cargar los datos para el componente hijo de detalle
    this.comprasService.obtenerCompras().subscribe(c => this.todasLasCompras.set(c));
    this.comprasService.compraDetalleService.obtenerTodosLosDetalles().subscribe(d => this.todosLosDetallesCompras.set(d));
  }

  seleccionarRemito(event: Event, remito: any): void {
    event.stopPropagation();
    const id = remito['Nro Remito'];
    
    if (this.remitoSeleccionado() === id) {
      this.remitoSeleccionado.set(null);
      this.detalle_remito.set([]);
      return;
    }
    this.remitoSeleccionado.set(id);
    this.detalle_remito.set([]);
    
    const linkId = remito['Nro Remito'];
    
    this.remitoDetalleService.obtenerDetalleRemitos(linkId).subscribe(data => {
      this.detalle_remito.set(data);
    })
  }
}
