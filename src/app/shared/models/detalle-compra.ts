export interface DetalleCompra {
  id_det_compra?: string;
  id_compra: string;
  id_det_rem: string;
  producto: string;
  precio: number;
  impuesto: number;
  subtotal: number;
}
