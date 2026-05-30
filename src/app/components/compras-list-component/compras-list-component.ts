import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Compras } from '../../shared/services/compras/compras';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from '@angular/router';
import { CompraDetalle } from './compra-detalle';
import { CompraDetalleService } from '../../shared/services/compras/compras-detalle-service';

@Component({
  selector: 'app-compras-list-component',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, CompraDetalle],
  templateUrl: './compras-list-component.html',
  styleUrl: './compras-list-component.scss',
})
export class ComprasListComponent implements OnInit {
  private comprasService = inject(Compras);
  private compraDetalleService = inject(CompraDetalleService);
  
  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  compras = signal<any[]>([]);
  compraSeleccionada = signal<string | null>(null);
  detalles_compra = signal<any[]>([]);

  ngOnInit(): void {
    this.comprasService.obtenerCompras().subscribe((data) => {
      this.compras.set(data);
    });
  }

  seleccionarCompra(event: Event, compra: any): void {
    event.stopPropagation();
    const id = String(compra['id_compra']).trim();
    
    if (this.compraSeleccionada() === id) {
      this.compraSeleccionada.set(null);
      this.detalles_compra.set([]);
      return;
    }

    this.compraSeleccionada.set(id);
    this.detalles_compra.set([]);
    
    this.compraDetalleService.obtenerDetallesPorCompra(id).subscribe(data => {
      this.detalles_compra.set(data);
    });
  }

  esCompraSeleccionada(compra: any): boolean {
    const id = String(compra['id_compra'] || '').trim();
    return this.compraSeleccionada() === id;
  }
}
