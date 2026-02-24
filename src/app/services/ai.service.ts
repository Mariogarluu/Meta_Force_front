import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface AiGeneratedPlan {
    type: "WORKOUT" | "DIET";
    name: string;
    description: string;
    days: {
        dayOfWeek: number;
        items: {
            name: string;
            sets?: number;
            reps?: number;
            quantity?: string;
            notes?: string;
        }[];
    }[];
}

export interface ChatResponse {
    sessionId: string;
    response: {
        message: string;
        plan?: AiGeneratedPlan;
    };
}

export interface ChatSession {
    id: string;
    title: string | null;
    createdAt: string;
    messages: {
        role: string;
        content: string;
        createdAt: string;
    }[];
}

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ai`;

    sendMessage(message: string, sessionId?: string): Observable<ChatResponse> {
        return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, { message, sessionId });
    }

    getSessions(): Observable<ChatSession[]> {
        return this.http.get<ChatSession[]>(`${this.apiUrl}/sessions`);
    }

    savePlan(plan: AiGeneratedPlan): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/save-plan`, { plan });
    }
}
