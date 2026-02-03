import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { AppLayout, PageContainer } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCardsSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Send, MessageSquare, Phone, FileText, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user, organization } = useAuth();
  const { stats, activity, isLoading } = useOrganization();

  const subscriptionStatusVariant = {
    TRIAL: 'warning',
    ACTIVE: 'success',
    PAST_DUE: 'destructive',
    CANCELLED: 'destructive',
  } as const;

  const usagePercentage = organization
    ? Math.round((organization.messagesUsed / organization.messageLimit) * 100)
    : 0;

  return (
    <AppLayout>
      <PageContainer>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, {user?.firstName}
              </h1>
              <p className="mt-1 text-muted-foreground">
                Here's what's happening with {organization?.name} today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge
                variant={subscriptionStatusVariant[organization?.subscriptionStatus || 'TRIAL']}
                dot
              >
                {organization?.plan} • {organization?.subscriptionStatus}
              </StatusBadge>
            </div>
          </div>

          {/* Usage Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Usage</p>
                  <p className="text-2xl font-semibold">
                    {organization?.messagesUsed.toLocaleString()}{' '}
                    <span className="text-lg font-normal text-muted-foreground">
                      / {organization?.messageLimit.toLocaleString()} messages
                    </span>
                  </p>
                </div>
                <div className="flex-1 max-w-md">
                  <Progress value={usagePercentage} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground text-right">
                    {usagePercentage}% used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          {isLoading ? (
            <StatCardsSkeleton count={4} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Contacts"
                value={stats?.totalContacts || 0}
                icon={Users}
                trend={{ value: 12, label: 'vs last month' }}
              />
              <StatCard
                title="Active Campaigns"
                value={stats?.totalCampaigns || 0}
                icon={Send}
              />
              <StatCard
                title="Messages This Month"
                value={stats?.messagesThisMonth || 0}
                icon={MessageSquare}
                trend={{ value: 8, label: 'vs last month' }}
              />
              <StatCard
                title="Active Numbers"
                value={stats?.activeWhatsAppNumbers || 0}
                icon={Phone}
              />
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand/10 p-2">
                        <FileText className="h-4 w-4 text-brand" />
                      </div>
                      <span className="text-sm font-medium">Active Templates</span>
                    </div>
                    <span className="text-lg font-semibold">{stats?.activeTemplates || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-success/10 p-2">
                        <MessageSquare className="h-4 w-4 text-success" />
                      </div>
                      <span className="text-sm font-medium">Total Messages Sent</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {stats?.totalMessages.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-info/10 p-2">
                        <Phone className="h-4 w-4 text-info" />
                      </div>
                      <span className="text-sm font-medium">WhatsApp Numbers</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {stats?.activeWhatsAppNumbers || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-muted p-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.userName} •{' '}
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
