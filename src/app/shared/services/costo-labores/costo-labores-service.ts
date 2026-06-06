import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';
import { CostoLaboresDetalleService } from './costo-labores-detalle-service';

@Injectable({
  providedIn: 'root',
})
export class CostoLaboresService {
  private http = inject(HttpClient);
  public costoLaboresDetalleService = inject(CostoLaboresDetalleService);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private appUrl = environment.appsScriptUrl;
  private sheetName = "Costo labores";

  obtenerCostosLabores(): Observable<any[]> {
    const rango = encodeURIComponent(`${this.sheetName}!A1:Z1000`);

    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/` +
      `${this.spreadsSheetId}/values/${rango}?key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const rows = response.values || [];
        if (rows.length === 0) return [];

        const headers = rows[0];

        return rows.slice(1).map((row: any[]) => {
          const obj: any = {};

          headers.forEach((header: string, index: number) => {
            obj[header] = row[index] ?? '';
          });
          return obj;
        })
      })
    )
  }

  crearCostoLabor(data: any): Observable<any> {
    const payload = {
      action: 'guardarCostoLabor',
      data: {
        costoLabor: {
          id_labor: data.id_labor,
          id_ot: data.id_ot,
          fecha: data.fecha,
          moneda: data.moneda,
          cotizacion_moneda: data.cotizacion_moneda,
          costo_servicio: data.costo_servicio,
          total_servicio_ot: data.total_servicio_ot,
          total_insumos: data.total_insumos,
          total: data.total_ars
        },
        detalle: data.detalles.map((item: any) => ({
          id_det_labor: item.id_det_labor,
          id_labor: data.id_labor,
          producto: item.producto,
          cantidad: item.cantidad,
          costo_sugerido: item.costo_sugerido,
          costo_utilizado: item.costo_utilizado,
          costo_total: item.costo_total
        }))
      }
    };

    console.log('Enviando payload de Costo Labor a Apps Script:', payload);

    return this.http.post(this.appUrl, JSON.stringify(payload), {
      headers: { 'Content-Type': 'text/plain' },
      responseType: 'text'
    }).pipe(
      map(res => {
        try {
          return JSON.parse(res);
        } catch (e) {
          return res;
        }
      })
    );
  }
}
