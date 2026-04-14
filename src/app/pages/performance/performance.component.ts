import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { PerformanceService, BodyWeightRecord, ExerciseRecord, Exercise } from './performance.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, NavbarComponent],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  private performanceService = inject(PerformanceService);

  activeTab: 'body-weight' | 'exercises' = 'body-weight';
  
  // Data
  bodyWeights: BodyWeightRecord[] = [];
  exerciseRecords: ExerciseRecord[] = [];
  exercises: Exercise[] = [];
  
  // Forms
  newBodyWeight = { weight: 0, date: '', notes: '' };
  newExerciseRecord = { exerciseId: '', weight: 0, reps: 0, date: '', notes: '' };

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

  // Body Weight Chart
  public weightChartData: ChartConfiguration['data'] = {
    datasets: [{ data: [], label: 'Peso Corporal (kg)', borderColor: '#0891b2', fill: false, tension: 0.1 }],
    labels: []
  };
  public weightChartOptions: ChartConfiguration['options'] = this.commonChartOptions;
  public weightChartType: ChartType = 'line';

  // Exercises Chart
  public selectedExerciseChartId: string = '';
  public exerciseChartData: ChartConfiguration['data'] = {
    datasets: [{ data: [], label: 'Peso Movido (kg)', borderColor: '#2563eb', fill: false, tension: 0.1 }],
    labels: []
  };

  get filteredExerciseRecords() {
    return this.exerciseRecords.filter(r => r.exercise.id === this.selectedExerciseChartId);
  }

  ngOnInit() {
    this.loadBodyWeights();
    this.loadExercises();
    this.loadExerciseRecords();
  }

  loadBodyWeights() {
    this.performanceService.getBodyWeights().subscribe({
      next: (data) => {
        this.bodyWeights = data;
        this.updateWeightChart();
      },
      error: (err) => console.error('Error loading body weights', err)
    });
  }

  loadExercises() {
    this.performanceService.getExercises().subscribe({
      next: (data) => this.exercises = data,
      error: (err) => console.error('Error loading exercises', err)
    });
  }

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

  deleteBodyWeight(id: string) {
    this.performanceService.deleteBodyWeight(id).subscribe({
      next: () => this.loadBodyWeights(),
      error: (err) => console.error(err)
    });
  }

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

  deleteExerciseRecord(id: string) {
    this.performanceService.deleteExerciseRecord(id).subscribe({
      next: () => this.loadExerciseRecords(),
      error: (err) => console.error(err)
    });
  }

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

  onExerciseChartChange(event: any) {
    this.selectedExerciseChartId = event.target.value;
    this.updateExerciseChart();
  }
}
