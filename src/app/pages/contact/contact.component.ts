import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TicketsService } from '../../core/services/tickets.service';
import { CentersService } from '../../core/services/centers.service';
import { ErrorService } from '../../core/services/error.service';
import { ErrorType } from '../../core/models/app-error';
import { Center } from '../../core/models/center';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private centersService = inject(CentersService);
  private errorService = inject(ErrorService);
  private formBuilder = inject(FormBuilder);
  translate = inject(TranslateService);

  centers = signal<Center[]>([]);
  isLoading = signal(false);
  isSuccess = signal(false);
  selectedFiles = signal<File[]>([]);
  fileError = signal<string>('');

  // Formulario reactivo
  contactForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(20)]],
    centerId: ['', [Validators.required]],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]]
  });

  ngOnInit(): void {
    this.loadCenters();
  }

  loadCenters(): void {
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        this.centers.set(data);
      },
      error: (error) => {
        // Solo mostrar error si no es un error de conexión (backend no disponible)
        if (error.status !== 0) {
          console.error('Error al cargar centros:', error);
          this.errorService.handleError(error);
        } else {
          // Backend no disponible - no mostrar error crítico, solo log
          console.warn('Backend no disponible. Asegúrate de que el servidor esté corriendo.');
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileError.set('');
    
    if (input.files) {
      const files = Array.from(input.files);
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      const MAX_FILES = 5;
      
      // Filtrar solo imágenes y PDFs y validar tamaño
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (const file of files) {
        // Validar tipo
        const isValidImage = file.type.startsWith('image/');
        const isValidPdf = file.type === 'application/pdf';
        
        if (!isValidImage && !isValidPdf) {
          invalidFiles.push(`${file.name}: ${this.translate.instant('contact.errors.invalidFileType')}`);
          continue;
        }
        
        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name}: ${this.translate.instant('contact.errors.fileTooLarge')}`);
          continue;
        }
        
        validFiles.push(file);
      }
      
      // Mostrar errores si hay archivos inválidos
      if (invalidFiles.length > 0) {
        this.fileError.set(invalidFiles.join('\n'));
      }
      
      // Limitar a 5 archivos totales
      const currentFiles = this.selectedFiles();
      const totalFiles = [...currentFiles, ...validFiles].slice(0, MAX_FILES);
      this.selectedFiles.set(totalFiles);
      
      // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
      input.value = '';
    }
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);
  }

  getFileName(file: File): string {
    return file.name;
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isPdfFile(file: File): boolean {
    return file.type === 'application/pdf';
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.isSuccess.set(false);
    this.fileError.set('');

    const formValue = this.contactForm.value;
    const data = {
      name: formValue.name!.trim(),
      email: formValue.email!.trim(),
      phone: formValue.phone?.trim() || undefined,
      centerId: formValue.centerId!,
      subject: formValue.subject!.trim(),
      description: formValue.description!.trim()
    };

    this.ticketsService.createTicket(data, this.selectedFiles()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        // Limpiar formulario
        this.resetForm();
        // Ocultar mensaje de éxito después de 5 segundos
        setTimeout(() => this.isSuccess.set(false), 5000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorService.handleError(error);
      }
    });
  }

  resetForm(): void {
    this.contactForm.reset();
    this.selectedFiles.set([]);
    this.fileError.set('');
  }

  getError(control: string): string {
    const formControl = this.contactForm.get(control);
    if (!formControl || !formControl.touched || !formControl.errors) {
      return '';
    }

    if (formControl.errors['required']) {
      return this.translate.instant(`contact.errors.${control}Required`);
    }
    if (control === 'email' && formControl.errors['email']) {
      return this.translate.instant('contact.errors.invalidEmail');
    }
    if (formControl.errors['minlength']) {
      const minLength = formControl.errors['minlength'].requiredLength;
      if (control === 'subject') {
        return this.translate.instant('contact.errors.subjectMinLength', { min: minLength });
      }
      if (control === 'description') {
        return this.translate.instant('contact.errors.descriptionMinLength', { min: minLength });
      }
      if (control === 'name') {
        return this.translate.instant('contact.errors.nameMinLength', { min: minLength });
      }
    }
    if (formControl.errors['maxlength']) {
      return this.translate.instant('contact.errors.fieldTooLong');
    }

    return '';
  }
}
