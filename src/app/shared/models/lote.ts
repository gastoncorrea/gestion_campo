export interface Lote {
  id_lote?: string;
  campo_id: string;
  nombre_lote: string;
  superfice_ha: number;
  latitud: number;
  longitud: number;
  coordenadas_json: string;
  cultivo_actual: string;
}
