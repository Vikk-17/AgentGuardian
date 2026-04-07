import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useConnections() {
  const queryClient = useQueryClient();

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const res = await apiClient.get('/connections');
      return res.data;
    },
  });

  if (error) {
    console.error('useConnections error:', error);
  }

  const connectService = useMutation({
    mutationFn: async (service: string) => {
      const res = await apiClient.get(`/connections/${service}/authorize`);
      return res.data.authUrl;
    },
    onSuccess: (authUrl: string) => {
      window.location.href = authUrl; // Redirect to OAuth
    },
  });

  const revokeService = useMutation({
    mutationFn: async (service: string) => {
      await apiClient.delete(`/connections/${service}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  return { connections: connections || [], isLoading, connectService, revokeService };
}
