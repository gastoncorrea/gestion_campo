import { Component, inject, OnInit } from '@angular/core';
import { LoteService } from '../../../shared/services/lotes/lote-service';
import { Lote } from '../../../shared/models/lote';
import * as L from 'leaflet';

@Component({
  selector: 'app-lote-view-component',
  standalone: true,
  imports: [],
  templateUrl: './lote-view-component.html',
  styleUrl: './lote-view-component.scss',
})
export class LoteViewComponent implements OnInit {

  private lotes: Lote[] = [];
  private map: any;
  private userMarker: L.Marker<any> | undefined;

  private loteService = inject(LoteService);

  ngOnInit(): void {
    this.cargarLotes();
    this.initMap();
  }

  cargarLotes() {

    this.loteService.obtenerLotes().subscribe(data => {
      this.lotes = data;
      console.log(this.lotes);

      this.lotes.forEach(lote => {
        console.log("Valor:", lote.coordenadas_geojson);
        console.log("Tipo:", typeof lote.coordenadas_geojson);
        console.log("Longitud:", lote.coordenadas_geojson?.length);
        lote.coordenadas_geojson = JSON.parse(lote.coordenadas_geojson);
      });

      console.log(this.lotes);
    })
  }

  private initMap() {

    this.map = L.map('map').setView([-27.065084, -64.690786], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    this.userMarker = L.marker([-27.065084, -64.690786]).addTo(this.map);

    L.geoJSON({
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [-64.70155157303401, -27.08181349871096],
                [-64.6935897313694, -27.08337129640032],
                [-64.6926905642603, -27.07818050272765],
                [-64.68490571274319, -27.07926032543184],
                [-64.67897205690495, -27.04842753112528],
                [-64.69477564664844, -27.04645568981313],
                [-64.70155157303401, -27.08181349871096]
              ]
            ]
          },
          "properties": {
            "name": "Campo Isca Yacu"
          }
        }
      ]
    } as any).addTo(this.map);

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
