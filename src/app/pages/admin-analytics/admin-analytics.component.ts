import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { AdminAnalyticsService, AdminUser, AdminBodyWeightRecord, AdminExerciseRecord, AdminExercise, AdminSubscription } from '../../core/services/admin-analytics.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, NavbarComponent, FooterComponent, TranslateModule],
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.scss']
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);
  private themeService = inject(ThemeService);

  // States
  loading = signal(true);
  error = signal<string | null>(null);

  // Raw data from service
  users = signal<AdminUser[]>([]);
  bodyWeights = signal<AdminBodyWeightRecord[]>([]);
  exerciseRecords = signal<AdminExerciseRecord[]>([]);
  exercises = signal<AdminExercise[]>([]);
  subscriptions = signal<AdminSubscription[]>([]);

  // Selected state for filters
  selectedUserId = signal<string>('ALL');

  // Chart configuration for weight evolution
  public weightChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [],
      label: 'Peso Corporal (kg)',
      borderColor: '#10B981', // Verde neón
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.3,
      borderWidth: 3,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#ffffff',
      pointHoverRadius: 7
    }],
    labels: []
  };

  public weightChartOptions: ChartConfiguration['options'] = {};

  public weightChartType: ChartType = 'line';

  constructor() {
    effect(() => {
      const isDark = this.themeService.isDark();
      this.updateChartTheme(isDark);
    });
  }

  /**
   * Dynamically updates the chart visualization colors based on active theme context.
   */
  private updateChartTheme(isDark: boolean) {
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const legendColor = isDark ? '#f3f4f6' : '#1f2937';
    const tooltipBg = isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipColor = isDark ? '#fff' : '#111827';
    const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    this.weightChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Outfit, sans-serif' } }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Outfit, sans-serif' } }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: legendColor,
            font: { family: 'Outfit, sans-serif', size: 12, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipColor,
          bodyColor: textColor,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false
        }
      }
    };
  }

  // KPI calculations
  totalUsersCount = signal(0);
  activeSubscriptionsCount = signal(0);
  selectedUserWeightsCount = signal(0);
  selectedUserMaxWeightLifted = signal(0);

  ngOnInit() {
    this.loadData();
  }

  /**
   * Fetches all global analytics data from Supabase.
   */
  loadData(isRefresh = false) {
    if (isRefresh) {
      this.loading.set(true);
    }
    this.error.set(null);

    this.analyticsService.getGlobalAnalyticsData().subscribe({
      next: (data) => {
        this.users.set(data.users);
        this.bodyWeights.set(data.bodyWeights);
        this.exerciseRecords.set(data.exerciseRecords);
        this.exercises.set(data.exercises);
        this.subscriptions.set(data.subscriptions);

        // Por defecto no preseleccionamos ningún usuario para que se muestre el Directorio al iniciar
        this.selectedUserId.set('ALL');

        this.calculateStats();
        this.updateCharts();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching analytics data', err);
        this.error.set('No se pudieron cargar las analíticas de Supabase. Por favor, revisa tus políticas RLS y conexión.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Triggers when user selector filter changes.
   */
  onUserFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedUserId.set(target.value);
    this.calculateStats();
    this.updateCharts();
  }

  /**
   * Refreshes dashboard data.
   */
  refreshDashboard() {
    this.loadData(true);
  }

  /**
   * Calculates overall KPIs and filtered KPIs.
   */
  calculateStats() {
    // Overall Stats
    this.totalUsersCount.set(this.users().length);
    this.activeSubscriptionsCount.set(
      this.subscriptions().filter(s => s.status.toLowerCase() === 'active').length
    );

    const uid = this.selectedUserId();

    // Selected user specific stats
    if (uid === 'ALL') {
      this.selectedUserWeightsCount.set(this.bodyWeights().length);
      const allWeights = this.exerciseRecords().map(r => r.weight);
      this.selectedUserMaxWeightLifted.set(allWeights.length > 0 ? Math.max(...allWeights) : 0);
    } else {
      const userWeights = this.bodyWeights().filter(w => w.userId === uid);
      this.selectedUserWeightsCount.set(userWeights.length);

      const userRecords = this.exerciseRecords().filter(r => r.userId === uid);
      const weights = userRecords.map(r => r.weight);
      this.selectedUserMaxWeightLifted.set(weights.length > 0 ? Math.max(...weights) : 0);
    }
  }

  /**
   * Syncs weight records of selected user into chart datasets.
   */
  updateCharts() {
    const uid = this.selectedUserId();
    let filteredWeights = [...this.bodyWeights()];

    if (uid !== 'ALL') {
      filteredWeights = filteredWeights.filter(w => w.userId === uid);
    }

    // Sort by date ascending to render chronologically
    filteredWeights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dates = filteredWeights.map(w => new Date(w.date).toLocaleDateString());
    const weights = filteredWeights.map(w => w.weight);

    this.weightChartData = {
      labels: dates,
      datasets: [{
        data: weights,
        label: uid === 'ALL' ? 'Todos los registros de peso (kg)' : 'Peso Corporal del Usuario (kg)',
        borderColor: '#10B981', // Verde neón
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 7
      }]
    };
  }

  /**
   * Getter for exercise records filtered by selected user.
   */
  get filteredExerciseLogs(): AdminExerciseRecord[] {
    const uid = this.selectedUserId();
    let logs = [...this.exerciseRecords()];
    if (uid !== 'ALL') {
      logs = logs.filter(r => r.userId === uid);
    }
    // Sort descending by date to show newest first in table
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Getter to display a friendly name in user specific KPIs.
   */
  get selectedUserLabel(): string {
    const uid = this.selectedUserId();
    if (uid === 'ALL') return 'Todos';
    const user = this.users().find(u => u.id === uid);
    return user ? (user.name || user.email) : 'Desconocido';
  }
}
