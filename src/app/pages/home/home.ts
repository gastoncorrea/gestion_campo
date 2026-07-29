import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar, faDollarSign, faCartShopping } from '@fortawesome/free-solid-svg-icons'
import { faFileLines} from '@fortawesome/free-regular-svg-icons'
import { LoteViewComponent } from '../../components/lote/lote-view-component/lote-view-component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FontAwesomeModule,LoteViewComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  faChartBar = faChartBar;
  faFileLines = faFileLines;
  faDollarSign = faDollarSign;
  faCartShopping = faCartShopping;
}

