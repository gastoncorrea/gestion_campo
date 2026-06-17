import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RemitoDetalleService {
  private http = inject(HttpClient);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private sheetName = "Detalle remito";

  obtenerDetalleRemitos(id: string): Observable<any[]> {
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
            
            if (normalizedKey === 'nro_remito' || normalizedKey === 'id_rem') {
                obj['nro_remito'] = val;
            } else if (normalizedKey === 'cantidad' || normalizedKey === 'cant') {
                obj['cantidad'] = val;
            } else {
                obj[normalizedKey] = val;
            }
            obj[header] = val;
          });

          return obj;
        });

        console.log('Detalle remito - Headers normalizados');
        console.log('Buscando coincidencia para:', id);

        const filtrados = objetos.filter(item => {
          const val = item.nro_remito || item['Nro Remito'];
          return val && String(val).trim() === String(id).trim();
        });

        console.log('Objetos filtrados:', filtrados);
        return filtrados;
      })
    );
  }

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
            const val = fila[index] ?? '';
            const normalizedKey = header.toLowerCase().replace(/\s+/g, '_').trim();
            
            if (normalizedKey === 'nro_remito' || normalizedKey === 'id_rem') {
                obj['nro_remito'] = val;
            } else if (normalizedKey === 'cantidad' || normalizedKey === 'cant') {
                obj['cantidad'] = val;
            } else {
                obj[normalizedKey] = val;
            }
            obj[header] = val;
          });
          return obj;
        });
      })
    );
  }
}
