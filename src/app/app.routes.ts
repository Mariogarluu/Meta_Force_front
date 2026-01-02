import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { RegisterComponent } from './pages/register/register.component';
import { CentersComponent } from './pages/centers/centers.component';
import { UsersComponent } from './pages/users/users.component';
import { QrComponent } from './pages/qr/qr.component';
import { QrScannerComponent } from './pages/qr-scanner/qr-scanner.component';
import { MachinesComponent } from './pages/machines/machines.component';
import { ClasesComponent } from './pages/clases/clases.component';
import { HomeComponent } from './pages/home/home.component';
import { TrainersComponent } from './pages/trainers/trainers.component';
import { ContactComponent } from './pages/contact/contact.component';
import { TicketsComponent } from './pages/tickets/tickets.component';
import { WorkoutsComponent } from './pages/workouts/workouts.component';
import { DietsComponent } from './pages/diets/diets.component';
import { ExercisesComponent } from './pages/exercises/exercises.component';
import { MealsComponent } from './pages/meals/meals.component';
import { MembershipsComponent } from './pages/memberships/memberships.component';
import { roleGuard } from './core/guards/role.guard';

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
        component: LoginComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [guestGuard]
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
        path: 'qr-scanner',
        component: QrScannerComponent,
        canActivate: [authGuard, roleGuard('SUPERADMIN', 'ADMIN_CENTER')]
    },
    {
         path: 'machines',
         component: MachinesComponent,
         canActivate: [authGuard]
    },
    {
        path: 'clases',
        component: ClasesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'trainers',
        component: TrainersComponent,
        canActivate: [authGuard]
    },
    {
        path: 'contact',
        component: ContactComponent
    },
    {
        path: 'tickets',
        component: TicketsComponent,
        canActivate: [authGuard, roleGuard('SUPERADMIN', 'ADMIN_CENTER')]
    },
    {
        path: 'workouts',
        component: WorkoutsComponent,
        canActivate: [authGuard]
    },
    {
        path: 'diets',
        component: DietsComponent,
        canActivate: [authGuard]
    },
    {
        path: 'exercises',
        component: ExercisesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'meals',
        component: MealsComponent,
        canActivate: [authGuard]
    },
    {
        path: 'memberships',
        component: MembershipsComponent,
        canActivate: [authGuard]
    }
];