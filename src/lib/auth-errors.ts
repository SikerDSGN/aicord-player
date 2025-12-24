/**
 * Maps Supabase authentication errors to safe, user-friendly messages
 * to prevent information leakage about users, database structure, etc.
 */
export function getSafeAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Došlo k chybě. Zkuste to znovu.';
  }

  const message = (error as { message?: string }).message?.toLowerCase() || '';

  // Authentication errors - use same message for user enumeration prevention
  if (
    message.includes('invalid login') ||
    message.includes('invalid credentials') ||
    message.includes('email not confirmed') ||
    message.includes('user not found') ||
    message.includes('invalid password')
  ) {
    return 'Nesprávné přihlašovací údaje.';
  }

  // Rate limiting
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Příliš mnoho pokusů. Zkuste to později.';
  }

  // Email already registered
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Účet s tímto emailem již existuje.';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Chyba připojení. Zkontrolujte internet.';
  }

  // Session errors
  if (message.includes('session') || message.includes('token') || message.includes('jwt')) {
    return 'Relace vypršela. Přihlaste se znovu.';
  }

  // Default fallback - never expose raw error
  return 'Došlo k chybě. Zkuste to znovu.';
}

/**
 * Maps general database/API errors to safe user-friendly messages
 */
export function getSafeError(error: unknown, fallback: string = 'Nepodařilo se provést akci.'): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const message = (error as { message?: string }).message?.toLowerCase() || '';

  // RLS policy violations - hide security details
  if (message.includes('row-level security') || message.includes('rls')) {
    return 'Nemáte oprávnění pro tuto akci.';
  }

  // Foreign key violations
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'Nepodařilo se dokončit akci.';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Chyba připojení. Zkontrolujte internet.';
  }

  return fallback;
}
