import { Routes } from '@angular/router';
import { OrdenTrabajoList } from './components/orden-trabajo-list/orden-trabajo-list';
import { Home } from './pages/home/home';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path:'ot',
        component: OrdenTrabajoList
    }
];
