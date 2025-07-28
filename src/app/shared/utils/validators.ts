import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  // validators to check if passwords match
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordField);
      const confirmPassword = control.get(confirmPasswordField);

      if (!password || !confirmPassword) {
        return null;
      }

      return password.value !== confirmPassword.value ? { passwordMismatch: true } : null;
    };
  }
  // validator for strong password
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasNumber = /[0-9]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasSpecial = /[#?!@$%^&*-]/.test(value);
      const isValidLength = value.length >= 8;

      const passwordValid = hasNumber && hasUpper && hasLower && hasSpecial && isValidLength;

      return !passwordValid ? { strongPassword: true } : null;
    };
  }

  // validator for email domain
  static emailDomain(domains: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value;

      if (!email) {
        return null;
      }

      const domain = email.substring(email.lastIndexOf('@') + 1);
      return domains.includes(domain) ? null : { emailDomain: true };
    };
  }
}