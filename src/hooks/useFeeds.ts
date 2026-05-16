import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Feed } from '../types';

export function useFeeds() {
  return useQuery({
    queryKey: ['feeds'],
    queryFn: () => api.feeds.list(),
  });
}

export function useCreateFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => api.feeds.create(url),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}

export function useUpdateFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Feed, 'isFavorite' | 'title'>> }) =>
      api.feeds.update(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}

export function useDeleteFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.feeds.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feeds'] });
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useDiscoverFeed() {
  return useMutation({
    mutationFn: (url: string) => api.feeds.discover(url),
  });
}
