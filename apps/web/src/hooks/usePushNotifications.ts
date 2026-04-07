import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiClient } from '../api/client';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const codes = Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  return new Uint8Array(codes.buffer);
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    // Wait a bit for service worker to be fully ready
    const timer = setTimeout(() => {
      subscribe();
    }, 1000);

    async function subscribe() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.debug('Push notification permission denied');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await apiClient.post('/auth/push-subscription', existing.toJSON());
          console.debug('Push subscription updated');
          return;
        }

        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.warn('VITE_VAPID_PUBLIC_KEY not configured');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        });
        
        await apiClient.post('/auth/push-subscription', subscription.toJSON());
        console.debug('✅ Push subscription created');
      } catch (err: any) {
        // Push notifications are optional - only log in debug mode
        if (err.message?.includes('Registration failed')) {
          console.debug('Push notifications unavailable (requires HTTPS in production)');
        } else {
          console.warn('Push notification setup failed:', err.message);
        }
      }
    }

    return () => clearTimeout(timer);
  }, [isAuthenticated]);
}
