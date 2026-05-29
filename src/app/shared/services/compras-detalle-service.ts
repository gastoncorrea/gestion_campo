import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CompraDetalleService {
  private http = inject(HttpClient);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private sheetName = "Detalle compra";

  obtenerTodosLosDetalles(): Observable<any[]> {
    const rango = encodeURIComponent(`${this.sheetName}!A1:Z2000`);
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/` +
      `${this.spreadsSheetId}/values/${rango}?key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const filas = response.values || [];
        if (filas.length < 2) return [];

        const headers = filas[0];
        return filas.slice(1).map((fila: any[]) => {
          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            obj[header] = fila[index] ?? '';
          });
          return obj;
        });
      })
    );
  }

  crearDetallesCompra(detalles: any[], token: string): Observable<any> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsSheetId}/values/${this.sheetName}:append?valueInputOption=USER_ENTERED`;
    
    const rows = detalles.map(d => [
      d.id_detalle_compra,
      d.id_compra,
      d.detalle_rem_id,
      d.producto, // Asumiendo que se quiere guardar el nombre del producto también
      d.precio,
      d.impuesto,
      d.subtotal
    ]);

    const body = { values: rows };

    return this.http.post(url, body, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
}
