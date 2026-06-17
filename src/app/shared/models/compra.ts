export interface Compra {
  id_compra?: string;
  nro_remito: string;
  fecha: string;
  proveedor: string;
  moneda: string;
  cotizacion_moneda: number;
  total_remito: number;
}
