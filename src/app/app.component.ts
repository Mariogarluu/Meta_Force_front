import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'credentials';
  private themeService = inject(ThemeService);

  constructor(){
  
  }

  ngOnInit() {
    // El servicio de tema se inicializa automáticamente en su constructor
    // pero lo inyectamos aquí para asegurar que se inicialice
  }
}
