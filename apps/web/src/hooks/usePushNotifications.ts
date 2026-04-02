import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiClient } from '../api/client';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated || !('serviceWorker' in navigator)) return;

    async function subscribe() {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await apiClient.post('/auth/push-subscription', existing.toJSON());
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        ) as unknown as Uint8Array<ArrayBuffer>,
      });
      await apiClient.post('/auth/push-subscription', subscription.toJSON());
    }

    subscribe().catch(console.error);
  }, [isAuthenticated]);
}
