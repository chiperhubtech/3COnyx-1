import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export type ServiceType = "INSURANCE" | "ROADSIDE" | "RENTAL" | "BODY_WORK";
export type ServiceStatus = "NEW" | "IN_PROGRESS" | "FULFILLED";

export interface ServiceRequest {
  id: number;
  memberId: number;
  type: ServiceType;
  status: ServiceStatus;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  memberName?: string;
  memberEmail?: string;
}

export type ServiceInput = Pick<ServiceRequest, "type" | "vehicleYear" | "vehicleMake" | "vehicleModel" | "location" | "description">;

export interface ServiceNotification {
  id: number;
  requestId: number;
  fromStatus: ServiceStatus | null;
  toStatus: ServiceStatus;
  createdAt: string;
  readAt: string | null;
}

export interface ServiceEvent {
  id: number;
  fromStatus: ServiceStatus | null;
  toStatus: ServiceStatus;
  createdAt: string;
  actorId: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function serviceApi<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}/api/services${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || data?.message || `Request failed (${response.status}). Please try again.`);
  return data as T;
}

export function useServiceRequests(admin = false) {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["services", admin ? "admin" : "member", user?.id],
    queryFn: async () => {
      const data = await serviceApi<{ requests: ServiceRequest[] }>(admin ? "/admin/requests" : "/requests", token!);
      return data.requests;
    },
    enabled: !!token && (!admin || user?.role === "Admin"),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useServiceNotifications() {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["services", "notifications", user?.id],
    queryFn: async () => {
      const data = await serviceApi<{ notifications: ServiceNotification[] }>("/notifications", token!);
      return data.notifications;
    },
    enabled: !!token && !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useServiceEvents(requestId: number) {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["services", "events", user?.id, requestId],
    queryFn: async () => {
      const data = await serviceApi<{ events: ServiceEvent[] }>(`/requests/${requestId}/events`, token!);
      return data.events;
    },
    enabled: !!token && !!user && Number.isFinite(requestId),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useMarkServiceNotificationRead() {
  const { token, user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => serviceApi<{ notification: ServiceNotification }>(`/notifications/${id}/read`, token!, { method: "PATCH" }),
    onSuccess: ({ notification }) => {
      client.setQueryData<ServiceNotification[]>(["services", "notifications", user?.id], old => old?.filter(item => item.id !== notification.id));
      client.invalidateQueries({ queryKey: ["services", "notifications", user?.id] });
    },
  });
}

export function useCreateServiceRequest() {
  const { token, user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceInput) => serviceApi<{ request: ServiceRequest }>("/requests", token!, {
      method: "POST",
      body: JSON.stringify(input),
    }),
    onSuccess: ({ request }) => {
      client.setQueryData<ServiceRequest[]>(["services", "member", user?.id], (old) => old ? [request, ...old] : [request]);
      client.invalidateQueries({ queryKey: ["services", "member", user?.id] });
    },
  });
}

export function useUpdateServiceStatus() {
  const { token, user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ServiceStatus }) =>
      serviceApi<{ request: ServiceRequest }>(`/admin/requests/${id}`, token!, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: ({ request }) => {
      client.setQueryData<ServiceRequest[]>(["services", "admin", user?.id], (old) =>
        old?.map((item) => item.id === request.id ? { ...item, ...request } : item));
    },
  });
}