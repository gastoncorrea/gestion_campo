import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrdenDetalleService {
  private http = inject(HttpClient);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private sheetName = "Detalle OT";

  obtenerDetalleOrdenes(id: string): Observable<any[]> {
    const rango = encodeURIComponent(`${this.sheetName}!A1:Z1000`);
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/` +
      `${this.spreadsSheetId}/values/${rango}?key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const filas = response.values || [];

        if (filas.length < 2) {
          return [];
        }

        const headers = filas[0];

        const objetos:any[] = filas.slice(1).map((fila: any[]) => {
          const obj: any = {};

          headers.forEach((header: string, index: number) => {
            const val = fila[index] ?? '';
            const normalizedKey = header.toLowerCase().replace(/\s+/g, '_').trim();
            
            if (normalizedKey === 'ot_id' || normalizedKey === 'id_ot') {
                obj['ot_id'] = val;
            } else if (normalizedKey === 'producto' || normalizedKey === 'prod') {
                obj['producto'] = val;
            } else if (normalizedKey === 'total' || normalizedKey === 'cant') {
                obj['total'] = val;
            } else {
                obj[normalizedKey] = val;
            }
            obj[header] = val;
          });

          return obj;
        });

        return objetos.filter(item => (item.ot_id || item['OT_ID']) === id);
      })
    );
  }
}