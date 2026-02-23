import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export enum PriceCategory {
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  IMAGE_EDITING = 'IMAGE_EDITING',
  MODEL_GENERATION_3D = 'MODEL_GENERATION_3D',
  MODEL_OPTIMIZATION = 'MODEL_OPTIMIZATION',
}

export interface ModelPrice {
  id: string;
  key: string;
  category: PriceCategory;
  name: string | null;
  description: string | null;
  credits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useModelPrices() {
  return useQuery<ModelPrice[]>({
    queryKey: ["model-prices"],
    queryFn: async () => {
      const data = await apiFetch<ModelPrice[]>(`/model-price`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

