import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api.service';

export default function useApi() {
  const queryClient = useQueryClient();
  return { api, queryClient };
}
