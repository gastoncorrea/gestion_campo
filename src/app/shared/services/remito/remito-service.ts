import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RemitoService {
  private http = inject(HttpClient);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private sheetName = "Remito";

  obtenerRemitos():Observable<any[]>{
    const rango = encodeURIComponent(`${this.sheetName}!A1:Z1000`);

    const url =
    `https://sheets.googleapis.com/v4/spreadsheets/`+
      `${this.spreadsSheetId}/values/${rango}?key=${this.apiKey}`;

      return this.http.get<any>(url).pipe(
        map(response => {
          const rows = response.value || [];
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
