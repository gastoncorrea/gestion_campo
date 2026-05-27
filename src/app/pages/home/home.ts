import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar, } from '@fortawesome/free-solid-svg-icons'
import { faFileLines} from '@fortawesome/free-regular-svg-icons'

@Component({
  selector: 'app-home',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  faChartBar = faChartBar;
  faFileLines = faFileLines;
}

