import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrdenTrabajo {
  private http = inject(HttpClient);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private sheetName = "Ordenes de trabajo";

  obtenerOrdenes():Observable<any[]>{
    const range = encodeURIComponent(`${this.sheetName}!A1:Z1000`);

    const url = 
      `https://sheets.googleapis.com/v4/spreadsheets/`+
      `${this.spreadsSheetId}/values/${range}?key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const rows = response.values || [];
        if(rows.length === 0)return [];

        const headers = rows[0];

        return rows.slice(1).map((row:any[])=>{
          const obj:any = {};

          headers.forEach((header:string,index:number) => {
            const val = row[index]??'';
            const normalizedKey = header.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, '_').trim();
            
            // Mapeo a las claves que usa el componente (parece que prefiere Mayúsculas para OT)
            if (normalizedKey === 'ot_id' || normalizedKey === 'nro_ot' || normalizedKey === 'id_ot') {
                obj['OT_ID'] = val;
            } else if (normalizedKey === 'cantidad' || normalizedKey === 'cant') {
                obj['CANTIDAD'] = val;
            } else if (normalizedKey === 'lote') {
                obj['LOTE'] = val;
            } else if (normalizedKey === 'servicio') {
                obj['SERVICIO'] = val;
            } else if (normalizedKey === 'proveedor' || normalizedKey === 'contratista') {
                obj['PROVEEDOR'] = val;
            } else if (normalizedKey === 'campo') {
                obj['CAMPO'] = val;
            } else if (normalizedKey === 'maquina') {
                obj['MAQUINA'] = val;
            } else {
                obj[normalizedKey] = val;
            }
            
            obj[header] = val;
          });

          return obj;
        })
      })
    )
  }
}
