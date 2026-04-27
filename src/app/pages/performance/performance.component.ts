import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { PerformanceService, BodyWeightRecord, ExerciseRecord, Exercise } from './performance.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

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

  /** Navigation */
  goToAiChat() {
    this.router.navigate(['/ai-chat']);
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

  setTimeFilter(filter: TimeFilter) {
    this.activeTimeFilter = filter;
    if (this.activeTab === 'body-weight') {
      this.updateWeightChart();
    } else {
      this.updateExerciseChart();
    }
  }

  onTabChange(tab: 'body-weight' | 'exercises') {
    this.activeTab = tab;
    this.activeTimeFilter = 'ALL';
    if (tab === 'body-weight') this.updateWeightChart();
    else this.updateExerciseChart();
  }

  /**
   * Initializes data fetching for body weights, exercises, and records.
   */
  ngOnInit() {
    this.loadBodyWeights();
    this.loadExercises();
    this.loadExerciseRecords();
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
      { data: weights, label: 'Peso Corporal (kg)', borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.2)', fill: true, tension: 0.3 }
    ];

    if (this.weightGoal !== null && dates.length > 0) {
       datasets.push({
         data: Array(dates.length).fill(this.weightGoal),
         label: 'Meta Peso (kg)',
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
      { data: onesRM, label: `1R Max Estimado - ${exName} (kg)`, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3 }
    ];

    if (this.exerciseGoal !== null && dates.length > 0) {
       datasets.push({
         data: Array(dates.length).fill(this.exerciseGoal),
         label: 'Meta 1RM (kg)',
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
