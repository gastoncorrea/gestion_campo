import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Lote } from '../../models/lote';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoteService {

  private http = inject(HttpClient);

  private apiKey = environment.apiKey;
    private spreadsSheetId = environment.spreadsheetId;
    private appUrl = environment.appsScriptUrl;
    private sheetName = "Lotes";

  crearLote(data: Lote): Observable<any> {
    const payload = {
      action: 'guardarLote',
      data:{
        lote:{
          campo_id: data.campo_id,
          nombre_lote: data.nombre_lote,
          superficie_ha: data.superficie_ha,
          latitud: data.latitud,
          longitud: data.longitud,
          coordenadas_geojson: data.coordenadas_geojson
        }
      }
    }
    return this.http.post(this.appUrl, JSON.stringify(payload),{
      headers:{'Content-Type':'text/plain'},
      responseType:'text'
    }).pipe(
      map(res => {
        try {
          return JSON.parse(res);
        }catch(e){
          return res;
        }
      })
    )
  }

  obtenerLotes():Observable<any[]>{
    const rango = encodeURIComponent(`${this.sheetName}!A1:Z1000`);

    const url =
    `https://sheets.googleapis.com/v4/spreadsheets/`+
      `${this.spreadsSheetId}/values/${rango}?key=${this.apiKey}`;

      return this.http.get<any>(url).pipe(
        map(response => {
          const rows = response.values || [];
          if(rows.length === 0) return [];

          const headers = rows[0];

          return rows.slice(1).map((row:any[])=>{
            const obj:any = {};

            headers.forEach((header:string, index:number) => {
              obj[header] = row[index]??'';
            });
            return obj;
          })
        })
      )
  }
}
