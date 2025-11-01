import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiLoggerService {
  
  logRequest(method: string, url: string, data?: any): void {
    if (environment.enableLogging) {
      console.group(`🚀 API Request: ${method} ${url}`);
      console.log('Timestamp:', new Date().toISOString());
      if (data) {
        console.log('Request Data:', data);
      }
      console.groupEnd();
    }
  }

  logResponse(method: string, url: string, response: any, duration?: number): void {
    if (environment.enableLogging) {
      console.group(`✅ API Response: ${method} ${url}`);
      console.log('Timestamp:', new Date().toISOString());
      if (duration) {
        console.log('Duration:', `${duration}ms`);
      }
      console.log('Response:', response);
      console.groupEnd();
    }
  }

  logError(method: string, url: string, error: any, duration?: number): void {
    if (environment.enableLogging) {
      console.group(`❌ API Error: ${method} ${url}`);
      console.log('Timestamp:', new Date().toISOString());
      if (duration) {
        console.log('Duration:', `${duration}ms`);
      }
      console.log('Status:', error.status);
      console.log('Status Text:', error.statusText);
      console.log('Error Message:', error.message);
      console.log('Full Error:', error);
      console.groupEnd();
    }
  }

  logUserAction(action: string, details?: any): void {
    if (environment.enableLogging) {
      console.log(`👤 User Action: ${action}`, details || '');
    }
  }
}