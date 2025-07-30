"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export interface MatrixError {
  id: string;
  type: 'data_processing' | 'api_error' | 'validation' | 'network' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface MatrixErrorHandlingState {
  errors: MatrixError[];
  isRetrying: boolean;
  lastError: MatrixError | null;
}

export interface UseMatrixErrorHandlingReturn {
  errors: MatrixError[];
  isRetrying: boolean;
  lastError: MatrixError | null;
  addError: (error: Partial<MatrixError>) => string;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  retryOperation: (errorId: string, operation: () => Promise<void>) => Promise<boolean>;
  canRetry: (errorId: string) => boolean;
  getErrorMessage: (error: any) => string;
  handleApiError: (error: any, context?: string) => string;
}

const generateErrorId = () => `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getErrorType = (error: any): MatrixError['type'] => {
  // Check for specific error codes first
  if (error?.code) {
    switch (error.code) {
      case 'QUOTA_EXCEEDED':
      case 'RATE_LIMIT_EXCEEDED':
      case 'AUTH_ERROR':
      case 'ACCESS_DENIED':
      case 'RECEIPTS_FETCH_ERROR':
      case 'OWNERS_FETCH_ERROR':
      case 'SHEETS_API_ERROR':
      case 'GOOGLE_SHEETS_API_ERROR':
      case 'AUTHENTICATION_ERROR':
      case 'GOOGLE_SHEETS_API':
        return 'api_error';
      case 'VALIDATION_ERROR':
      case 'INVALID_REQUEST':
        return 'validation';
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
        return 'network';
      case 'DATA_PROCESSING_ERROR':
        return 'data_processing';
      default:
        return 'unknown';
    }
  }
  
  // Check error message for patterns
  if (error?.message) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Network and timeout errors
    if (message.includes('network') || 
        message.includes('fetch') || 
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('aborted') ||
        message.includes('failed to fetch')) {
      return 'network';
    }
    
    // Validation errors
    if (message.includes('validation') || 
        message.includes('invalid') || 
        message.includes('malformed') ||
        message.includes('bad request') ||
        message.includes('invalid_request')) {
      return 'validation';
    }
    
    // Google Sheets API errors
    if (message.includes('quota') || 
        message.includes('rate limit') || 
        message.includes('sheets') || 
        message.includes('googleapis') ||
        message.includes('google api') ||
        message.includes('api key') ||
        message.includes('auth') ||
        message.includes('permission') ||
        message.includes('access denied') ||
        stack.includes('googleapi') ||
        message.includes('quota_exceeded') ||
        message.includes('rate_limit_exceeded') ||
        message.includes('auth_error') ||
        message.includes('receipts_fetch_error') ||
        message.includes('owners_fetch_error')) {
      return 'api_error';
    }
    
    // Data processing errors
    if (message.includes('processing') || 
        message.includes('transform') || 
        message.includes('parse') ||
        message.includes('data_processing') ||
        message.includes('failed to process')) {
      return 'data_processing';
    }
  }
  
  return 'unknown';
};

const isRetryable = (error: any): boolean => {
  const errorType = getErrorType(error);
  
  // Network errors are always retryable
  if (errorType === 'network') return true;
  
  // API errors - check specific codes and messages
  if (errorType === 'api_error') {
    // Rate limiting and quota errors are retryable after delay
    if (error?.code === 'QUOTA_EXCEEDED' || 
        error?.code === 'RATE_LIMIT_EXCEEDED' ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('rate limit')) {
      return true;
    }
    
    // Auth and access errors are generally not retryable
    if (error?.code === 'AUTH_ERROR' || 
        error?.code === 'ACCESS_DENIED' ||
        error?.code === 'AUTHENTICATION_ERROR' ||
        error?.message?.toLowerCase().includes('auth') ||
        error?.message?.toLowerCase().includes('permission') ||
        error?.message?.toLowerCase().includes('access denied')) {
      return false;
    }
    
    // Google Sheets API errors are generally retryable
    if (error?.code === 'GOOGLE_SHEETS_API_ERROR' ||
        error?.code === 'RECEIPTS_FETCH_ERROR' ||
        error?.code === 'OWNERS_FETCH_ERROR' ||
        error?.code === 'SHEETS_API_ERROR' ||
        error?.message?.toLowerCase().includes('sheets') ||
        error?.message?.toLowerCase().includes('googleapis')) {
      return true;
    }
    
    // Generic API errors might be retryable
    return true;
  }
  
  // Data processing errors might be retryable (could be transient)
  if (errorType === 'data_processing') return true;
  
  // Validation errors are generally not retryable
  if (errorType === 'validation') return false;
  
  return false;
};

const getMaxRetries = (errorType: MatrixError['type'], error?: any): number => {
  switch (errorType) {
    case 'network':
      return 3; // Network errors can be retried more times
    case 'api_error':
      // Different retry limits based on specific API error
      if (error?.code === 'QUOTA_EXCEEDED' || error?.message?.toLowerCase().includes('quota')) {
        return 1; // Quota errors should be retried less frequently
      }
      if (error?.code === 'RATE_LIMIT_EXCEEDED' || error?.message?.toLowerCase().includes('rate limit')) {
        return 2; // Rate limit errors can be retried a couple times
      }
      if (error?.code === 'AUTH_ERROR' || error?.code === 'ACCESS_DENIED') {
        return 0; // Auth errors should not be retried
      }
      return 2; // Generic API errors
    case 'data_processing':
      return 2; // Data processing errors might be transient
    case 'validation':
      return 0; // Validation errors are not retryable
    default:
      return 1; // Unknown errors get one retry
  }
};

export const useMatrixErrorHandling = (): UseMatrixErrorHandlingReturn => {
  const [state, setState] = useState<MatrixErrorHandlingState>({
    errors: [],
    isRetrying: false,
    lastError: null,
  });
  
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
      retryTimeouts.current.clear();
    };
  }, []);

  const addError = useCallback((errorInput: Partial<MatrixError>): string => {
    const errorId = errorInput.id || generateErrorId();
    const errorType = errorInput.type || getErrorType(errorInput);
    const maxRetries = errorInput.maxRetries || getMaxRetries(errorType, errorInput);
    
    const error: MatrixError = {
      id: errorId,
      type: errorType,
      message: errorInput.message || 'An unknown error occurred',
      details: errorInput.details,
      timestamp: errorInput.timestamp || new Date(),
      retryable: errorInput.retryable !== undefined ? errorInput.retryable : isRetryable(errorInput),
      retryCount: errorInput.retryCount || 0,
      maxRetries,
    };
    
    setState(prev => ({
      ...prev,
      errors: [...prev.errors.filter(e => e.id !== errorId), error],
      lastError: error,
    }));
    
    // Enhanced logging based on error type
    if (errorType === 'api_error') {
      console.error('Matrix API Error Added:', {
        ...error,
        isGoogleSheetsError: error.message.toLowerCase().includes('sheets') || 
                            error.message.toLowerCase().includes('quota') ||
                            error.message.toLowerCase().includes('rate limit'),
        suggestedAction: error.retryable ? 'Retry recommended' : 'Manual intervention required'
      });
    } else {
      console.error('Matrix Error Added:', error);
    }
    
    return errorId;
  }, []);
  
  const removeError = useCallback((errorId: string) => {
    // Clear any pending retry timeout
    const timeout = retryTimeouts.current.get(errorId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(errorId);
    }
    
    setState(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.id !== errorId),
      lastError: prev.lastError?.id === errorId ? null : prev.lastError,
    }));
  }, []);
  
  const clearErrors = useCallback(() => {
    // Clear all retry timeouts
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();
    
    setState({
      errors: [],
      isRetrying: false,
      lastError: null,
    });
  }, []);
  
  const canRetry = useCallback((errorId: string): boolean => {
    const error = state.errors.find(e => e.id === errorId);
    return error ? error.retryable && error.retryCount < error.maxRetries : false;
  }, [state.errors]);
  
  const calculateRetryDelay = useCallback((error: MatrixError): number => {
    const baseDelay = (() => {
      // Base delay based on error type and specific error codes
      if (error.type === 'api_error') {
        if (error.message.toLowerCase().includes('quota')) {
          return 60000; // 1 minute for quota errors
        }
        if (error.message.toLowerCase().includes('rate limit')) {
          return 30000; // 30 seconds for rate limit errors
        }
        if (error.message.toLowerCase().includes('sheets') || 
            error.message.toLowerCase().includes('googleapis')) {
          return 5000; // 5 seconds for general Google Sheets API errors
        }
        return 3000; // 3 seconds for other API errors
      }
      
      if (error.type === 'network') {
        return 2000; // 2 seconds for network errors
      }
      
      if (error.type === 'data_processing') {
        return 1000; // 1 second for data processing errors
      }
      
      return 1000; // Default 1 second
    })();
    
    // Apply exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, error.retryCount);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const maxDelay = error.type === 'api_error' && error.message.toLowerCase().includes('quota') 
      ? 300000 // 5 minutes max for quota errors
      : 60000; // 1 minute max for other errors
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }, []);

  const retryOperation = useCallback(async (
    errorId: string,
    operation: () => Promise<void>
  ): Promise<boolean> => {
    const error = state.errors.find(e => e.id === errorId);
    if (!error || !canRetry(errorId)) {
      console.warn(`Cannot retry operation for error ${errorId}:`, { 
        errorFound: !!error, 
        canRetry: error ? canRetry(errorId) : false,
        retryCount: error?.retryCount,
        maxRetries: error?.maxRetries
      });
      return false;
    }
    
    setState(prev => ({ ...prev, isRetrying: true }));
    
    try {
      // Calculate delay with enhanced logic for Google Sheets API errors
      const delay = calculateRetryDelay(error);
      
      console.log(`Retrying operation for error ${errorId} after ${delay}ms delay (attempt ${error.retryCount + 1}/${error.maxRetries})`);
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      await operation();
      
      // Success - remove the error
      removeError(errorId);
      setState(prev => ({ ...prev, isRetrying: false }));
      
      console.log(`Matrix operation retry successful for error ${errorId} after ${error.retryCount + 1} attempts`);
      return true;
      
    } catch (retryError) {
      console.error(`Matrix operation retry failed for error ${errorId} (attempt ${error.retryCount + 1}):`, retryError);
      
      // Update error with new retry count and additional context
      const updatedError: MatrixError = {
        ...error,
        retryCount: error.retryCount + 1,
        timestamp: new Date(),
        details: { 
          ...error.details, 
          lastRetryError: retryError,
          retryHistory: [
            ...(error.details?.retryHistory || []),
            {
              attempt: error.retryCount + 1,
              timestamp: new Date().toISOString(),
              error: retryError instanceof Error ? retryError.message : String(retryError)
            }
          ]
        },
      };
      
      setState(prev => ({
        ...prev,
        errors: prev.errors.map(e => e.id === errorId ? updatedError : e),
        lastError: prev.lastError?.id === errorId ? updatedError : prev.lastError,
        isRetrying: false,
      }));
      
      return false;
    }
  }, [state.errors, canRetry, removeError, calculateRetryDelay]);
  
  const getErrorMessage = useCallback((error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'An unknown error occurred';
  }, []);
  
  const handleApiError = useCallback((error: any, context?: string): string => {
    let message = getErrorMessage(error);
    let enhancedDetails = { 
      originalError: error, 
      context, 
      timestamp: new Date().toISOString(),
      errorCode: error?.code,
      httpStatus: error?.status,
      isGoogleSheetsError: false,
      suggestedAction: 'Try again later'
    };
    
    // Enhance error messages based on error codes and patterns
    if (error?.code) {
      enhancedDetails.isGoogleSheetsError = true;
      
      switch (error.code) {
        case 'QUOTA_EXCEEDED':
          message = 'Google Sheets API quota has been exceeded. Please wait 1-2 minutes before trying again.';
          enhancedDetails.suggestedAction = 'Wait 1-2 minutes before retrying';
          break;
        case 'RATE_LIMIT_EXCEEDED':
          message = 'Google Sheets API rate limit exceeded. Please wait 30 seconds and try again.';
          enhancedDetails.suggestedAction = 'Wait 30 seconds before retrying';
          break;
        case 'AUTH_ERROR':
        case 'AUTHENTICATION_ERROR':
          message = 'Authentication failed. Please check your Google Sheets access permissions.';
          enhancedDetails.suggestedAction = 'Check API credentials and permissions';
          break;
        case 'ACCESS_DENIED':
          message = 'Access denied to Google Sheets. Please verify your permissions.';
          enhancedDetails.suggestedAction = 'Contact administrator for access';
          break;
        case 'RECEIPTS_FETCH_ERROR':
          message = 'Failed to fetch receipt data from Google Sheets. Please check your connection and try again.';
          enhancedDetails.suggestedAction = 'Check internet connection and retry';
          break;
        case 'OWNERS_FETCH_ERROR':
          message = 'Failed to fetch owner data from Google Sheets. Please check your connection and try again.';
          enhancedDetails.suggestedAction = 'Check internet connection and retry';
          break;
        case 'NETWORK_ERROR':
          message = 'Network error occurred. Please check your internet connection and try again.';
          enhancedDetails.suggestedAction = 'Check internet connection';
          break;
        case 'SHEETS_API_ERROR':
        case 'GOOGLE_SHEETS_API_ERROR':
          message = 'Google Sheets API error occurred. Please try refreshing the data.';
          enhancedDetails.suggestedAction = 'Refresh the page or try again';
          break;
        case 'INVALID_REQUEST':
          message = 'Invalid request to Google Sheets API. Please contact support if this persists.';
          enhancedDetails.suggestedAction = 'Contact support';
          break;
        case 'SHEET_NOT_FOUND':
          message = 'Google Sheet not found. Please check the sheet configuration.';
          enhancedDetails.suggestedAction = 'Verify sheet configuration';
          break;
        case 'TIMEOUT_ERROR':
          message = 'Request timed out. The server may be busy. Please try again.';
          enhancedDetails.suggestedAction = 'Try again in a few moments';
          break;
      }
    } else if (error?.message) {
      // Check message patterns for Google Sheets API errors
      const msg = error.message.toLowerCase();
      if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('sheets') || msg.includes('googleapis')) {
        enhancedDetails.isGoogleSheetsError = true;
        
        if (msg.includes('quota')) {
          message = 'Google Sheets API quota exceeded. Please wait a few minutes and try again.';
          enhancedDetails.suggestedAction = 'Wait 1-2 minutes before retrying';
        } else if (msg.includes('rate limit')) {
          message = 'Google Sheets API rate limit exceeded. Please wait and try again.';
          enhancedDetails.suggestedAction = 'Wait 30 seconds before retrying';
        } else if (msg.includes('timeout')) {
          message = 'Request timed out. Please try again.';
          enhancedDetails.suggestedAction = 'Try again in a few moments';
        }
      }
    }
    
    // Add context to message if provided
    if (context) {
      message = `${context}: ${message}`;
    }
    
    // Log enhanced error information
    console.error('API Error Details:', {
      message,
      code: error?.code,
      originalMessage: error?.message,
      context,
      isGoogleSheetsError: enhancedDetails.isGoogleSheetsError,
      suggestedAction: enhancedDetails.suggestedAction
    });
    
    return addError({
      type: 'api_error',
      message,
      details: enhancedDetails,
    });
  }, [addError, getErrorMessage]);
  
  return {
    errors: state.errors,
    isRetrying: state.isRetrying,
    lastError: state.lastError,
    addError,
    removeError,
    clearErrors,
    retryOperation,
    canRetry,
    getErrorMessage,
    handleApiError,
  };
};