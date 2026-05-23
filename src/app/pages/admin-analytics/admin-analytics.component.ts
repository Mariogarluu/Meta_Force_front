import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { AdminAnalyticsService, AdminUser, AdminBodyWeightRecord, AdminExerciseRecord, AdminExercise, AdminSubscription } from '../../core/services/admin-analytics.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, NavbarComponent, FooterComponent, TranslateModule],
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.scss']
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);

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

  public weightChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af', font: { family: 'Outfit, sans-serif' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Outfit, sans-serif' } }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#f3f4f6',
          font: { family: 'Outfit, sans-serif', size: 12, weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    }
  };

  public weightChartType: ChartType = 'line';

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

        // Pre-select the first user with records if available, to show some charts immediately
        if (data.users.length > 0) {
          const userWithWeights = data.users.find(u => 
            data.bodyWeights.some(w => w.userId === u.id)
          );
          if (userWithWeights) {
            this.selectedUserId.set(userWithWeights.id);
          } else {
            this.selectedUserId.set(data.users[0].id);
          }
        }

        this.calculateStats();
        this.updateCharts();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching analytics data', err);
        this.error.set(`Error de Supabase: ${err.message || err}`);
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
