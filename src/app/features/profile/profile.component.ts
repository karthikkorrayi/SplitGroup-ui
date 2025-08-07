import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../shared/models/auth.model';
import { UserProfile } from '../../shared/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading profile...</p>
      </div>

      <!-- Profile Form -->
      <div *ngIf="!loading" class="profile-content">
        <mat-card class="profile-card">
          <mat-card-header>
            <div class="profile-avatar">
              {{ getUserInitials() }}
            </div>
            <mat-card-title>Personal Information</mat-card-title>
            <mat-card-subtitle>Update your basic profile details</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="profile-form">
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Full Name</mat-label>
                  <input matInput formControlName="name" placeholder="Enter your full name">
                  <mat-icon matSuffix>person</mat-icon>
                  <mat-error *ngIf="profileForm.get('name')?.touched && profileForm.get('name')?.invalid">
                    Name is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email Address</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="Enter your email">
                  <mat-icon matSuffix>email</mat-icon>
                  <mat-error *ngIf="profileForm.get('email')?.touched && profileForm.get('email')?.invalid">
                    Please enter a valid email address
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Phone Number</mat-label>
                  <input matInput type="tel" formControlName="phone" placeholder="Enter your phone number">
                  <mat-icon matSuffix>phone</mat-icon>
                </mat-form-field>
              </div>

              <mat-card-actions class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="profileForm.invalid || saving">
                  <mat-spinner *ngIf="saving" diameter="20" class="inline-spinner"></mat-spinner>
                  <span *ngIf="!saving">Save Changes</span>
                  <span *ngIf="saving">Saving...</span>
                </button>
                <button mat-button type="button" (click)="onResetForm()">Reset</button>
              </mat-card-actions>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Preferences Card -->
        <mat-card class="preferences-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>settings</mat-icon>
              Preferences
            </mat-card-title>
            <mat-card-subtitle>Customize your app experience</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="preferencesForm" (ngSubmit)="onSavePreferences()" class="preferences-form">
              <div class="preference-item">
                <mat-form-field appearance="outline">
                  <mat-label>Default Currency</mat-label>
                  <mat-select formControlName="currency">
                    <mat-option value="USD">USD ($)</mat-option>
                    <mat-option value="EUR">EUR (€)</mat-option>
                    <mat-option value="GBP">GBP (£)</mat-option>
                    <mat-option value="INR">INR (₹)</mat-option>
                    <mat-option value="CAD">CAD (C$)</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="preference-item">
                <mat-slide-toggle formControlName="notifications" color="primary">
                  <span class="toggle-label">Email Notifications</span>
                  <small>Receive email updates about expenses and settlements</small>
                </mat-slide-toggle>
              </div>

              <div class="preference-item">
                <mat-form-field appearance="outline">
                  <mat-label>Theme</mat-label>
                  <mat-select formControlName="theme">
                    <mat-option value="light">Light</mat-option>
                    <mat-option value="dark">Dark</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-card-actions class="form-actions">
                <button mat-raised-button color="accent" type="submit" [disabled]="preferencesForm.invalid || savingPreferences">
                  <mat-spinner *ngIf="savingPreferences" diameter="20" class="inline-spinner"></mat-spinner>
                  <span *ngIf="!savingPreferences">Save Preferences</span>
                  <span *ngIf="savingPreferences">Saving...</span>
                </button>
              </mat-card-actions>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .profile-header {
      margin-bottom: 2rem;
      text-align: center;

      h1 {
        font-size: 2rem;
        font-weight: 600;
        color: #333;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 1rem;

      p {
        color: #666;
        font-size: 1rem;
      }
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .profile-card, .preferences-card {
      mat-card-header {
        display: flex;
        align-items: center;
        gap: 1rem;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }
      }
    }

    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.5rem;
      border: 3px solid rgba(255, 255, 255, 0.2);
    }

    .profile-form, .preferences-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;

      @media (max-width: 768px) {
        justify-content: stretch;

        button {
          flex: 1;
        }
      }
    }

    .inline-spinner {
      margin-right: 8px;
    }

    .preference-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .toggle-label {
        font-weight: 500;
        color: #333;
      }

      small {
        color: #666;
        font-size: 0.85rem;
      }
    }

    .preferences-form {
      .preference-item:last-child {
        margin-bottom: 0;
      }
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: 0.5rem;
      }

      .profile-header h1 {
        font-size: 1.5rem;
      }

      .profile-card, .preferences-card {
        mat-card-header {
          flex-direction: column;
          text-align: center;
          gap: 0.5rem;
        }
      }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  currentUser$: Observable<User | null>;
  loading = true;
  saving = false;
  savingPreferences = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.currentUser$ = this.authService.currentUser$;

    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.preferencesForm = this.formBuilder.group({
      currency: ['USD', Validators.required],
      notifications: [true],
      theme: ['light', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserProfile(): void {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      this.loading = false;
      return;
    }

    this.userService.getUserProfile(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: UserProfile) => {
          this.populateForm(profile);
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load profile:', error);
          // Fallback to current user data
          this.populateFormFromCurrentUser(currentUser);
          this.loading = false;
        }
      });
  }

  private populateForm(profile: UserProfile): void {
    this.profileForm.patchValue({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || ''
    });

    if (profile.preferences) {
      this.preferencesForm.patchValue({
        currency: profile.preferences.currency || 'USD',
        notifications: profile.preferences.notifications ?? true,
        theme: profile.preferences.theme || 'light'
      });
    }
  }

  private populateFormFromCurrentUser(user: User): void {
    this.profileForm.patchValue({
      name: user.name,
      email: user.email,
      phone: ''
    });
  }

  onSaveProfile(): void {
    if (this.profileForm.valid) {
      const currentUser = this.authService.getCurrentUserValue();
      if (!currentUser) return;

      this.saving = true;
      const profileData = this.profileForm.value;

      this.userService.updateUserProfile(currentUser.id, profileData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProfile: UserProfile) => {
            this.saving = false;
            this.showMessage('Profile updated successfully!', 'success-snackbar');
            
            // Update current user in auth service if name or email changed
            if (profileData.name !== currentUser.name || profileData.email !== currentUser.email) {
              this.authService.getCurrentUser().subscribe();
            }
          },
          error: (error: HttpErrorResponse) => {
            this.saving = false;
            console.error('Failed to update profile:', error);
            this.showMessage('Failed to update profile. Please try again.', 'error-snackbar');
          }
        });
    }
  }

  onSavePreferences(): void {
    if (this.preferencesForm.valid) {
      const currentUser = this.authService.getCurrentUserValue();
      if (!currentUser) return;

      this.savingPreferences = true;
      const preferencesData = {
        preferences: this.preferencesForm.value
      };

      this.userService.updateUserProfile(currentUser.id, preferencesData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.savingPreferences = false;
            this.showMessage('Preferences saved successfully!', 'success-snackbar');
          },
          error: (error) => {
            this.savingPreferences = false;
            console.error('Failed to save preferences:', error);
            this.showMessage('Failed to save preferences. Please try again.', 'error-snackbar');
          }
        });
    }
  }

  onResetForm(): void {
    this.loadUserProfile();
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUserValue();
    if (!user?.name) return 'U';
    
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  private showMessage(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}