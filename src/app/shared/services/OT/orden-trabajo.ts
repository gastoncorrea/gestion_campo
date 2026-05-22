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
            obj[header] = row[index]??'';
          });

          return obj;
        })
      })
    )
  }
}
