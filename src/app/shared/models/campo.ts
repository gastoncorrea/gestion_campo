export interface Campo {
  id_campo?: string;
  nombre: string;
  propietario?: string;
  provincia?: string;
  localidad?: string;
  ubicacion: string;
  superficie_ha?: number;
  latitud?: number;
  longitud?: number;
  coordenadas_json?: string;
}
