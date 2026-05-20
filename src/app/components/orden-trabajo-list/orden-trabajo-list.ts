import { Component, inject } from '@angular/core';
import { OrdenTrabajo } from '../../shared/services/orden-trabajo';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orden-trabajo-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orden-trabajo-list.html',
  styleUrl: './orden-trabajo-list.scss',
})
export class OrdenTrabajoList {

  private ordenTrabajoService = inject(OrdenTrabajo);

  ordenes: any[] = [];

  ngOnInit(): void {
    this.ordenTrabajoService.obtenerOrdenes().subscribe(data =>{
      this.ordenes = data;
      console.log(this.ordenes);
    })
  }
}
