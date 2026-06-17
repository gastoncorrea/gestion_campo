import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { forkJoin, map, Observable } from 'rxjs';
import { RemitoService } from '../remito/remito-service';
import { RemitoDetalleService } from '../remito/remito-detalle-service';
import { CompraDetalleService } from './compras-detalle-service';
import { Compra } from '../../models/compra';
import { DetalleCompra } from '../../models/detalle-compra';

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
            const idCompraRem = String(c.nro_remito || c['Nro Remito'] || '').trim();
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
              const idCompraRem = String(c.nro_remito || c['Nro Remito'] || '').trim();
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

        return rows.slice(1).map((row: any[]) => {
          const obj: any = {};

          headers.forEach((header: string, index: number) => {
            const val = row[index] ?? '';
            // Normalizar el header para el objeto: minúsculas, sin acentos, espacios por guiones bajos
            const normalizedKey = header.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, '_').trim();
            
            // Mapeos específicos para asegurar compatibilidad con el modelo
            if (normalizedKey === 'nro_remito' || normalizedKey === 'id_rem') {
                obj['nro_remito'] = val;
            } else if (normalizedKey === 'total_remito' || normalizedKey === 'total') {
                obj['total_remito'] = val;
            } else if (normalizedKey === 'cotizacion_moneda' || normalizedKey === 'tipo_de_cambio' || normalizedKey === 'cotizacion' || normalizedKey === 'tipo_cambio') {
                obj['cotizacion_moneda'] = val;
            } else {
                obj[normalizedKey] = val;
            }
            
            // Mantener también el original por si acaso
            obj[header] = val;
          });
          return obj;
        })
      })
    )
  }

  crearCompra(data: { compra: Compra, detalles: DetalleCompra[] }): Observable<any> {
    const payload = {
      action: 'guardarCompra',
      data: {
        compra: {
          id_compra: data.compra.id_compra,
          nro_remito: data.compra.nro_remito,
          fecha: data.compra.fecha,
          proveedor: data.compra.proveedor,
          moneda: data.compra.moneda,
          cotizacion_moneda: data.compra.cotizacion_moneda,
          total_remito: data.compra.total_remito
        },
        detalle: data.detalles.map((item: DetalleCompra) => ({
          id_compra: item.id_compra,
          id_det_rem: item.id_det_rem,
          producto: item.producto,
          precio: item.precio,
          impuesto: item.impuesto,
          subtotal: item.subtotal
        }))
      }
    };

    console.log('Enviando payload a Apps Script:', payload);

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
