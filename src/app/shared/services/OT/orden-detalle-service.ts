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
            obj[header] = fila[index] ?? '';
          });

          return obj;
        });

        return objetos.filter(item => item['OT_ID'] === id);
      })
    );
  }
}