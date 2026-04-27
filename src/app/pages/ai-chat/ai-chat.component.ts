import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AiService, AiGeneratedPlan, ChatSession } from '../../services/ai.service';
import { finalize } from 'rxjs/operators';

/**
 * Internal interface for chat messages in the UI.
 * Maps backend messages to a format suitable for the template.
 */
interface ChatMessage {
  /** Role of the sender ('user' for the human, 'model' for the AI) */
  role: 'user' | 'model';
  /** Text content of the message */
  content: string;
  /** Optional AI-generated workout or nutrition plan attached to the message */
  plan?: AiGeneratedPlan;
}

/**
 * Component for interaction with the MetaForce AI Coach.
 * Powered by Google Gemini, it allows users to generate workout routines and diet plans via natural language.
 * Features include session history, quick prompts, and plan persistence to the user profile.
 */
@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <!-- Template with Premium Dark Mode & Glassmorphism -->
    <div class="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] gap-4 md:p-4 p-2 bg-gradient-to-br from-gray-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/30 text-gray-800 dark:text-gray-200 transition-colors duration-500">
      
      <!-- Sidebar History -->
      <div class="w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 dark:border-gray-700/50 flex flex-col overflow-hidden hidden md:flex transition-all duration-300">
        <div class="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-900 text-white transition-colors duration-300">
          <h3 class="font-bold text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            Tus Sesiones
          </h3>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2 relative scroll-smooth custom-scrollbar">
          <button (click)="startNewChat()" class="w-full text-left p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-800/50 transition-colors shadow-sm mb-4 border border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Chat
          </button>
          
          <div *ngIf="sessions().length === 0" class="text-center text-gray-400 dark:text-gray-500 text-sm mt-4 italic">
            No tienes chats previos
          </div>

          <div *ngFor="let session of sessions()" 
               [ngClass]="currentSessionId() === session.id ? 'bg-indigo-500 dark:bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'"
               class="p-3 rounded-xl text-sm transition-all duration-200 group flex items-center justify-between relative border border-transparent">
               
             <div class="flex-1 cursor-pointer overflow-hidden" (click)="loadSession(session)">
               <div class="font-medium truncate transition-colors" [ngClass]="currentSessionId() === session.id ? 'text-white' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'">
                 {{ session.title || 'Chat del ' + (session.createdAt | date:'shortDate') }}
               </div>
               <div class="text-xs mt-1" [ngClass]="currentSessionId() === session.id ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'">{{ session.createdAt | date:'shortTime' }}</div>
             </div>
             
             <!-- Delete Button on Hover -->
             <button (click)="confirmDeleteSession($event, session)"
                     [ngClass]="currentSessionId() === session.id ? 'text-white hover:bg-indigo-600' : 'text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'"
                     class="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all absolute right-2"
                     title="Borrar Chat">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </button>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-gray-800 overflow-hidden relative transition-colors duration-500">
        
        <!-- Header -->
        <div class="px-3 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 transition-colors">
          <div class="flex items-center gap-2 sm:gap-3">
            <button (click)="goToDashboard()" class="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 focus:outline-none transition-colors border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full flex items-center justify-center shadow-sm" title="Volver al Dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
               <span class="text-xl">🤖</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-white leading-tight">MetaForce Coach</h3>
              <p class="text-xs text-green-500 dark:text-green-400 font-medium flex items-center gap-1">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-300 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500 dark:bg-green-400"></span>
                </span>
                En línea
              </p>
            </div>
          </div>
          <span class="text-[10px] font-bold tracking-wider uppercase text-indigo-400 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 py-1 px-3 rounded-full border border-indigo-100 dark:border-indigo-800/50 hidden sm:block">
            Gemini Powered
          </span>
        </div>

        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar" #scrollContainer>
          
          <!-- Empty State & Quick Prompts -->
          <div *ngIf="messages().length === 0" class="h-full flex flex-col items-center justify-center animate-fade-in-up mt-10">
            <div class="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner text-4xl border border-indigo-100 dark:border-indigo-800/50">
              🏋️‍♂️
            </div>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">¡Hola! Soy tu entrenador de IA</h2>
            <p class="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">Pregúntame sobre rutinas personalizadas, dietas o consejos para mejorar tus ejercicios.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
              <button *ngFor="let prompt of quickPrompts" 
                      (click)="sendQuickPrompt(prompt.text)"
                      class="flex flex-col items-start p-4 bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg dark:hover:shadow-indigo-900/20 transition-all text-left group">
                <span class="text-2xl mb-2 group-hover:scale-110 transition-transform">{{prompt.icon}}</span>
                <span class="font-medium text-gray-700 dark:text-gray-200 text-sm mb-1">{{prompt.title}}</span>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{prompt.desc}}</span>
              </button>
            </div>
          </div>

          <!-- Chat Bubbles -->
          <div *ngFor="let msg of messages()" class="flex w-full animate-fade-in" [ngClass]="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            
            <div class="flex gap-3 max-w-[90%] md:max-w-[75%]" [ngClass]="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
              
              <!-- Avatar -->
              <div class="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm mt-1"
                   [ngClass]="msg.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'">
                <span class="text-sm">{{ msg.role === 'user' ? 'ME' : '🤖' }}</span>
              </div>

              <!-- Message Bubble -->
              <div class="rounded-2xl p-4 shadow-sm relative group text-sm md:text-base border border-transparent"
                   [ngClass]="msg.role === 'user' 
                     ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-tr-none shadow-indigo-500/20' 
                     : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700 rounded-tl-none'">
                
                <p class="whitespace-pre-wrap leading-relaxed" [innerHTML]="formatMessage(msg.content)"></p>

                <!-- Beautiful Plan UI -->
                <div *ngIf="msg.plan" class="mt-4 w-full">
                  <div class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50 text-gray-800 dark:text-gray-200 shadow-inner">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xl">📋</span>
                      <h4 class="font-black text-indigo-900 dark:text-indigo-300 text-lg uppercase tracking-wide">{{ msg.plan.name }}</h4>
                      <span *ngIf="msg.plan.type" class="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
                            [ngClass]="msg.plan.type === 'WORKOUT' ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800/80 dark:text-indigo-200' : 'bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'">
                        {{ msg.plan.type === 'WORKOUT' ? 'ENTRENAMIENTO' : 'DIETA' }}
                      </span>
                    </div>
                    <p class="text-sm text-indigo-600/80 dark:text-indigo-400 mb-4 font-medium">{{ msg.plan.description }}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div *ngFor="let day of msg.plan.days" class="bg-white dark:bg-gray-800/60 rounded-lg p-3 shadow-sm border border-gray-50 dark:border-gray-700/50 hover:shadow-md transition-shadow">
                        <div class="font-bold text-indigo-700 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex justify-between items-center">
                          <span>Día {{ day.dayOfWeek }}</span>
                          <span class="text-xs bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/30">{{ getItems(day).length }} items</span>
                        </div>
                        <ul class="space-y-2">
                          <li *ngFor="let item of getItems(day)" class="text-xs">
                            <div class="font-semibold text-gray-700 dark:text-gray-200">{{ item.name }}</div>
                            <div class="text-gray-500 dark:text-gray-400 flex flex-wrap gap-2 mt-0.5">
                               <span *ngIf="item.sets" class="bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600/50">{{ item.sets }} sets</span>
                               <span *ngIf="item.reps" class="bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600/50">{{ item.reps }} reps</span>
                               <span *ngIf="item.quantity" class="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-800/30">{{ item.quantity }}</span>
                               <span *ngIf="item.notes" class="text-gray-400 dark:text-gray-500 text-[11px] block w-full mt-1">📝 {{ item.notes }}</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <button (click)="savePlan(msg.plan)" [disabled]="isSavingPlan()" class="mt-4 w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 transition-colors font-bold text-sm shadow-md flex items-center justify-center gap-2 border border-transparent">
                      <svg *ngIf="!isSavingPlan()" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span *ngIf="isSavingPlan()" class="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      {{ isSavingPlan() ? 'Guardando...' : 'Guardar en mi Perfil' }}
                    </button>
                    <div *ngIf="saveMessage()" class="mt-2 text-center text-xs font-bold p-2 rounded border"
                         [ngClass]="saveMessage().includes('Error') ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'">
                       {{ saveMessage() }}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div *ngIf="isLoading()" class="flex w-full justify-start animate-fade-in mt-4">
             <div class="flex gap-3 max-w-[75%] flex-row">
                <div class="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm text-white mt-1">
                  <span class="text-sm">🤖</span>
                </div>
                <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                  <span class="sr-only">Pensando...</span>
                  <div class="h-2 w-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                  <div class="h-2 w-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                  <div class="h-2 w-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
             </div>
          </div>
          
        </div>

        <!-- Input Area (Static at Bottom) -->
        <div class="p-4 bg-white/95 dark:bg-gray-900/95 border-t border-gray-100 dark:border-gray-800 mt-auto backdrop-blur-md transition-colors duration-300">
          <div class="relative max-w-4xl mx-auto flex items-end gap-2 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 transition-all">
            <textarea 
              [(ngModel)]="userInput" 
              (keydown.enter)="onEnter($event)"
              placeholder="Pregúntame algo sobre tu entrenamiento..." 
              class="flex-1 max-h-32 min-h-[44px] resize-none outline-none py-2 px-3 text-gray-700 dark:text-gray-200 bg-transparent text-sm md:text-base placeholder-gray-400 dark:placeholder-gray-500"
              [disabled]="isLoading()"
              rows="1"
            ></textarea>
            <button 
              (click)="sendMessage()" 
              [disabled]="!userInput.trim() || isLoading()"
              class="bg-indigo-600 dark:bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-all flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Tailwind App Modal for Delete Confirmation -->
    <div *ngIf="showDeleteModal()" class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-colors duration-300">
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up border border-indigo-50 dark:border-gray-700">
        
        <div class="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mb-6 mx-auto shadow-sm border border-red-100 dark:border-red-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        
        <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-3 tracking-tight">¿Eliminar chat?</h3>
        
        <p class="text-base text-center text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Estás a punto de eliminar <span class="font-semibold text-gray-700 dark:text-gray-200">"{{ sessionToDelete()?.title || 'este chat' }}"</span>. Esta acción no se puede deshacer.
        </p>
        
        <div class="flex gap-4">
          <button (click)="cancelDelete()"
                  class="flex-1 py-3 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-all font-semibold text-sm border border-gray-200 dark:border-gray-600 shadow-sm">
            Cancelar
          </button>
          
          <button (click)="executeDelete()"
                  [disabled]="isDeleting()"
                  class="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 font-semibold text-sm shadow-md shadow-red-500/20 flex items-center justify-center gap-2">
            <span *ngIf="isDeleting()" class="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            {{ isDeleting() ? 'Borrando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  /** Injected AiService for backend communication and Gemini integration */
  private aiService = inject(AiService);
  /** Injected Router to navigate to dashboard */
  private router = inject(Router);
  /** Reference to the chat scroll container for automatic bottom positioning */
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  /** Signal containing the linear history of messages in the current session */
  messages = signal<ChatMessage[]>([]);
  /** Signal containing the list of previous chat sessions for the sidebar */
  sessions = signal<ChatSession[]>([]);
  /** Signal storing the UUID of the active chat session */
  currentSessionId = signal<string | undefined>(undefined);

  /** Current text captured from the user input textarea */
  userInput = '';
  /** Signal reflecting the loading state while waiting for the AI coach's response */
  isLoading = signal(false);
  /** Signal reflecting the loading state during plan persistence operations */
  isSavingPlan = signal(false);
  /** Status message for providing feedback on plan save outcomes */
  saveMessage = signal('');

  /** Signal controlling the visibility of the session deletion confirmation modal */
  showDeleteModal = signal(false);
  /** The specific chat session object selected for potential deletion */
  sessionToDelete = signal<ChatSession | null>(null);
  /** Signal tracking the backend deletion process for a session */
  isDeleting = signal(false);

  /** Pre-defined queries to help users get started with the AI */
  quickPrompts = [
    { icon: '💪', title: 'Rutina de Fuerza', desc: 'Plan de 3 días para hipertrofia', text: 'Hazme una rutina de fuerza de 3 días a la semana para ganar masa muscular.' },
    { icon: '🥗', title: 'Dieta de Definición', desc: 'Déficit calórico suave', text: 'Sugiere ideas de comidas para un déficit calórico enfocado en definición muscular.' },
    { icon: '🏃‍♂️', title: 'Mejorar Cardio', desc: 'Rutina HIIT para quemar grasa', text: 'Dame una rutina HIIT de 20 minutos que pueda hacer en casa sin equipamiento.' },
    { icon: '🤕', title: 'Estiramientos', desc: 'Recuperación activa', text: '¿Qué estiramientos recomiendas después de una sesión pesada de piernas?' }
  ];

  /**
   * Navigates back to the main dashboard.
   */
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Component initialization. Loads recent sessions.
   */
  ngOnInit() {
    this.refreshSessions();
  }

  /**
   * Lifecycle hook triggered after every view check.
   * Ensures the chat follows the latest message.
   */
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  /**
   * Scrolls the messages container to its absolute bottom.
   */
  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  /**
   * Fetches the updated list of chat sessions from the backend.
   */
  refreshSessions() {
    this.aiService.getSessions().subscribe(sessions => {
      this.sessions.set(sessions);
    });
  }

  /**
   * Resets the local state to start a fresh chat conversation.
   */
  startNewChat() {
    this.currentSessionId.set(undefined);
    this.messages.set([]);
  }

  /**
   * Loads a specific existing session and populates the message history.
   * @param session - The chat session entity to load
   */
  loadSession(session: ChatSession) {
    this.currentSessionId.set(session.id);
    const uiMessages: ChatMessage[] = session.messages.map(m => ({
      role: m.role as 'user' | 'model',
      content: m.content
    }));
    this.messages.set(uiMessages);
  }

  /**
   * Triggers a message send with pre-filled prompt text.
   * @param text - The prompt content
   */
  sendQuickPrompt(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  /**
   * Handles Enter key detection in the textarea.
   * @param event - Keyboard event
   */
  onEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  /**
   * Sends the user's input to Gemini and handles the streaming or full response.
   */
  sendMessage() {
    if (!this.userInput.trim() || this.isLoading()) return;

    const userText = this.userInput.trim();
    this.messages.update(msgs => [...msgs, { role: 'user', content: userText }]);
    this.userInput = '';
    this.isLoading.set(true);

    this.aiService.sendMessage(userText, this.currentSessionId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.currentSessionId.set(res.sessionId);

          this.messages.update(msgs => [...msgs, {
            role: 'model',
            content: res.response.message,
            plan: res.response.plan
          }]);

          this.refreshSessions();
        },
        error: (err) => {
          console.error('Error invoking ai-chat function:', err);
          const debugMsg = err?.message ? ` (Debug: ${err.message})` : '';
          this.messages.update(msgs => [...msgs, {
            role: 'model',
            content: `Lo siento, hubo un error de conexión con mi núcleo. Por favor, inténtalo más tarde.${debugMsg}`
          }]);
        }
      });
  }

  /**
   * Saves a generated workout or meal plan to the user's permanent profile.
   * @param plan - The generated plan object
   */
  savePlan(plan: AiGeneratedPlan) {
    this.isSavingPlan.set(true);
    this.saveMessage.set('');

    const sanitizedPlan: AiGeneratedPlan = {
      ...plan,
      days: plan.days.map(d => ({
        ...d,
        dayOfWeek: d.dayOfWeek,
        items: this.getItems(d)
      }))
    };

    this.aiService.savePlan(sanitizedPlan).pipe(
      finalize(() => this.isSavingPlan.set(false))
    ).subscribe({
      next: (res) => {
        this.saveMessage.set(`✅ ¡${plan.type === 'WORKOUT' ? 'Rutina' : 'Dieta'} guardada exitosamente!`);
        setTimeout(() => this.saveMessage.set(''), 4000);
      },
      error: (err) => {
        console.error('Error guardando plan', err);
        this.saveMessage.set('❌ Error al guardar en tu perfil.');
        setTimeout(() => this.saveMessage.set(''), 4000);
      }
    });
  }

  /**
   * Normalizes different naming variants for list items (exercises, meals, etc).
   * @param day - Day schedule object
   * @returns Array of plan items
   */
  getItems(day: any): any[] {
    return day.items || day.exercises || day.meals || [];
  }

  /**
   * Formats raw markdown string to basic safe HTML for UI display.
   * Currently handles bold text.
   * @param text - Raw markdown
   * @returns Formatted HTML string
   */
  formatMessage(text: string): string {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
  }

  /**
   * Trigger for the session deletion modal.
   * @param event - DOM event to stop propagation
   * @param session - Target session to confirm for deletion
   */
  confirmDeleteSession(event: Event, session: ChatSession) {
    event.stopPropagation();
    this.sessionToDelete.set(session);
    this.showDeleteModal.set(true);
  }

  /**
   * Closes the deletion confirmation modal.
   */
  cancelDelete() {
    this.showDeleteModal.set(false);
    this.sessionToDelete.set(null);
  }

  /**
   * Final execution of the session deletion API call.
   */
  executeDelete() {
    const session = this.sessionToDelete();
    if (!session) return;

    this.isDeleting.set(true);
    this.aiService.deleteSession(session.id).pipe(
      finalize(() => this.isDeleting.set(false))
    ).subscribe({
      next: () => {
        if (this.currentSessionId() === session.id) {
          this.startNewChat();
        }
        this.refreshSessions();
        this.cancelDelete();
      },
      error: (err) => {
        console.error('Error deleting session', err);
        this.cancelDelete();
      }
    });
  }
}
