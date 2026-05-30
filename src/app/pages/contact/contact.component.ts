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

/**
 * Component for the contact and support page.
 * Allows users to submit support tickets with attachments, categorized by center.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  /** Injected TicketsService for ticket submission */
  private ticketsService = inject(TicketsService);
  /** Injected CentersService for fetching available gyms */
  private centersService = inject(CentersService);
  /** Injected ErrorService for centralized error handling */
  private errorService = inject(ErrorService);
  /** Injected FormBuilder for reactive form construction */
  private formBuilder = inject(FormBuilder);
  /** Injected TranslateService for UI internationalization */
  translate = inject(TranslateService);

  /** Signal containing the list of available gym centers */
  centers = signal<Center[]>([]);
  /** Signal tracking background API activity during submission */
  isLoading = signal(false);
  /** Signal indicating a successful ticket submission */
  isSuccess = signal(false);
  /** Signal storing the collection of files attached to the message */
  selectedFiles = signal<File[]>([]);
  /** Signal for displaying file validation errors */
  fileError = signal<string>('');

  /** 
   * Reactive form group for contact details and message content.
   * Includes validation for name, email (with format check), center, subject, and description.
   */
  contactForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(20)]],
    centerId: ['', [Validators.required]],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]]
  });

  /**
   * Component initialization. Fetches the list of centers for the dropdown.
   */
  ngOnInit(): void {
    this.loadCenters();
  }

  /**
   * Fetches the list of gym centers from the backend.
   */
  loadCenters(): void {
    this.centersService.listCentersWithIds().subscribe({
      next: (data) => {
        this.centers.set(data);
      },
      error: (error) => {
        console.error('Error al cargar centros:', error);
        this.errorService.handleError(error);
      }
    });
  }

  /**
   * Handles file selection from the native input.
   * Performs validation on file type (image/pdf) and size (2MB limit).
   * @param event - The input change event
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileError.set('');
    
    if (input.files) {
      const files = Array.from(input.files);
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      const MAX_FILES = 5;
      
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (const file of files) {
        // Validate type
        const isValidImage = file.type.startsWith('image/');
        const isValidPdf = file.type === 'application/pdf';
        
        if (!isValidImage && !isValidPdf) {
          invalidFiles.push(`${file.name}: ${this.translate.instant('contact.errors.invalidFileType')}`);
          continue;
        }
        
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name}: ${this.translate.instant('contact.errors.fileTooLarge')}`);
          continue;
        }
        
        validFiles.push(file);
      }
      
      if (invalidFiles.length > 0) {
        this.fileError.set(invalidFiles.join('\n'));
      }
      
      // Limit to 5 total files
      const currentFiles = this.selectedFiles();
      const totalFiles = [...currentFiles, ...validFiles].slice(0, MAX_FILES);
      this.selectedFiles.set(totalFiles);
      
      input.value = '';
    }
  }

  /**
   * Removes a file from the selected files collection.
   * @param index - Index of the file to remove
   */
  removeFile(index: number): void {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);
  }

  /**
   * Utility to get the filename from a File object.
   * @param file - The file entity
   * @returns Filename string
   */
  getFileName(file: File): string {
    return file.name;
  }

  /**
   * Type check for image files.
   * @param file - File to check
   * @returns True if mime-type starts with 'image/'
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Type check for PDF files.
   * @param file - File to check
   * @returns True if mime-type is 'application/pdf'
   */
  isPdfFile(file: File): boolean {
    return file.type === 'application/pdf';
  }

  /**
   * Submits the contact form to create a new support ticket.
   * Includes file attachments in the multipart request.
   */
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
        this.resetForm();
        // Hide success message after 5 seconds
        setTimeout(() => this.isSuccess.set(false), 5000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorService.handleError(error);
      }
    });
  }

  /**
   * Resets the form and clears all selected files and errors.
   */
  resetForm(): void {
    this.contactForm.reset();
    this.selectedFiles.set([]);
    this.fileError.set('');
  }

  /**
   * Maps a form control validation error to a translated error message.
   * @param control - Name of the form control attribute
   * @returns Translated error message or empty string
   */
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
