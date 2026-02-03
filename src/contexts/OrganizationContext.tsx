import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { OrganizationStats, ActivityLog, TeamMember, WhatsAppNumber, WhatsAppTemplate, Campaign, CampaignStats } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  stats: OrganizationStats | null;
  activity: ActivityLog[];
  team: TeamMember[];
  whatsappNumbers: WhatsAppNumber[];
  templates: WhatsAppTemplate[];
  campaigns: Campaign[];
  campaignStats: CampaignStats | null;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  refreshTeam: () => Promise<void>;
  refreshWhatsAppNumbers: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshCampaigns: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Mock data for demo
const mockStats: OrganizationStats = {
  totalContacts: 2847,
  totalCampaigns: 24,
  totalMessages: 15420,
  messagesThisMonth: 3247,
  activeWhatsAppNumbers: 3,
  activeTemplates: 8,
};

const mockActivity: ActivityLog[] = [
  { id: '1', action: 'CAMPAIGN_SENT', description: 'Campaign "Holiday Promo" sent to 500 contacts', userId: '1', userName: 'Alex Johnson', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '2', action: 'TEMPLATE_CREATED', description: 'New template "Welcome Message" created', userId: '2', userName: 'Sarah Chen', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '3', action: 'MEMBER_INVITED', description: 'Invited mike@company.com as Sales Rep', userId: '1', userName: 'Alex Johnson', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: '4', action: 'NUMBER_ADDED', description: 'New WhatsApp number +1 555 0123 added', userId: '1', userName: 'Alex Johnson', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '5', action: 'CAMPAIGN_COMPLETED', description: 'Campaign "Product Launch" completed with 92% delivery rate', userId: '2', userName: 'Sarah Chen', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

const mockTeam: TeamMember[] = [
  { id: '1', userId: '1', email: 'alex@salesconnect.io', firstName: 'Alex', lastName: 'Johnson', role: 'OWNER', status: 'ACTIVE', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString() },
  { id: '2', userId: '2', email: 'sarah@salesconnect.io', firstName: 'Sarah', lastName: 'Chen', role: 'ADMIN', status: 'ACTIVE', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() },
  { id: '3', userId: '3', email: 'mike@salesconnect.io', firstName: 'Mike', lastName: 'Brown', role: 'SALES_REP', status: 'ACTIVE', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  { id: '4', userId: '4', email: 'emma@salesconnect.io', firstName: 'Emma', lastName: 'Wilson', role: 'SALES_REP', status: 'ACTIVE', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() },
  { id: '5', userId: '5', email: 'pending@company.com', firstName: 'Pending', lastName: 'User', role: 'SALES_REP', status: 'PENDING', joinedAt: new Date().toISOString() },
];

const mockWhatsAppNumbers: WhatsAppNumber[] = [
  { id: '1', phoneNumber: '+1 555 0100', displayName: 'Sales Primary', isActive: true, isPrimary: true, messagesSent: 8420, messagesReceived: 2150, lastActiveAt: new Date().toISOString(), wabaConnected: true, webhookConfigured: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() },
  { id: '2', phoneNumber: '+1 555 0101', displayName: 'Support Line', isActive: true, isPrimary: false, messagesSent: 4200, messagesReceived: 1820, lastActiveAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), wabaConnected: true, webhookConfigured: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString() },
  { id: '3', phoneNumber: '+1 555 0102', displayName: 'Marketing', isActive: false, isPrimary: false, messagesSent: 2800, messagesReceived: 450, lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), wabaConnected: true, webhookConfigured: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
];

const mockTemplates: WhatsAppTemplate[] = [
  { id: '1', name: 'Welcome Message', content: 'Hi {{1}}! Welcome to {{2}}. We\'re excited to have you on board. Reply with any questions!', category: 'UTILITY', language: 'en', isActive: true, usageCount: 1250, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Holiday Promo', content: '🎉 Special Holiday Offer! Get {{1}}% off on all products. Use code: {{2}}. Valid until {{3}}. Shop now!', category: 'MARKETING', language: 'en', isActive: true, usageCount: 850, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'Order Confirmation', content: 'Your order #{{1}} has been confirmed! Estimated delivery: {{2}}. Track your order here: {{3}}', category: 'UTILITY', language: 'en', isActive: true, usageCount: 2100, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', name: 'Appointment Reminder', content: 'Reminder: You have an appointment on {{1}} at {{2}}. Reply YES to confirm or RESCHEDULE to change.', category: 'UTILITY', language: 'en', isActive: true, usageCount: 680, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', name: 'Mensaje de Bienvenida', content: '¡Hola {{1}}! Bienvenido a {{2}}. Estamos emocionados de tenerte. ¡Responde con cualquier pregunta!', category: 'UTILITY', language: 'es', isActive: false, usageCount: 320, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(), updatedAt: new Date().toISOString() },
];

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Holiday Promo 2024', templateId: '2', templateName: 'Holiday Promo', status: 'COMPLETED', totalContacts: 500, messagesSent: 500, messagesDelivered: 478, messagesRead: 342, messagesFailed: 22, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), completedAt: new Date().toISOString() },
  { id: '2', name: 'New User Welcome', templateId: '1', templateName: 'Welcome Message', status: 'SENDING', totalContacts: 150, messagesSent: 89, messagesDelivered: 85, messagesRead: 45, messagesFailed: 4, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: '3', name: 'Product Launch Blast', templateId: '2', templateName: 'Holiday Promo', status: 'COMPLETED', totalContacts: 1200, messagesSent: 1200, messagesDelivered: 1104, messagesRead: 892, messagesFailed: 96, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString() },
];

const mockCampaignStats: CampaignStats = {
  totalCampaigns: 24,
  activeCampaigns: 1,
  totalMessagesSent: 15420,
  deliveryRate: 95.6,
  readRate: 72.3,
};

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [whatsappNumbers, setWhatsappNumbers] = useState<WhatsAppNumber[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      // const data = await api.organization.getStats();
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const refreshActivity = useCallback(async () => {
    try {
      // const data = await api.organization.getActivity();
      setActivity(mockActivity);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  }, []);

  const refreshTeam = useCallback(async () => {
    try {
      // const data = await api.team.list();
      setTeam(mockTeam);
    } catch (error) {
      console.error('Failed to fetch team:', error);
    }
  }, []);

  const refreshWhatsAppNumbers = useCallback(async () => {
    try {
      // const data = await api.whatsappNumbers.list();
      setWhatsappNumbers(mockWhatsAppNumbers);
    } catch (error) {
      console.error('Failed to fetch WhatsApp numbers:', error);
    }
  }, []);

  const refreshTemplates = useCallback(async () => {
    try {
      // const data = await api.templates.list();
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }, []);

  const refreshCampaigns = useCallback(async () => {
    try {
      // const [campaignsData, statsData] = await Promise.all([
      //   api.campaigns.list(),
      //   api.campaigns.getStats(),
      // ]);
      setCampaigns(mockCampaigns);
      setCampaignStats(mockCampaignStats);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      Promise.all([
        refreshStats(),
        refreshActivity(),
        refreshTeam(),
        refreshWhatsAppNumbers(),
        refreshTemplates(),
        refreshCampaigns(),
      ]).finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, refreshStats, refreshActivity, refreshTeam, refreshWhatsAppNumbers, refreshTemplates, refreshCampaigns]);

  return (
    <OrganizationContext.Provider
      value={{
        stats,
        activity,
        team,
        whatsappNumbers,
        templates,
        campaigns,
        campaignStats,
        isLoading,
        refreshStats,
        refreshActivity,
        refreshTeam,
        refreshWhatsAppNumbers,
        refreshTemplates,
        refreshCampaigns,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
