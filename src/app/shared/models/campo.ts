export interface Campo {
  id_campo?: string;
  nombre: string;
  ubicacion: string;
  provincia?: string;
  localidad?: string;
  superficie_total_ha?: number;
  propietario?: string;
  latitud?: number;
  longitud?: number;
  coordenadas_json?: string;
}
