import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { PerformanceService, BodyWeightRecord, ExerciseRecord, Exercise } from './performance.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

/**
 * Time window options used to filter performance data in charts and KPIs.
 */
export type TimeFilter = '1M' | '3M' | '6M' | '1Y' | 'ALL';

/**
 * Component for tracking and visualizing user performance metrics.
 * Handles body weight records and exercise-specific performance (1RM tracking).
 * Uses ng2-charts and chart.js for data visualization.
 */
@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, NavbarComponent, TranslateModule],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  /** Injected PerformanceService for data persistence */
  private performanceService = inject(PerformanceService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  /** Currently selected tab in the UI */
  activeTab: 'body-weight' | 'exercises' = 'body-weight';
  activeTimeFilter: TimeFilter = 'ALL';
  timeFilters: TimeFilter[] = ['1M', '3M', '6M', '1Y', 'ALL'];

  /** Goals */
  weightGoal: number | null = null;
  exerciseGoal: number | null = null;

  /** List of body weight records fetched from the backend */
  bodyWeights: BodyWeightRecord[] = [];
  /** List of individual exercise logs/performances */
  exerciseRecords: ExerciseRecord[] = [];
  /** List of available exercises for selection */
  exercises: Exercise[] = [];

  /** Recent performance events used for AI coaching */
  performanceEvents: {
    id: string;
    kind: string;
    severity: string;
    payload?: any;
    createdAt: string;
    acknowledgedAt?: string | null;
  }[] = [];

  /** Form model for adding a new body weight entry */
  newBodyWeight = { weight: 0, date: new Date().toISOString().split('T')[0], notes: '' };
  /** Form model for adding a new exercise performance record */
  newExerciseRecord = { exerciseId: '', weight: 0, reps: 0, date: new Date().toISOString().split('T')[0], notes: '' };

  /** Visual and behavioral common options for all charts */
  private commonChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(156, 163, 175, 0.2)' },
        ticks: { color: '#9ca3af' }
      },
      x: {
        grid: { color: 'rgba(156, 163, 175, 0.2)' },
        ticks: { color: '#9ca3af' }
      }
    },
    plugins: {
      legend: { labels: { color: '#9ca3af' } },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(75, 85, 99, 0.4)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        cornerRadius: 8
      }
    }
  };
  /** Configuration for the body weight history line chart */
  public weightChartData: ChartConfiguration['data'] = {
    datasets: [{ data: [], label: 'Peso Corporal (kg)', borderColor: '#0891b2', fill: false, tension: 0.1 }],
    labels: []
  };
  /** Visual and behavioral options for the weight chart */
  public weightChartOptions: ChartConfiguration['options'] = this.commonChartOptions;

  /** The type of chart used for visualization */
  public weightChartType: ChartType = 'line';

  /** The ID of the exercise currently displayed in the exercise chart */
  public selectedExerciseChartId: string = '';
  /** Configuration for the specific exercise performance chart */
  public exerciseChartData: ChartConfiguration['data'] = {
    datasets: [{ data: [], label: 'Peso Movido (kg)', borderColor: '#2563eb', fill: false, tension: 0.1 }],
    labels: []
  };

  /** Gets exercise records filtered by the currently selected exercise chart ID */
  get filteredExerciseRecords() {
    return this.exerciseRecords.filter(r => r.exercise.id === this.selectedExerciseChartId);
  }

  /** KPI Getters */
  get currentWeightDiff(): number {
    if (this.bodyWeights.length < 2) return 0;
    const sorted = [...this.bodyWeights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const initial = sorted[0].weight;
    const current = sorted[sorted.length - 1].weight;
    return Number((current - initial).toFixed(1));
  }

  get top1RM(): number {
    if (this.exerciseRecords.length === 0) return 0;
    return Math.max(...this.exerciseRecords.map(r => this.calculate1RM(r.weight, r.reps)));
  }

  get activeDays(): number {
      const allDates = [...this.bodyWeights.map(w => w.date.split('T')[0]), ...this.exerciseRecords.map(e => e.date.split('T')[0])];
      return new Set(allDates).size;
  }

  get activityLevel(): { label: string; colorClass: string; percentage: number } {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentDates = [...this.bodyWeights.map(w => w.date), ...this.exerciseRecords.map(e => e.date)]
      .filter(dateStr => new Date(dateStr) >= thirtyDaysAgo)
      .map(dateStr => dateStr.split('T')[0]);
    
    const uniqueRecentDays = new Set(recentDates).size;
    const percentage = Math.min(Math.round((uniqueRecentDays / 30) * 100), 100);

    if (uniqueRecentDays >= 16) {
      return { label: 'performance.kpi.levels.high', colorClass: 'text-green-500', percentage };
    } else if (uniqueRecentDays >= 8) {
      return { label: 'performance.kpi.levels.medium', colorClass: 'text-yellow-500', percentage };
    } else {
      return { label: 'performance.kpi.levels.low', colorClass: 'text-red-500', percentage };
    }
  }

  /**
   * Calcula los días transcurridos desde la última actividad registrada (peso o ejercicio).
   */
  get daysSinceLastActivity(): number {
    const allDates = [...this.bodyWeights.map(w => w.date), ...this.exerciseRecords.map(e => e.date)];
    if (allDates.length === 0) return 0; // Si no hay registros, asumimos que acaba de empezar
    
    const sortedDates = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const lastActivity = new Date(sortedDates[0]);
    const now = new Date();
    
    // Normalizar a inicio del día para evitar problemas de horas
    lastActivity.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Determina si se debe mostrar el banner de recordatorio de asistencia (> 3 días).
   */
  get showInactivityReminder(): boolean {
    return this.daysSinceLastActivity > 3;
  }

  /**
   * Proporciona un resumen de la progresión del 1RM del ejercicio actual seleccionado.
   */
  get exerciseProgressSummary(): { key: string; params?: any; isPositive: boolean } | null {
    if (!this.selectedExerciseChartId) return null;
    const records = [...this.filteredExerciseRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (records.length < 2) return null;

    const initial1RM = this.calculate1RM(records[0].weight, records[0].reps);
    const current1RM = this.calculate1RM(records[records.length - 1].weight, records[records.length - 1].reps);
    
    const diff = current1RM - initial1RM;
    const percentage = ((diff / initial1RM) * 100).toFixed(1);

    if (diff > 0) {
      return { key: 'performance.exercises.progressSummaryPositive', params: { diff, percentage }, isPositive: true };
    } else if (diff < 0) {
      return { key: 'performance.exercises.progressSummaryNegative', params: { diff: Math.abs(diff), percentage }, isPositive: false };
    } else {
      return { key: 'performance.exercises.progressSummaryStable', isPositive: true };
    }
  }

  /** Navigation */
  goToAiChat(eventSummary?: string) {
    if (eventSummary) {
      this.router.navigate(['/ai-chat'], { queryParams: { eventSummary } });
    } else {
      this.router.navigate(['/ai-chat']);
    }
  }

  /** Brzycki Formula */
  calculate1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round(weight * (36 / (37 - reps)));
  }

  /** Time Filtering */
  filterRecordsByTime<T>(records: T[], dateExtractor: (item: T) => string): T[] {
    if (this.activeTimeFilter === 'ALL') return records;
    const now = new Date();
    const cutoff = new Date();
    switch (this.activeTimeFilter) {
      case '1M': cutoff.setMonth(now.getMonth() - 1); break;
      case '3M': cutoff.setMonth(now.getMonth() - 3); break;
      case '6M': cutoff.setMonth(now.getMonth() - 6); break;
      case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break;
    }
    return records.filter(r => new Date(dateExtractor(r)) >= cutoff);
  }

  /**
   * Updates the active time filter and refreshes the currently visible chart.
   */
  setTimeFilter(filter: TimeFilter) {
    this.activeTimeFilter = filter;
    if (this.activeTab === 'body-weight') {
      this.updateWeightChart();
    } else {
      this.updateExerciseChart();
    }
  }

  /**
   * Handles tab changes between body‑weight and exercise performance views.
   */
  onTabChange(tab: 'body-weight' | 'exercises') {
    this.activeTab = tab;
    this.activeTimeFilter = 'ALL';
    if (tab === 'body-weight') this.updateWeightChart();
    else this.updateExerciseChart();
  }

  /**
   * Initializes data fetching for body weights, exercises, records and events.
   */
  ngOnInit() {
    this.loadBodyWeights();
    this.loadExercises();
    this.loadExerciseRecords();
    this.loadPerformanceEvents();
  }

  /**
   * Fetches body weight history and refreshes the chart.
   */
  loadBodyWeights() {
    this.performanceService.getBodyWeights().subscribe({
      next: (data) => {
        this.bodyWeights = data;
        this.updateWeightChart();
      },
      error: (err) => console.error('Error loading body weights', err)
    });
  }

  /**
   * Fetches the list of available exercises.
   */
  loadExercises() {
    this.performanceService.getExercises().subscribe({
      next: (data) => this.exercises = data,
      error: (err) => console.error('Error loading exercises', err)
    });
  }

  /**
   * Fetches exercise performance records and updates the current exercise chart.
   */
  loadExerciseRecords() {
    this.performanceService.getExerciseRecords().subscribe({
      next: (data) => {
        this.exerciseRecords = data;
        if (this.exercises.length > 0 && !this.selectedExerciseChartId) {
          this.selectedExerciseChartId = this.exercises[0].id;
        }
        this.updateExerciseChart();
      },
      error: (err) => console.error('Error loading exercise records', err)
    });
  }

  loadPerformanceEvents() {
    this.performanceService.getRecentEvents().subscribe({
      next: (events) => {
        this.performanceEvents = events;
      },
      error: (err) => console.error('Error loading performance events', err)
    });
  }

  /**
   * Marks a performance event as acknowledged and removes it from the list.
   */
  acknowledgeEvent(id: string) {
    this.performanceService.acknowledgeEvent(id).subscribe({
      next: () => {
        this.performanceEvents = this.performanceEvents.filter(e => e.id !== id);
      },
      error: (err) => console.error('Error acknowledging event', err)
    });
  }

  /**
   * Adds a new body weight record to the history.
   */
  addBodyWeight() {
    if (this.newBodyWeight.weight <= 0 || !this.newBodyWeight.date) return;

    const payload: { weight: number; date: string; notes?: string } = {
      weight: Number(this.newBodyWeight.weight),
      date: new Date(this.newBodyWeight.date).toISOString()
    };

    if (this.newBodyWeight.notes) {
      payload.notes = this.newBodyWeight.notes;
    }

    this.performanceService.addBodyWeight(payload).subscribe({
      next: () => {
        this.loadBodyWeights();
        this.newBodyWeight = { weight: 0, date: '', notes: '' };
      },
      error: (err) => console.error(err)
    });
  }

  /**
   * Removes a body weight record by its ID.
   * @param id - The unique identifier of the record to delete
   */
  deleteBodyWeight(id: string) {
    this.performanceService.deleteBodyWeight(id).subscribe({
      next: () => this.loadBodyWeights(),
      error: (err) => console.error(err)
    });
  }

  /**
   * Adds a new exercise performance entry.
   */
  addExerciseRecord() {
    if (!this.newExerciseRecord.exerciseId || this.newExerciseRecord.weight <= 0 || this.newExerciseRecord.reps <= 0 || !this.newExerciseRecord.date) return;

    const payload: { exerciseId: string; weight: number; reps: number; date: string; notes?: string } = {
      exerciseId: this.newExerciseRecord.exerciseId,
      weight: Number(this.newExerciseRecord.weight),
      reps: Number(this.newExerciseRecord.reps),
      date: new Date(this.newExerciseRecord.date).toISOString()
    };

    if (this.newExerciseRecord.notes) {
      payload.notes = this.newExerciseRecord.notes;
    }

    this.performanceService.addExerciseRecord(payload).subscribe({
      next: () => {
        this.loadExerciseRecords();
        this.selectedExerciseChartId = this.newExerciseRecord.exerciseId;
        this.newExerciseRecord = { exerciseId: '', weight: 0, reps: 0, date: '', notes: '' };
      },
      error: (err) => console.error(err)
    });
  }

  /**
   * Removes an exercise record by its ID.
   * @param id - The unique identifier of the record to delete
   */
  deleteExerciseRecord(id: string) {
    this.performanceService.deleteExerciseRecord(id).subscribe({
      next: () => this.loadExerciseRecords(),
      error: (err) => console.error(err)
    });
  }

  /**
   * Synchronizes data and labels for the Weight Chart based on current records.
   */
  updateWeightChart() {
    // Sort array by date so the chart draws properly (if not sorted)
    let sorted = [...this.bodyWeights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted = this.filterRecordsByTime(sorted, r => r.date);

    const dates = sorted.map(w => new Date(w.date).toLocaleDateString());
    const weights = sorted.map(w => w.weight);

    const datasets: any[] = [
      { data: weights, label: this.translate.instant('performance.weight.chartLabel'), borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.2)', fill: true, tension: 0.3 }
    ];

    if (this.weightGoal !== null && dates.length > 0) {
       datasets.push({
         data: Array(dates.length).fill(this.weightGoal),
         label: this.translate.instant('performance.weight.chartGoalLabel'),
         borderColor: '#10b981', // green
         borderDash: [5, 5],
         fill: false,
         pointRadius: 0, 
         tension: 0
       });
    }

    this.weightChartData = {
      labels: dates,
      datasets: datasets
    };
  }

  updateWeightGoal(event: any) {
    const val = Number(event.target.value);
    this.weightGoal = val > 0 ? val : null;
    this.updateWeightChart();
  }

  /**
   * Filters and updates the Exercise Chart for the currently selected movement.
   */
  updateExerciseChart() {
    if (!this.selectedExerciseChartId) return;
    let records = this.filteredExerciseRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    records = this.filterRecordsByTime(records, r => r.date);

    const dates = records.map(r => new Date(r.date).toLocaleDateString());
    const onesRM = records.map(r => this.calculate1RM(r.weight, r.reps));
    const exName = this.exercises.find(e => e.id === this.selectedExerciseChartId)?.name || 'Ejercicio';

    const datasets: any[] = [
      { data: onesRM, label: this.translate.instant('performance.exercises.chartLabel', { name: exName }), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3 }
    ];

    if (this.exerciseGoal !== null && dates.length > 0) {
       datasets.push({
         data: Array(dates.length).fill(this.exerciseGoal),
         label: this.translate.instant('performance.exercises.chartGoalLabel'),
         borderColor: '#8b5cf6', // purple
         borderDash: [5, 5],
         fill: false,
         pointRadius: 0, 
         tension: 0
       });
    }

    this.exerciseChartData = {
      labels: dates,
      datasets: datasets
    };
  }

  updateExerciseGoal(event: any) {
    const val = Number(event.target.value);
    this.exerciseGoal = val > 0 ? val : null;
    this.updateExerciseChart();
  }

  /**
   * Handler for the exercise selector dropdown.
   * @param event - The change event from the select element
   */
  onExerciseChartChange(event: any) {
    this.selectedExerciseChartId = event.target.value;
    this.updateExerciseChart();
  }
}
