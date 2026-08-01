import { Component, inject, OnInit, signal } from '@angular/core';
import { LoteService } from '../../../shared/services/lotes/lote-service';
import { Lote } from '../../../shared/models/lote';
import * as L from 'leaflet';
import { LoteMap } from '../../lote-map/lote-map';
import { faCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lote-view-component',
  standalone: true,
  imports: [LoteMap, FontAwesomeModule, RouterLink],
  templateUrl: './lote-view-component.html',
  styleUrl: './lote-view-component.scss',
})
export class LoteViewComponent implements OnInit {
  
  faCircleLeft = faCircleLeft;
  lotes = signal<Lote[]>([]);
  private loteService = inject(LoteService);

  ngOnInit(): void {
    this.cargarLotes();
  }

  cargarLotes() {

    this.loteService.obtenerLotes().subscribe(data => {
      this.lotes.set(data);
      console.log(this.lotes);

      console.log(this.lotes);
    })
  }

  //Usar Leaflet
  guardarLote() {
   /* const lote = {
      campo_id: "1",
      nombre_lote: "1",
      superficie_ha: 128,
      latitud: "23423423",
      longitud: "12312312",
      coordenadas_geojson: ""
    }
    console.log(lote);

    this.loteService.crearLote(lote).subscribe(
      data => {
        console.log(data);
      }
    )*/
  }
}
