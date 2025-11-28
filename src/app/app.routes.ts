import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { RegisterComponent } from './pages/register/register.component';
import { CentersComponent } from './pages/centers/centers.component';
import { UsersComponent } from './pages/users/users.component';
import { QrComponent } from './pages/qr/qr.component';
import { MachinesComponent } from './pages/machines/machines.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'home',
        redirectTo: '',
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
        path: 'users',
        component: UsersComponent,
        canActivate: [authGuard]
    },
    {
        path: 'qr',
        component: QrComponent,
        canActivate: [authGuard]
    },
    {
         path: 'machines',
         component: MachinesComponent,
         canActivate: [authGuard]
    }
];