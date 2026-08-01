import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Lote } from '../../shared/models/lote';
import * as L from 'leaflet';

@Component({
  selector: 'app-lote-map',
  standalone: true,
  imports: [],
  templateUrl: './lote-map.html',
  styleUrl: './lote-map.scss',
})
export class LoteMap  implements AfterViewInit, OnChanges {
   @Input({ required: true })
  lote!: Lote;

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<HTMLDivElement>;

  private map!: L.Map;

  ngAfterViewInit(): void {
    this.crearMapa();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['lote'] && this.map) {

      this.map.remove();

      this.crearMapa();

    }

  }

  private crearMapa(): void {

    if (!this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement);

    this.map.setView(
      [this.lote.latitud, this.lote.longitud],
      15
    );

    L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    ).addTo(this.map);

    L.marker([
      this.lote.latitud,
      this.lote.longitud
    ]).addTo(this.map);

    if (this.lote.coordenadas_geojson) {

      const geojson = JSON.parse(
        this.lote.coordenadas_geojson
      );

      const capa = L.geoJSON(geojson).addTo(this.map);

      this.map.fitBounds(capa.getBounds());

    }

  }
}
