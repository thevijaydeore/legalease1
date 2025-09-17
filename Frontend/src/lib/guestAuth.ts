// Guest Authentication System
// Provides a default profile for users who continue as guests

export interface GuestUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    display_name: string;
  };
  isGuest: true;
}

export const GUEST_USER: GuestUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'guest@legalease.app',
  user_metadata: {
    full_name: 'Guest User',
    display_name: 'Guest'
  },
  isGuest: true
};

export const GUEST_SESSION_KEY = 'legalease_guest_session';

// Guest Session Management
export const guestAuth = {
  // Create a guest session
  signInAsGuest: (): { user: GuestUser; session: any } => {
    const session = {
      access_token: 'guest_token',
      refresh_token: 'guest_refresh',
      expires_in: 3600,
      user: GUEST_USER,
      isGuest: true
    };
    
    // Store in localStorage
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    
    return { user: GUEST_USER, session };
  },

  // Get current guest session
  getGuestSession: (): { user: GuestUser; session: any } | null => {
    try {
      const stored = localStorage.getItem(GUEST_SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        return { user: GUEST_USER, session };
      }
      return null;
    } catch {
      return null;
    }
  },

  // Sign out guest
  signOut: (): void => {
    localStorage.removeItem(GUEST_SESSION_KEY);
  },

  // Check if current session is guest
  isGuestSession: (user: any): boolean => {
    return user?.id === GUEST_USER.id || user?.isGuest === true;
  }
};