import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { RemitoService } from '../../shared/services/remito/remito-service';
import { RemitoDetalleService } from '../../shared/services/remito/remito-detalle-service';
import { RemitoDetalle } from '../remito-detalle/remito-detalle';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from "@angular/router";
import { Compras } from '../../shared/services/compras';
import { CompraDetalleService } from '../../shared/services/compras-detalle-service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-remito-list-component',
  standalone: true,
  imports: [CommonModule, RemitoDetalle, FontAwesomeModule, RouterLink],
  templateUrl: './remito-list-component.html',
  styleUrl: './remito-list-component.scss',
})
export class RemitoListComponent implements OnInit {
  private remitoService = inject(RemitoService);
  private remitoDetalleService = inject(RemitoDetalleService);
  private comprasService = inject(Compras);
  private compraDetalleService = inject(CompraDetalleService);

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
    forkJoin({
      remitos: this.remitoService.obtenerRemitos(),
      compras: this.comprasService.obtenerCompras(),
      detallesRemitos: this.remitoDetalleService.obtenerTodosLosDetalles(),
      detallesCompras: this.compraDetalleService.obtenerTodosLosDetalles()
    }).subscribe(({ remitos, compras, detallesRemitos, detallesCompras }) => {
      this.todasLasCompras.set(compras);
      this.todosLosDetallesCompras.set(detallesCompras);
      
      const remitosConEstado = remitos.map(remito => {
        const idRemito = String(remito.Re_id || remito['Nro Remito'] || remito['N° Remito']).trim();
        
        // Cantidad total de items que debería tener este remito según el detalle
        const itemsEnDetalle = detallesRemitos.filter(item => {
          const val = String(item['N° Remito'] || item['Nro Remito'] || item['REMITO_ID'] || item['Re_id']).trim();
          return val === idRemito;
        });
        const totalItemsRemito = itemsEnDetalle.length;

        // Cantidad de items de este remito que ya han sido comprados (valorizados)
        const comprasAsociadasIds = compras
          .filter(c => String(c.id_rem).trim() === idRemito)
          .map(c => String(c.id_compra).trim());

        const itemsValorizados = detallesCompras.filter(itemCompra => 
          comprasAsociadasIds.includes(String(itemCompra.id_compra).trim())
        ).length;

        let estado = 'Pendiente';
        let claseEstado = 'estado-pendiente';

        if (totalItemsRemito > 0) {
          if (itemsValorizados >= totalItemsRemito) {
            estado = 'Completo';
            claseEstado = 'estado-completo';
          } else if (itemsValorizados > 0) {
            estado = 'Parcial';
            claseEstado = 'estado-parcial';
          }
        }
        // Si totalItemsRemito es 0, se queda como 'Pendiente' por defecto o puedes ajustar si prefieres otro comportamiento.

        console.log(`Remito ${idRemito}: itemsRemito=${totalItemsRemito}, itemsValorizados=${itemsValorizados}, estado=${estado}, clase=${claseEstado}`);

        return { ...remito, estado, claseEstado };
      });

      this.remitos.set(remitosConEstado);
    });
  }

  seleccionarRemito(remito: any): void {
    const id = remito.Re_id || remito['Nro Remito'] || remito['N° Remito'];
    
    if (this.remitoSeleccionado() === id) {
      this.remitoSeleccionado.set(null);
      this.detalle_remito.set([]);
      return;
    }
    this.remitoSeleccionado.set(id);
    this.detalle_remito.set([]);
    
    const linkId = remito['Nro Remito'] || remito['N° Remito'] || remito.Re_id;
    
    this.remitoDetalleService.obtenerDetalleRemitos(linkId).subscribe(data => {
      this.detalle_remito.set(data);
    })
  }
}
