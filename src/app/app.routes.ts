import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { RegisterComponent } from './pages/register/register.component';
import { CentersComponent } from './pages/centers/centers.component';
// Importamos el componente de máquinas (lo crearemos en el siguiente paso)
import { MachinesComponent } from './pages/machines/machines.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard]
    },
    {
        path: 'centers',
        component: CentersComponent,
        canActivate: [authGuard]
    },
    {
        path: 'machines',
        component: MachinesComponent, // Asegúrate de crear este componente o dará error
        canActivate: [authGuard]
    }
];