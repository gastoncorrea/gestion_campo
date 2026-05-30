import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Compras } from '../../shared/services/compras/compras';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-compras-list-component',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './compras-list-component.html',
  styleUrl: './compras-list-component.scss',
})
export class ComprasListComponent implements OnInit {
  private comprasService = inject(Compras);
  
  faPlus = faPlus;
  faCircleLeft = faCircleLeft;
  compras = signal<any[]>([]);

  ngOnInit(): void {
    this.comprasService.obtenerCompras().subscribe((data) => {
      this.compras.set(data);
    });
  }
}
