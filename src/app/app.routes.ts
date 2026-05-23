import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';


/**
 * Application route configuration.
 * Defines the mapping between URL paths and their respective components,
 * including lazy-loading and route guards for authentication and authorization.
 */
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
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
        canActivate: [guestGuard]
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
        canActivate: [guestGuard]
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'centers',
        loadComponent: () => import('./pages/centers/centers.component').then(m => m.CentersComponent),
        canActivate: [authGuard]
    },
    {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
        canActivate: [authGuard]
    },
    {
        path: 'qr',
        loadComponent: () => import('./pages/qr/qr.component').then(m => m.QrComponent),
        canActivate: [authGuard]
    },
    {
        path: 'qr-scanner',
        loadComponent: () => import('./pages/qr-scanner/qr-scanner.component').then(m => m.QrScannerComponent),
        canActivate: [authGuard, roleGuard('SUPERADMIN', 'ADMIN_CENTER')]
    },
    {
        path: 'machines',
        loadComponent: () => import('./pages/machines/machines.component').then(m => m.MachinesComponent),
        canActivate: [authGuard]
    },
    {
        path: 'clases',
        loadComponent: () => import('./pages/clases/clases.component').then(m => m.ClasesComponent),
        canActivate: [authGuard]
    },
    {
        path: 'trainers',
        loadComponent: () => import('./pages/trainers/trainers.component').then(m => m.TrainersComponent),
        canActivate: [authGuard]
    },
    {
        path: 'contact',
        component: ContactComponent
    },
    {
        path: 'tickets',
        loadComponent: () => import('./pages/tickets/tickets.component').then(m => m.TicketsComponent),
        canActivate: [authGuard, roleGuard('SUPERADMIN', 'ADMIN_CENTER')]
    },
    {
        path: 'workouts',
        loadComponent: () => import('./pages/workouts/workouts.component').then(m => m.WorkoutsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'diets',
        loadComponent: () => import('./pages/diets/diets.component').then(m => m.DietsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'exercises',
        loadComponent: () => import('./pages/exercises/exercises.component').then(m => m.ExercisesComponent),
        canActivate: [authGuard]
    },
    {
        path: 'meals',
        loadComponent: () => import('./pages/meals/meals.component').then(m => m.MealsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'memberships',
        loadComponent: () => import('./pages/memberships/memberships.component').then(m => m.MembershipsComponent),
    },
    {
        path: 'subscriptions/register',
        loadComponent: () => import('./pages/subscriptions/register-subscription.component').then(m => m.RegisterSubscriptionComponent),
        canActivate: [authGuard, roleGuard('SUPERADMIN', 'ADMIN_CENTER')]
    },
    {
        path: 'subscriptions/catalog',
        loadComponent: () => import('./pages/subscriptions/catalog/catalog.component').then(m => m.CatalogComponent),
        canActivate: [authGuard, roleGuard('SUPERADMIN')]
    },
    {
        path: 'admin/analytics',
        loadComponent: () => import('./pages/admin-analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent),
        canActivate: [authGuard, roleGuard('SUPERADMIN')]
    },
    {
        path: 'performance',
        loadComponent: () => import('./pages/performance/performance.component').then(m => m.PerformanceComponent),
        canActivate: [authGuard]
    },
    {
        path: 'ai-chat',
        loadComponent: () => import('./pages/ai-chat/ai-chat.component').then(m => m.AiChatComponent),
        canActivate: [authGuard]
    }
];