import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AiWorkoutPlan, ChatSession } from '../../services/ai.service';
import { finalize } from 'rxjs/operators';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  plan?: AiWorkoutPlan;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] gap-4 md:p-4 p-2 bg-gradient-to-br from-gray-50 to-indigo-50/30">
      
      <!-- Sidebar History -->
      <div class="w-72 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 flex flex-col overflow-hidden hidden md:flex transition-all duration-300">
        <div class="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <h3 class="font-bold text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            Tus Sesiones
          </h3>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2 relative">
          <button (click)="startNewChat()" class="w-full text-left p-3 rounded-xl hover:bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center gap-2 border border-indigo-100 transition-colors shadow-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Chat
          </button>
          
          <div *ngIf="sessions().length === 0" class="text-center text-gray-400 text-sm mt-4 italic">
            No tienes chats previos
          </div>

          <div *ngFor="let session of sessions()" 
               (click)="loadSession(session)"
               [class.bg-indigo-500]="currentSessionId() === session.id"
               [class.text-white]="currentSessionId() === session.id"
               [class.hover:bg-gray-50]="currentSessionId() !== session.id"
               class="p-3 rounded-xl cursor-pointer text-sm truncate border border-transparent transition-all duration-200 shadow-sm group">
             <div class="font-medium truncate group-hover:text-indigo-600 transition-colors" [class.text-white]="currentSessionId() === session.id" [class.group-hover:text-white]="currentSessionId() === session.id">
               {{ session.title || 'Chat del ' + (session.createdAt | date:'shortDate') }}
             </div>
             <div class="text-xs opacity-70 mt-1">{{ session.createdAt | date:'shortTime' }}</div>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden relative">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm z-10">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
               <span class="text-xl">🤖</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-800 leading-tight">MetaForce Coach</h3>
              <p class="text-xs text-green-500 font-medium flex items-center gap-1">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                En línea
              </p>
            </div>
          </div>
          <span class="text-[10px] font-bold tracking-wider uppercase text-indigo-400 bg-indigo-50 py-1 px-3 rounded-full border border-indigo-100 hidden sm:block">
            Gemini Powered
          </span>
        </div>

        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth pb-32" #scrollContainer>
          
          <!-- Empty State & Quick Prompts -->
          <div *ngIf="messages().length === 0" class="h-full flex flex-col items-center justify-center animate-fade-in-up mt-10">
            <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-4xl">
              🏋️‍♂️
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2 text-center">¡Hola! Soy tu entrenador de IA</h2>
            <p class="text-gray-500 text-center max-w-md mb-8">Pregúntame sobre rutinas personalizadas, dietas o consejos para mejorar tus ejercicios.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
              <button *ngFor="let prompt of quickPrompts" 
                      (click)="sendQuickPrompt(prompt.text)"
                      class="flex flex-col items-start p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left group">
                <span class="text-2xl mb-2 group-hover:scale-110 transition-transform">{{prompt.icon}}</span>
                <span class="font-medium text-gray-700 text-sm mb-1">{{prompt.title}}</span>
                <span class="text-xs text-gray-400">{{prompt.desc}}</span>
              </button>
            </div>
          </div>

          <!-- Chat Bubbles -->
          <div *ngFor="let msg of messages()" class="flex w-full animate-fade-in" [ngClass]="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            
            <div class="flex gap-3 max-w-[90%] md:max-w-[75%]" [ngClass]="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
              
              <!-- Avatar -->
              <div class="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm mt-1"
                   [ngClass]="msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'">
                <span class="text-sm">{{ msg.role === 'user' ? 'ME' : '🤖' }}</span>
              </div>

              <!-- Message Bubble -->
              <div class="rounded-2xl p-4 shadow-sm relative group text-sm md:text-base"
                   [ngClass]="msg.role === 'user' 
                     ? 'bg-indigo-600 text-white rounded-tr-none' 
                     : 'bg-white border text-gray-700 border-gray-100 rounded-tl-none'">
                
                <p class="whitespace-pre-wrap leading-relaxed" [innerHTML]="formatMessage(msg.content)"></p>

                <!-- Beautiful Plan UI -->
                <div *ngIf="msg.plan" class="mt-4 w-full">
                  <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100 text-gray-800">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xl">📋</span>
                      <h4 class="font-black text-indigo-900 text-lg uppercase tracking-wide">{{ msg.plan.name }}</h4>
                    </div>
                    <p class="text-sm text-indigo-600/80 mb-4 font-medium">{{ msg.plan.description }}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div *ngFor="let day of msg.plan.days" class="bg-white rounded-lg p-3 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                        <div class="font-bold text-indigo-700 border-b pb-2 mb-2 flex justify-between items-center">
                          <span>Día {{ day.dayOfWeek }}</span>
                          <span class="text-xs bg-indigo-100 px-2 py-1 rounded-full text-indigo-600">{{ day.exercises.length }} ej.</span>
                        </div>
                        <ul class="space-y-2">
                          <li *ngFor="let ex of day.exercises" class="text-xs">
                            <div class="font-semibold text-gray-700">{{ ex.exerciseName }}</div>
                            <div class="text-gray-500 flex gap-2 mt-0.5">
                               <span class="bg-gray-100 px-1.5 py-0.5 rounded">{{ ex.sets }} sets</span>
                               <span class="bg-gray-100 px-1.5 py-0.5 rounded">{{ ex.reps }} reps</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <button (click)="savePlan(msg.plan)" class="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Guardar esta Rutina
                    </button>
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
                <div class="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                  <span class="sr-only">Pensando...</span>
                  <div class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                  <div class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                  <div class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
             </div>
          </div>
          
        </div>

        <!-- Input Area (Floating) -->
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-10">
          <div class="relative max-w-4xl mx-auto flex items-end gap-2 bg-white rounded-2xl p-2 shadow-lg border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <textarea 
              [(ngModel)]="userInput" 
              (keydown.enter)="onEnter($event)"
              placeholder="Pregúntame algo sobre tu entrenamiento..." 
              class="flex-1 max-h-32 min-h-[44px] resize-none outline-none py-2 px-3 text-gray-700 bg-transparent text-sm md:text-base"
              [disabled]="isLoading()"
              rows="1"
            ></textarea>
            <button 
              (click)="sendMessage()" 
              [disabled]="!userInput.trim() || isLoading()"
              class="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-300 transition-all flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
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
  private aiService = inject(AiService);
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages = signal<ChatMessage[]>([]);
  sessions = signal<ChatSession[]>([]);
  currentSessionId = signal<string | undefined>(undefined);

  userInput = '';
  isLoading = signal(false);

  quickPrompts = [
    { icon: '💪', title: 'Rutina de Fuerza', desc: 'Plan de 3 días para hipertrofia', text: 'Hazme una rutina de fuerza de 3 días a la semana para ganar masa muscular.' },
    { icon: '🥗', title: 'Dieta de Definición', desc: 'Déficit calórico suave', text: 'Sugiere ideas de comidas para un déficit calórico enfocado en definición muscular.' },
    { icon: '🏃‍♂️', title: 'Mejorar Cardio', desc: 'Rutina HIIT para quemar grasa', text: 'Dame una rutina HIIT de 20 minutos que pueda hacer en casa sin equipamiento.' },
    { icon: '🤕', title: 'Estiramientos', desc: 'Recuperación activa', text: '¿Qué estiramientos recomiendas después de una sesión pesada de piernas?' }
  ];

  ngOnInit() {
    this.refreshSessions();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  refreshSessions() {
    this.aiService.getSessions().subscribe(sessions => {
      this.sessions.set(sessions);
    });
  }

  startNewChat() {
    this.currentSessionId.set(undefined);
    this.messages.set([]);
  }

  loadSession(session: ChatSession) {
    this.currentSessionId.set(session.id);
    const uiMessages: ChatMessage[] = session.messages.map(m => ({
      role: m.role as 'user' | 'model',
      content: m.content
    }));
    this.messages.set(uiMessages);
  }

  sendQuickPrompt(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  onEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

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
          this.messages.update(msgs => [...msgs, {
            role: 'model',
            content: 'Lo siento, hubo un error de conexión con mi núcleo. Por favor, inténtalo más tarde.'
          }]);
        }
      });
  }

  savePlan(plan: AiWorkoutPlan) {
    alert(`✅ Rutina "${plan.name}" lista para guardar en tu perfil.\n\n (La integración con Guardar Rutinas se realizará próximamente).`);
  }

  // Helper to format basic markdown to HTML for better display if needed (e.g., bold text)
  formatMessage(text: string): string {
    if (!text) return '';
    // Format bold markdown (**text** -> <strong>text</strong>)
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
  }
}
