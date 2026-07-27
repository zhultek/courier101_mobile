import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, toFormData } from './client';
import { useAuth } from '../store/auth';
import type {
  AuthorizedUser,
  CalculateResult,
  CourierInfo,
  DashboardData,
  Delivery,
  DeliveryLocation,
  DutyCategory,
  Invoice,
  Item,
  Prealert,
  Rate,
  ShippingAddress,
  ShopForMe,
  TrackData,
  User,
  UserSettings,
} from './types';
import { notify } from '../utils/dialogs';

// ---- Courier / auth ----

export function useCourierLookup() {
  const setCourier = useAuth((s) => s.setCourier);
  return useMutation({
    mutationFn: (code: string) =>
      api<{ status: string; data: CourierInfo }>('/courier/code', {
        method: 'POST',
        body: { code },
        auth: false,
      }),
    onSuccess: (res) => setCourier(res.data),
  });
}

export function useLogin() {
  const { courier, signIn } = useAuth.getState();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<{ token: string; user: User }>('/login', {
        method: 'POST',
        body: { ...input, courier_code: courier?.code },
        auth: false,
      }),
    onSuccess: (res) => signIn(res.token, res.user),
  });
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  street_address?: string;
  city?: string;
  parish?: string;
  trn?: string;
  password: string;
  password_confirmation: string;
}

export function useRegister() {
  const { courier, signIn } = useAuth.getState();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<{ token: string; user: User }>('/register', {
        method: 'POST',
        body: toFormData({ ...input, courier_code: courier?.code }),
        auth: false,
      }),
    onSuccess: (res) => {
      if (res.token && res.user) signIn(res.token, res.user);
    },
  });
}

export function useForgotPassword() {
  const courier = useAuth((s) => s.courier);
  return useMutation({
    mutationFn: (email: string) =>
      api<{ message: string }>('/forgot-password', {
        method: 'POST',
        body: { email, courier_code: courier?.code },
        auth: false,
      }),
  });
}

export function useLogout() {
  const signOut = useAuth((s) => s.signOut);
  return useMutation({
    mutationFn: () => api('/logout', { method: 'POST' }).catch(() => null),
    onSettled: () => signOut(),
  });
}

// ---- Data ----

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardData>('/dashboard'),
  });
}

export function useTrack() {
  return useQuery({
    queryKey: ['track'],
    queryFn: () => api<TrackData>('/track'),
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const res = await api<{ item?: Item; data?: Item }>(`/item/${id}`);
      return { data: res.item ?? res.data };
    },
  });
}

export function useInvoice(id: number | null) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api<{ data?: Invoice; invoice?: Invoice }>(`/invoice/${id}`);
      return { data: res.data ?? res.invoice };
    },
    enabled: id != null,
  });
}

export function usePrealerts() {
  return useQuery({
    queryKey: ['prealerts'],
    queryFn: async () => {
      const res = await api<{ prealerts: Prealert[] }>('/prealert');
      return { data: res.prealerts ?? [] };
    },
  });
}

export function useCreatePrealert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      api('/prealert/store', { method: 'POST', body: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prealerts'] });
      qc.invalidateQueries({ queryKey: ['item'] });
    },
  });
}

export function useDeliveries() {
  return useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const res = await api<{ deliveries: Delivery[] }>('/delivery');
      return { data: res.deliveries ?? [] };
    },
  });
}

export function useDelivery(id: number) {
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: async () => {
      const res = await api<{ delivery?: Delivery; data?: Delivery }>(`/delivery/${id}`);
      return { data: res.delivery ?? res.data };
    },
  });
}

export function useDeliveryLocations() {
  return useQuery({
    queryKey: ['delivery-locations'],
    queryFn: async () => {
      const res = await api<{ delivery_locations: DeliveryLocation[] }>(
        '/delivery-locations'
      );
      // The API prepends a placeholder "Select Delivery Location" row with id 0.
      return { data: (res.delivery_locations ?? []).filter((l) => l.id !== 0) };
    },
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      api('/delivery/store', { method: 'POST', body: form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries'] }),
  });
}

export function useDeleteDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/delivery/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries'] }),
  });
}

export function useShopForMe() {
  return useQuery({
    queryKey: ['shopforme'],
    queryFn: async () => {
      const res = await api<{ shopformes: ShopForMe[] }>('/shopforme');
      return { data: res.shopformes ?? [] };
    },
  });
}

export function useCreateShopForMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      api('/shopforme/store', { method: 'POST', body: form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopforme'] }),
  });
}

export function useShippingAddresses() {
  return useQuery({
    queryKey: ['shipping-address'],
    queryFn: async () => {
      const res = await api<{ shipping_addresses: ShippingAddress[] }>(
        '/shipping-address'
      );
      return { data: res.shipping_addresses ?? [] };
    },
  });
}

export function useRates() {
  return useQuery({
    queryKey: ['rates'],
    queryFn: async () => {
      const res = await api<{ rates: Rate[] }>('/rate');
      return { data: res.rates ?? [] };
    },
  });
}

// ---- Profile ----

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api<{ profile: User }>('/profile');
      // Keep the stored user fresh so courier-level flags (delivery_enabled)
      // picked up here propagate without a re-login.
      useAuth.getState().setUser(res.profile);
      return { data: res.profile };
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuth((s) => s.setUser);
  return useMutation({
    mutationFn: (fields: Record<string, string>) =>
      api<{ data?: User; user?: User }>('/profile', {
        method: 'POST',
        body: toFormData(fields),
      }),
    onSuccess: (res) => {
      const user = res.data ?? res.user;
      if (user) setUser(user);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (fields: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => api('/password-update', { method: 'POST', body: toFormData(fields) }),
  });
}

export function useDeleteAccount() {
  const signOut = useAuth((s) => s.signOut);
  return useMutation({
    mutationFn: () => api('/user/account/delete', { method: 'DELETE' }),
    onSuccess: () => signOut(),
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();

  // The switches read from both the profile query and the persisted auth user,
  // so keep the two in sync when patching settings.
  const applySettings = (settings: Partial<UserSettings>) => {
    const { user, setUser } = useAuth.getState();
    if (user) {
      setUser({ ...user, settings: { ...user.settings, ...settings } });
    }
    qc.setQueryData<{ data: User }>(['profile'], (prev) =>
      prev
        ? { data: { ...prev.data, settings: { ...prev.data.settings, ...settings } } }
        : prev
    );
  };

  return useMutation({
    // The API expects a numeric `status` field (1 = on, 0 = off).
    mutationFn: (input: { setting: string; value: boolean }) =>
      api<{ settings?: Partial<UserSettings> }>(`/setting/${input.setting}`, {
        method: 'POST',
        body: toFormData({ status: input.value ? '1' : '0' }),
      }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['profile'] });
      const prevUser = useAuth.getState().user;
      const prevProfile = qc.getQueryData<{ data: User }>(['profile']);
      const key = input.setting.replace(/-/g, '_') as keyof UserSettings;
      applySettings({ [key]: input.value });
      return { prevUser, prevProfile };
    },
    onSuccess: (res) => {
      if (res.settings) applySettings(res.settings);
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prevUser) useAuth.getState().setUser(ctx.prevUser);
      qc.setQueryData(['profile'], ctx?.prevProfile);
      notify('Update failed', 'Could not save your notification setting. Please try again.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

// ---- Calculator ----

export function useDutyCategories() {
  return useQuery({
    queryKey: ['duty-categories'],
    queryFn: async () => {
      const res = await api<{ duty_categories: DutyCategory[] }>('/duty/categories');
      return { data: res.duty_categories ?? [] };
    },
  });
}

export function useCalculate() {
  return useMutation({
    mutationFn: (fields: { weight: string; duty_id: string; value: string }) =>
      api<CalculateResult>('/calculate', { method: 'POST', body: toFormData(fields) }),
  });
}

// ---- Authorized users ----

export function useAuthorizedUsers() {
  return useQuery({
    queryKey: ['authorized-users'],
    queryFn: async () => {
      const res = await api<{ authorize_users: AuthorizedUser[] }>('/authorize');
      return { data: res.authorize_users ?? [] };
    },
  });
}

export function useAuthorizedUserTypes() {
  return useQuery({
    queryKey: ['authorized-user-types'],
    queryFn: async () => {
      const res = await api<Record<string, string>>('/authorize/user/types');
      return Object.entries(res).map(([id, name]) => ({ id, name }));
    },
  });
}

export function useCreateAuthorizedUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: {
      first_name: string;
      last_name: string;
      id_type: string;
      id_number: string;
    }) => api('/authorize/store', { method: 'POST', body: toFormData(fields) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['authorized-users'] }),
  });
}

export function useDeleteAuthorizedUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/authorize/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['authorized-users'] }),
  });
}
