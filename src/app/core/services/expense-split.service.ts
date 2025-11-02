import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { TransactionService } from './transaction.service';

export interface ExpenseSplitRequest {
  participantEmails: string[];
  totalAmount: number;
  description: string;
  category: string;
}

export interface ExpenseSplitParticipant {
  userId: number;
  userName: string;
  userEmail: string;
  splitAmount: number;
}

export interface ExpenseSplitResponse {
  status: 'success' | 'failure';
  message: string;
  expenseId?: number;
  totalAmount?: number;
  participantCount?: number;
  participants?: ExpenseSplitParticipant[];
  paidBy?: {
    userId: number;
    userName: string;
    userEmail: string;
  };
  remainderHandling?: {
    hasRemainder: boolean;
    remainderAmount: number;
    assignedTo?: string;
  };
  errors?: string[];
}

export interface UserValidationResult {
  email: string;
  isValid: boolean;
  userId?: number;
  userName?: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseSplitService {
  private readonly API_URL = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private transactionService: TransactionService
  ) {}

  /**
   * Main method to split expense among participants
   */
  splitExpense(request: ExpenseSplitRequest): Observable<ExpenseSplitResponse> {
    console.log('Starting expense split process:', request);

    // Validate logged-in user first
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      return throwError(() => ({
        status: 'failure',
        message: 'User not authenticated. Please log in again.',
        errors: ['Authentication required']
      } as ExpenseSplitResponse));
    }

    // Validate input parameters
    const validationError = this.validateInput(request);
    if (validationError) {
      return throwError(() => validationError);
    }

    // Add current user to participants if not already included
    const allEmails = this.ensureCurrentUserIncluded(request.participantEmails, currentUser.email);

    // Step 1: Validate all participants
    return this.validateAllParticipants(allEmails).pipe(
      map(validationResults => {
        // Check for validation errors
        const invalidUsers = validationResults.filter(result => !result.isValid);
        if (invalidUsers.length > 0) {
          throw {
            status: 'failure',
            message: 'Some participants are not registered users.',
            errors: invalidUsers.map(user => `${user.email}: ${user.errorMessage}`)
          } as ExpenseSplitResponse;
        }

        // Calculate split amounts
        const splitCalculation = this.calculateSplitAmounts(request.totalAmount, validationResults.length);
        
        // Create participants array
        const participants: ExpenseSplitParticipant[] = validationResults.map((result, index) => ({
          userId: result.userId!,
          userName: result.userName!,
          userEmail: result.email,
          splitAmount: splitCalculation.amounts[index]
        }));

        return {
          validatedParticipants: participants,
          splitCalculation,
          currentUser
        };
      }),
      // Step 2: Create the expense/transaction
      switchMap(({ validatedParticipants, splitCalculation, currentUser }) => {
        // Create transaction request
        const transactionRequest = {
          description: request.description,
          amount: request.totalAmount,
          category: request.category,
          participants: validatedParticipants
            .filter(p => p.userEmail !== currentUser.email)
            .map(p => ({
              userId: p.userId,
              amount: p.splitAmount
            }))
        };

        return this.transactionService.createTransaction(transactionRequest).pipe(
          map(transaction => ({
            status: 'success',
            message: 'Expense split successfully created!',
            expenseId: transaction.id,
            totalAmount: request.totalAmount,
            participantCount: validatedParticipants.length,
            participants: validatedParticipants,
            paidBy: {
              userId: currentUser.id,
              userName: currentUser.name,
              userEmail: currentUser.email
            },
            remainderHandling: splitCalculation.remainderInfo
          } as ExpenseSplitResponse)),
          catchError(error => {
            console.error('Failed to create transaction:', error);
            return throwError(() => ({
              status: 'failure',
              message: 'Failed to create expense. Please try again.',
              errors: [error.message || 'Transaction creation failed']
            } as ExpenseSplitResponse));
          })
        );
      }),
      catchError(error => {
        console.error('Expense split error:', error);
        if (error.status && error.message) {
          return throwError(() => error);
        }
        return throwError(() => ({
          status: 'failure',
          message: 'An unexpected error occurred during expense splitting.',
          errors: [error.message || 'Unknown error']
        } as ExpenseSplitResponse));
      })
    );
  }

  /**
   * Validate all participants by their email addresses
   */
  private validateAllParticipants(emails: string[]): Observable<UserValidationResult[]> {
    console.log('Validating participants:', emails);

    const validationObservables = emails.map(email => 
      this.validateSingleParticipant(email)
    );

    return forkJoin(validationObservables).pipe(
      tap(results => console.log('Validation results:', results)),
      catchError(error => {
        console.error('Participant validation error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate a single participant by email
   */
  private validateSingleParticipant(email: string): Observable<UserValidationResult> {
    return this.userService.searchUsers(email).pipe(
      map(response => {
        const users = response.users || [];
        const exactMatch = users.find(user => 
          user.email.toLowerCase() === email.toLowerCase()
        );

        if (exactMatch) {
          return {
            email,
            isValid: true,
            userId: exactMatch.id,
            userName: exactMatch.name
          };
        } else {
          return {
            email,
            isValid: false,
            errorMessage: 'User not found or not registered with SplitGroup'
          };
        }
      }),
      catchError(error => {
        console.error(`Failed to validate user ${email}:`, error);
        return throwError(() => ({
          email,
          isValid: false,
          errorMessage: 'Failed to validate user. Please try again.'
        }));
      })
    );
  }

  /**
   * Calculate split amounts for all participants
   */
  private calculateSplitAmounts(totalAmount: number, participantCount: number): {
    amounts: number[];
    remainderInfo: {
      hasRemainder: boolean;
      remainderAmount: number;
      assignedTo?: string;
    };
  } {
    const baseAmount = Math.floor((totalAmount * 100) / participantCount) / 100;
    const remainder = Math.round((totalAmount - (baseAmount * participantCount)) * 100) / 100;
    
    const amounts = new Array(participantCount).fill(baseAmount);
    
    // Distribute remainder to the first participant (usually the payer)
    if (remainder > 0) {
      amounts[0] += remainder;
    }

    console.log('Split calculation:', {
      totalAmount,
      participantCount,
      baseAmount,
      remainder,
      amounts
    });

    return {
      amounts,
      remainderInfo: {
        hasRemainder: remainder > 0,
        remainderAmount: remainder,
        assignedTo: remainder > 0 ? 'First participant (payer)' : undefined
      }
    };
  }

  /**
   * Ensure current user is included in participants list
   */
  private ensureCurrentUserIncluded(participantEmails: string[], currentUserEmail: string): string[] {
    const emails = [...participantEmails];
    const currentUserIncluded = emails.some(email => 
      email.toLowerCase() === currentUserEmail.toLowerCase()
    );

    if (!currentUserIncluded) {
      emails.unshift(currentUserEmail); // Add current user as first participant
    }

    return emails;
  }

  /**
   * Validate input parameters
   */
  private validateInput(request: ExpenseSplitRequest): ExpenseSplitResponse | null {
    const errors: string[] = [];

    if (!request.participantEmails || request.participantEmails.length === 0) {
      errors.push('At least one participant email is required');
    }

    if (!request.totalAmount || request.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (!request.description || request.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!request.category || request.category.trim().length === 0) {
      errors.push('Category is required');
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = request.participantEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      errors.push(`Invalid email format: ${invalidEmails.join(', ')}`);
    }

    if (errors.length > 0) {
      return {
        status: 'failure',
        message: 'Invalid input parameters',
        errors
      };
    }

    return null;
  }

  /**
   * Get expense split history for current user
   */
  getExpenseSplitHistory(): Observable<any[]> {
    return this.transactionService.getUserTransactions().pipe(
      map(response => response.transactions || []),
      catchError(error => {
        console.error('Failed to fetch expense split history:', error);
        return throwError(() => error);
      })
    );
  }
}