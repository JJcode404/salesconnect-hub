const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    login: (email: string, password: string) =>
      this.request<{ user: any; organization: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    signup: (data: { email: string; password: string; firstName: string; lastName: string; organizationName: string }) =>
      this.request<{ user: any; organization: any; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => this.request<{ user: any; organization: any }>('/auth/me'),

    logout: () => {
      this.setToken(null);
      return Promise.resolve();
    },

    updateProfile: (data: { firstName?: string; lastName?: string; avatarUrl?: string }) =>
      this.request<{ user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      this.request<{ message: string }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // Organization endpoints
  organization = {
    get: () => this.request<any>('/organization'),
    
    getStats: () => this.request<any>('/organization/stats'),
    
    getActivity: () => this.request<any[]>('/organization/activity'),
    
    update: (data: { name?: string }) =>
      this.request<any>('/organization', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // Team endpoints
  team = {
    list: () => this.request<any[]>('/organization/team'),
    
    invite: (data: { email: string; role: string }) =>
      this.request<any>('/organization/team/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateRole: (memberId: string, role: string) =>
      this.request<any>(`/organization/team/${memberId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    
    remove: (memberId: string) =>
      this.request<void>(`/organization/team/${memberId}`, {
        method: 'DELETE',
      }),
  };

  // WhatsApp Numbers endpoints
  whatsappNumbers = {
    list: () => this.request<any[]>('/organization/whatsapp-numbers'),
    
    getPrimary: () => this.request<any>('/organization/whatsapp-numbers/primary'),
    
    create: (data: { phoneNumber: string; displayName: string; token?: string }) =>
      this.request<any>('/organization/whatsapp-numbers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: { displayName?: string; token?: string }) =>
      this.request<any>(`/organization/whatsapp-numbers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    toggle: (id: string) =>
      this.request<any>(`/organization/whatsapp-numbers/${id}/toggle`, {
        method: 'PUT',
      }),
    
    delete: (id: string) =>
      this.request<void>(`/organization/whatsapp-numbers/${id}`, {
        method: 'DELETE',
      }),
  };

  // WhatsApp Templates endpoints
  templates = {
    list: () => this.request<any[]>('/organization/whatsapp-templates'),
    
    create: (data: { name: string; content: string; category: string; language: string }) =>
      this.request<any>('/organization/whatsapp-templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: { name?: string; content?: string; category?: string; language?: string }) =>
      this.request<any>(`/organization/whatsapp-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    toggle: (id: string) =>
      this.request<any>(`/organization/whatsapp-templates/${id}/toggle`, {
        method: 'PUT',
      }),
    
    delete: (id: string) =>
      this.request<void>(`/organization/whatsapp-templates/${id}`, {
        method: 'DELETE',
      }),
  };

  // Campaign endpoints
  campaigns = {
    send: (data: { templateId: string; contactLimit?: number; delayMs?: number }) =>
      this.request<any>('/campaigns/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getStats: () => this.request<any>('/campaigns/stats'),
    
    list: () => this.request<any[]>('/campaigns'),
  };
}

export const api = new ApiClient();
