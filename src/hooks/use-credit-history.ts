import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // Can be positive (ADD/PURCHASE) or negative (DEDUCT)
  type: "DEDUCT" | "REFUND" | "PURCHASE" | "ADD";
  action: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  sourceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
}

export function useCreditHistory(limit: number = 10, offset: number = 0) {
  return useQuery<{ transactions: CreditTransaction[]; total: number }>({
    queryKey: ["credit-history", limit, offset],
    queryFn: async () => {
      try {
        const data = await apiFetch<CreditHistoryResponse>(
          `/user/credits/history?limit=${limit}&offset=${offset}`
        );
        // Handle response structure
        if (data && typeof data === "object" && "transactions" in data) {
          return {
            transactions: data.transactions,
            total: data.total || 0,
          };
        }
        
        
        return { transactions: [], total: 0 };
      } catch (error) {
        console.error("Error fetching credit history:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}

