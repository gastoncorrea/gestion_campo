import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { forkJoin, map, Observable } from 'rxjs';
import { RemitoService } from '../remito/remito-service';
import { RemitoDetalleService } from '../remito/remito-detalle-service';
import { CompraDetalleService } from './compras-detalle-service';

@Injectable({
  providedIn: 'root',
})
export class Compras {
  private http = inject(HttpClient);
  private remitoService = inject(RemitoService);
  private remitoDetalleService = inject(RemitoDetalleService);
  public compraDetalleService = inject(CompraDetalleService);

  private apiKey = environment.apiKey;
  private spreadsSheetId = environment.spreadsheetId;
  private appUrl = environment.appsScriptUrl;
  private sheetName = "Compra";

  obtenerRemitosConEstado(): Observable<any[]> {
    return forkJoin({
      remitos: this.remitoService.obtenerRemitos(),
      compras: this.obtenerCompras(),
      detallesRemitos: this.remitoDetalleService.obtenerTodosLosDetalles(),
      detallesCompras: this.compraDetalleService.obtenerTodosLosDetalles()
    }).pipe(
      map(({ remitos, compras, detallesRemitos, detallesCompras }) => {
        return remitos.map(remito => {
          // Extraer solo la parte numérica del Nro Remito para la comparación
          const idRemitoRaw = String(remito['Nro Remito']).trim();
          const idRemito = idRemitoRaw.includes('-') ? idRemitoRaw.split('-')[1] : idRemitoRaw;
          
          // Verificar si existe en la lista "Compra" (buscamos por la parte numérica)
          const existeEnCompra = compras.some(c => {
            const idCompraRem = String(c['Nro Remito']).trim();
            const idCompraRemClean = idCompraRem.includes('-') ? idCompraRem.split('-')[1] : idCompraRem;
            return idCompraRemClean === idRemito;
          });

          if (!existeEnCompra) {
            return { ...remito, estado: 'Pendiente', claseEstado: 'estado-pendiente' };
          }

          // Si existe, comparamos cantidades en los detalles
          const itemsEnDetalleRemito = detallesRemitos.filter(item => {
            const valRaw = String(item['Nro Remito']).trim();
            const val = valRaw.includes('-') ? valRaw.split('-')[1] : valRaw;
            const esItemValido = item['Estado'] ? item['Estado'] === 'Pendiente' : true;
            return val === idRemito && esItemValido;
          });

          const comprasAsociadasIds = compras
            .filter(c => {
              const idCompraRem = String(c['Nro Remito']).trim();
              const idCompraRemClean = idCompraRem.includes('-') ? idCompraRem.split('-')[1] : idCompraRem;
              return idCompraRemClean === idRemito;
            })
            .map(c => String(c.id_compra).trim());

          const itemsEnDetalleCompra = detallesCompras.filter(itemCompra => 
            comprasAsociadasIds.includes(String(itemCompra.id_compra).trim())
          );

          console.log(`Remito: ${idRemito}, itemsRemito: ${itemsEnDetalleRemito.length}, itemsCompra: ${itemsEnDetalleCompra.length}`);

          let estado = 'Parcial';
          let claseEstado = 'estado-parcial';

          if (itemsEnDetalleRemito.length > 0 && itemsEnDetalleRemito.length === itemsEnDetalleCompra.length) {
            estado = 'Completo';
            claseEstado = 'estado-completo';
          }

          return { ...remito, estado, claseEstado };
        });
      })
    );
  }

  obtenerCompras(): Observable<any[]> {
    const rango = encodeURIComponent(`${this.sheetName}!A1:Z1000`);

    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/` +
      `${this.spreadsSheetId}/values/${rango}?key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const rows = response.values || [];
        if (rows.length === 0) return [];

        const headers = rows[0];
        console.log('Headers en hoja Compra:', headers);
        console.log('Primera fila de datos:', rows[1]);

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

  crearCompra(data: any): Observable<any> {
    const payload = {
      action: 'guardarCompra',
      data: {
        compra: {
          id_compra: data.id_compra,
          id_rem: data.id_rem,
          fecha: data.fecha,
          proveedor: data.proveedor,
          moneda: data.moneda,
          cotizacion_moneda: data.cotizacion_moneda,
          total: data.total_ars
        },
        detalle: data.detalles.map((item: any) => ({
          id_compra: data.id_compra,
          id_det_rem: item.id_det_rem,
          producto: item.producto,
          precio: item.precio,
          impuesto: item.impuesto,
          total: item.total
        }))
      }
    };

    console.log('Enviando payload a Apps Script:', payload);

    // Usamos text/plain para evitar el PREFLIGHT (OPTIONS)
    // Y responseType: 'text' porque GAS a veces devuelve un 302 redirect que HttpClient no maneja bien como JSON
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
