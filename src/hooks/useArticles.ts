import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useArticles(unreadOnly: boolean) {
  return useQuery({
    queryKey: ['articles', { unreadOnly }],
    queryFn: () => api.articles.list({ unreadOnly }),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.articles.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useFetchFeeds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.cron.fetch(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
