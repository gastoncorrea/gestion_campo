import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CostoLaboresDetalleService {
  private http = inject(HttpClient);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private sheetName = "Detalle Costo labores";

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
            const normalizedKey = header.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, '_').trim();
            
            if (normalizedKey === 'id_labor' || normalizedKey === 'labor_id') {
                obj['id_labor'] = val;
            } else if (normalizedKey === 'costo_total' || normalizedKey === 'total') {
                obj['costo_total'] = val;
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

  obtenerDetallesPorLabor(idLabor: string): Observable<any[]> {
    return this.obtenerTodosLosDetalles().pipe(
      map(detalles => detalles.filter(d => String(d.id_labor).trim() === String(idLabor).trim()))
    );
  }
}
