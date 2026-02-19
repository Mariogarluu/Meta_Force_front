import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AiWorkoutPlan, ChatSession } from '../../services/ai.service';
import { finalize } from 'rxjs/operators';

interface ChatMessage {
  role: 'user' | 'model'; // Updated to match DB/Gemini types 'model' instead of 'ai'
  content: string;
  plan?: AiWorkoutPlan;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-[calc(100vh-100px)] gap-4">
      
      <!-- Sidebar History -->
      <div class="w-64 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden hidden md:flex">
        <div class="p-4 bg-indigo-50 border-b">
          <h3 class="font-bold text-gray-700">Historial</h3>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          <button (click)="startNewChat()" class="w-full text-left p-2 rounded hover:bg-indigo-50 text-indigo-600 font-medium text-sm flex items-center gap-2">
            <span>+</span> Nuevo Chat
          </button>
          
          <div *ngFor="let session of sessions()" 
               (click)="loadSession(session)"
               [class.bg-indigo-100]="currentSessionId() === session.id"
               class="p-3 rounded hover:bg-gray-50 cursor-pointer text-sm truncate border-b border-gray-100">
             {{ session.title || 'Chat del ' + (session.createdAt | date:'shortDate') }}
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-indigo-600 p-4 text-white flex items-center justify-between">
          <h3 class="font-bold text-lg flex items-center gap-2">
            <span>🤖</span> Entrenador IA
          </h3>
          <span class="text-xs bg-indigo-500 py-1 px-2 rounded-full">Gemini Powered</span>
        </div>

        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" #scrollContainer>
          <div *ngIf="messages().length === 0" class="text-center text-gray-400 mt-10">
            <p>¡Hola! Soy tu entrenador personal.</p>
            <p class="text-xs">Pregúntame sobre rutinas, dietas o ejercicios.</p>
          </div>

          <div *ngFor="let msg of messages()" 
               [ngClass]="{'bg-indigo-100 ml-auto': msg.role === 'user', 'bg-white border': msg.role === 'model'}"
               class="max-w-[85%] rounded-lg p-3 shadow-sm text-sm relative group">
            
            <p class="whitespace-pre-wrap">{{ msg.content }}</p>

            <!-- Plan Preview if available -->
            <div *ngIf="msg.plan" class="mt-3 border-t pt-2">
              <h4 class="font-bold text-indigo-700">{{ msg.plan.name }}</h4>
              <p class="text-xs text-gray-500 mb-2">{{ msg.plan.description }}</p>
              <div class="space-y-2">
                <div *ngFor="let day of msg.plan.days" class="bg-gray-50 p-2 rounded text-xs">
                  <strong>Día {{ day.dayOfWeek }}</strong>: {{ day.exercises.length }} ejercicios
                </div>
              </div>
              <button (click)="savePlan(msg.plan)" class="mt-2 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700 transition font-medium text-xs">
                Confirmar y Guardar Rutina
              </button>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div *ngIf="isLoading()" class="flex items-center gap-2 text-gray-400 text-sm p-2">
            <div class="animate-bounce">●</div>
            <div class="animate-bounce delay-100">●</div>
            <div class="animate-bounce delay-200">●</div>
            <span>Escribiendo...</span>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-3 bg-white border-t flex gap-2">
          <input 
            [(ngModel)]="userInput" 
            (keyup.enter)="sendMessage()"
            placeholder="Ej: 'Quiero una rutina de fuerza...'" 
            class="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            [disabled]="isLoading()"
          />
          <button 
            (click)="sendMessage()" 
            [disabled]="!userInput.trim() || isLoading()"
            class="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition w-12 flex items-center justify-center">
            ➤
          </button>
        </div>
      </div>
    </div>
  `
})
export class AiChatComponent implements OnInit {
  private aiService = inject(AiService);

  messages = signal<ChatMessage[]>([]);
  sessions = signal<ChatSession[]>([]);
  currentSessionId = signal<string | undefined>(undefined);

  userInput = '';
  isLoading = signal(false);

  ngOnInit() {
    this.refreshSessions();
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
    // Map DB messages to UI
    const uiMessages: ChatMessage[] = session.messages.map(m => ({
      role: m.role as 'user' | 'model',
      content: m.content
      // Note: Plans aren't fully reconstructed from history JSON yet in this simple version, 
      // but text content is available.
    }));
    this.messages.set(uiMessages);
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userText = this.userInput;
    // Optimistic update
    this.messages.update(msgs => [...msgs, { role: 'user', content: userText }]);
    this.userInput = '';
    this.isLoading.set(true);

    this.aiService.sendMessage(userText, this.currentSessionId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.currentSessionId.set(res.sessionId); // Update session ID if it was new

          this.messages.update(msgs => [...msgs, {
            role: 'model',
            content: res.response.message,
            plan: res.response.plan
          }]);

          // Refresh sessions list to show new chat or update timestamp
          this.refreshSessions();
        },
        error: (err) => {
          this.messages.update(msgs => [...msgs, {
            role: 'model',
            content: 'Lo siento, hubo un error de conexión.'
          }]);
        }
      });
  }

  savePlan(plan: AiWorkoutPlan) {
    alert('Funcionalidad de guardado disponible próximamente. (El plan ya está en el chat).');
  }
}
