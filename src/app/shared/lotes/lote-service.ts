import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Lote } from '../models/lote';
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
          superficie_ha: data.superfice_ha,
          latitud: data.latitud,
          longitud: data.longitud,
          coordendas_json: data.coordenadas_json
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
}
