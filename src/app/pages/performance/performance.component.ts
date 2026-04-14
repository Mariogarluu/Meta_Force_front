import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { PerformanceService, BodyWeightRecord, ExerciseRecord, Exercise } from './performance.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

/**
 * Component for tracking and visualizing user performance metrics.
 * Handles body weight records and exercise-specific performance (1RM tracking).
 * Uses ng2-charts and chart.js for data visualization.
 */
@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, NavbarComponent],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  /** Injected PerformanceService for data persistence */
  private performanceService = inject(PerformanceService);

  /** Currently selected tab in the UI */
  activeTab: 'body-weight' | 'exercises' = 'body-weight';
  
  /** List of body weight records fetched from the backend */
  bodyWeights: BodyWeightRecord[] = [];
  /** List of individual exercise logs/performances */
  exerciseRecords: ExerciseRecord[] = [];
  /** List of available exercises for selection */
  exercises: Exercise[] = [];
  
  /** Form model for adding a new body weight entry */
  newBodyWeight = { weight: 0, date: '', notes: '' };
  /** Form model for adding a new exercise performance record */
  newExerciseRecord = { exerciseId: '', weight: 0, reps: 0, date: '', notes: '' };

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
      legend: { labels: { color: '#9ca3af' } }
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
        if(this.exercises.length > 0 && !this.selectedExerciseChartId) {
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
    if (this.newBodyWeight.weight <= 0) return;
    this.performanceService.addBodyWeight(this.newBodyWeight).subscribe({
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
    if (!this.newExerciseRecord.exerciseId || this.newExerciseRecord.weight <= 0 || this.newExerciseRecord.reps <= 0) return;
    this.performanceService.addExerciseRecord(this.newExerciseRecord).subscribe({
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
    const sorted = [...this.bodyWeights].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = sorted.map(w => new Date(w.date).toLocaleDateString());
    const weights = sorted.map(w => w.weight);
    this.weightChartData = {
      labels: dates,
      datasets: [{ data: weights, label: 'Peso Corporal (kg)', borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.2)', fill: true, tension: 0.3 }]
    };
  }

  /**
   * Filters and updates the Exercise Chart for the currently selected movement.
   */
  updateExerciseChart() {
    if (!this.selectedExerciseChartId) return;
    const records = this.filteredExerciseRecords.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = records.map(r => new Date(r.date).toLocaleDateString());
    const weights = records.map(r => r.weight);
    const exName = this.exercises.find(e => e.id === this.selectedExerciseChartId)?.name || 'Ejercicio';
    
    this.exerciseChartData = {
      labels: dates,
      datasets: [{ data: weights, label: `Peso Max - ${exName} (kg)`, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3 }]
    };
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
