/**
 * Event tracking service for analytics
 * Tracks page views, clicks, conversions, and custom events
 * Sends to both database (user_events) and Meta Pixel
 */

import { getAccessToken } from '@/contexts/AuthContext';
import { apiPath, apiHeaders } from './api';
import { getMetaPixel } from './meta-pixel';

export type EventType = 'page_view' | 'click' | 'conversion' | 'custom';
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

interface EventMetadata {
  [key: string]: unknown;
}

interface TrackEventOptions {
  eventType: EventType;
  eventName: string;
  pagePath: string;
  referrer?: string;
  metadata?: EventMetadata;
  value?: number;
  currency?: string;
}

// Get or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('shyftcut_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('shyftcut_session_id', sessionId);
  }
  return sessionId;
}

// Get UTM parameters from URL
function getUTMParams(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
} {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
  };
}

// Detect device type
function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'unknown';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Get browser name
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'unknown';
}

// Get country (simplified - in production, use IP geolocation service)
function getCountry(): string {
  // This is a placeholder - in production, use a geolocation service
  // or get from server-side tracking
  return 'unknown';
}

/**
 * Track an event
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionId = getSessionId();
    const utmParams = getUTMParams();
    const deviceType = getDeviceType();
    const browser = getBrowser();
    const country = getCountry();
    const referrer = document.referrer || undefined;
    
    // Get user token if available (from localStorage - app uses 'shyftcut_access_token')
    // Since /api/events/track allows anonymous requests, we only send token if valid
    let token: string | null = null;
    try {
      // Try to get token from localStorage (app stores it as 'shyftcut_access_token')
      const storedToken = localStorage.getItem('shyftcut_access_token');
      if (storedToken && storedToken.trim()) {
        // Basic validation - check if token looks valid (JWT format)
        // This prevents sending expired/invalid tokens that would cause 401 errors
        if (storedToken.includes('.') && storedToken.length > 20) {
          token = storedToken;
        }
      }
    } catch {
      // User not logged in, continue with anonymous tracking
    }
    
    // Build headers - Supabase Edge Functions gateway requires Authorization header
    // For anonymous requests, use anon key as Bearer token (gateway requirement)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add Supabase Edge Function headers (required for routing)
    if (typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.includes('supabase.co/functions')) {
      headers['X-Path'] = '/api/events/track';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
      if (anonKey) {
        headers['apikey'] = anonKey;
        // Use anon key as Bearer token for anonymous requests (gateway requirement)
        headers['Authorization'] = token ? `Bearer ${token}` : `Bearer ${anonKey}`;
      } else {
        // Fallback to empty Bearer if anon key not available (shouldn't happen in production)
        headers['Authorization'] = token ? `Bearer ${token}` : 'Bearer';
      }
    } else {
      // For non-Supabase APIs, only include Authorization if token is provided
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Send to database via API (fire and forget - don't block UI)
    fetch(apiPath('/api/events/track'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_type: options.eventType,
        event_name: options.eventName,
        page_path: options.pagePath,
        referrer,
        ...utmParams,
        device_type: deviceType,
        browser,
        country,
        session_id: sessionId,
        metadata: options.metadata || {},
      }),
    }).catch((error) => {
      // Silently fail - don't log to avoid console spam
      // Only log in dev mode for debugging
      if (import.meta.env.DEV) {
        console.warn('[Event Tracking] Failed to track event:', error);
      }
    });
    
    // Send to Meta Pixel
    const fbq = getMetaPixel();
    if (fbq) {
      try {
        switch (options.eventType) {
          case 'page_view':
            fbq('track', 'PageView');
            break;
          case 'conversion':
            if (options.eventName === 'Lead') {
              fbq('track', 'Lead', options.metadata || {});
            } else if (options.eventName === 'CompleteRegistration') {
              fbq('track', 'CompleteRegistration', options.metadata || {});
            } else if (options.eventName === 'Purchase' && options.value) {
              fbq('track', 'Purchase', {
                value: options.value,
                currency: options.currency || 'USD',
                ...options.metadata,
              });
            } else {
              fbq('trackCustom', options.eventName, options.metadata || {});
            }
            break;
          case 'click':
            fbq('trackCustom', options.eventName, options.metadata || {});
            break;
          case 'custom':
            fbq('trackCustom', options.eventName, options.metadata || {});
            break;
        }
      } catch (error) {
        console.warn('[Meta Pixel] Error tracking event:', error);
      }
    }
  } catch (error) {
    console.warn('[Event Tracking] Unexpected error:', error);
  }
}

/**
 * Track a page view
 */
export function trackPageView(path: string): void {
  trackEvent({
    eventType: 'page_view',
    eventName: 'PageView',
    pagePath: path,
    referrer: document.referrer || undefined,
  });
}

/**
 * Track a conversion event
 */
export function trackConversion(
  conversionType: string,
  funnelStage: string,
  value?: number,
  currency?: string,
  metadata?: EventMetadata
): void {
  trackEvent({
    eventType: 'conversion',
    eventName: conversionType,
    pagePath: window.location.pathname,
    metadata: {
      funnel_stage: funnelStage,
      ...metadata,
    },
    value,
    currency,
  });
}

/**
 * Track a click event
 */
export function trackClick(elementName: string, metadata?: EventMetadata): void {
  trackEvent({
    eventType: 'click',
    eventName: `Click_${elementName}`,
    pagePath: window.location.pathname,
    metadata,
  });
}

/**
 * Track a custom event
 */
export function trackCustom(eventName: string, metadata?: EventMetadata): void {
  trackEvent({
    eventType: 'custom',
    eventName,
    pagePath: window.location.pathname,
    metadata,
  });
}
