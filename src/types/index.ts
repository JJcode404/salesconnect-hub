// User & Auth Types
export type UserRole = 'OWNER' | 'ADMIN' | 'SALES_REP';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  token: string;
}

// Organization Types
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscriptionStatus: SubscriptionStatus;
  messageLimit: number;
  messagesUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationStats {
  totalContacts: number;
  totalCampaigns: number;
  totalMessages: number;
  messagesThisMonth: number;
  activeWhatsAppNumbers: number;
  activeTemplates: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Team Types
export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  joinedAt: string;
}

export interface InvitePayload {
  email: string;
  role: UserRole;
}

// WhatsApp Number Types
export interface WhatsAppNumber {
  id: string;
  phoneNumber: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  messagesSent: number;
  messagesReceived: number;
  lastActiveAt?: string;
  wabaConnected: boolean;
  webhookConfigured: boolean;
  createdAt: string;
}

// WhatsApp Template Types
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateLanguage = 'en' | 'es' | 'pt' | 'fr' | 'de';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  status: 'DRAFT' | 'SENDING' | 'COMPLETED' | 'FAILED';
  totalContacts: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  createdAt: string;
  completedAt?: string;
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessagesSent: number;
  deliveryRate: number;
  readRate: number;
}

export interface SendCampaignPayload {
  templateId: string;
  contactLimit?: number;
  delayMs?: number;
}

// Contact Types
export interface Contact {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tags: string[];
  isSubscribed: boolean;
  lastContactedAt?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
