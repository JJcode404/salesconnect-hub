import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout, PageContainer } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton, StatCardsSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Rocket, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const statusVariants = {
  DRAFT: 'default',
  SENDING: 'info',
  COMPLETED: 'success',
  FAILED: 'destructive',
} as const;

const statusLabels = {
  DRAFT: 'Draft',
  SENDING: 'Sending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export default function Campaigns() {
  const { campaigns, campaignStats, templates, isLoading, refreshCampaigns } = useOrganization();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [sendOpen, setSendOpen] = useState(false);
  const [formData, setFormData] = useState({
    templateId: '',
    contactLimit: '',
    delayMs: '500',
  });
  const [isSending, setIsSending] = useState(false);

  const canSend = hasRole(['OWNER', 'ADMIN', 'SALES_REP']);
  const activeTemplates = templates.filter((t) => t.isActive);

  const handleSend = async () => {
    setIsSending(true);
    try {
      // await api.campaigns.send({
      //   templateId: formData.templateId,
      //   contactLimit: formData.contactLimit ? parseInt(formData.contactLimit) : undefined,
      //   delayMs: parseInt(formData.delayMs) || 500,
      // });
      await new Promise((r) => setTimeout(r, 2000));
      toast({
        title: 'Campaign started',
        description: 'Your campaign is now being sent to contacts.',
      });
      setSendOpen(false);
      setFormData({ templateId: '', contactLimit: '', delayMs: '500' });
      refreshCampaigns();
    } catch (error) {
      toast({ title: 'Failed to start campaign', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Campaigns"
            description="Send and track your WhatsApp outreach campaigns."
          >
            {canSend && (
              <Button
                onClick={() => setSendOpen(true)}
                className="bg-brand text-brand-foreground hover:bg-brand-hover"
                disabled={activeTemplates.length === 0}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Send Campaign
              </Button>
            )}
          </PageHeader>

          {/* Stats */}
          {isLoading ? (
            <StatCardsSkeleton count={4} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Campaigns"
                value={campaignStats?.totalCampaigns || 0}
                icon={Send}
              />
              <StatCard
                title="Active Campaigns"
                value={campaignStats?.activeCampaigns || 0}
                icon={Rocket}
              />
              <StatCard
                title="Delivery Rate"
                value={`${campaignStats?.deliveryRate || 0}%`}
                icon={CheckCircle}
              />
              <StatCard
                title="Read Rate"
                value={`${campaignStats?.readRate || 0}%`}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Campaigns Table */}
          <div className="rounded-xl border bg-card">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={5} columns={6} />
              </div>
            ) : campaigns.length === 0 ? (
              <EmptyState
                icon={Send}
                title="No campaigns yet"
                description="Send your first campaign to start reaching your contacts."
                action={
                  canSend && activeTemplates.length > 0
                    ? { label: 'Send Campaign', onClick: () => setSendOpen(true) }
                    : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Read Rate</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const progress = campaign.totalContacts > 0
                      ? Math.round((campaign.messagesSent / campaign.totalContacts) * 100)
                      : 0;
                    const deliveryRate = campaign.messagesSent > 0
                      ? Math.round((campaign.messagesDelivered / campaign.messagesSent) * 100)
                      : 0;
                    const readRate = campaign.messagesDelivered > 0
                      ? Math.round((campaign.messagesRead / campaign.messagesDelivered) * 100)
                      : 0;

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.totalContacts.toLocaleString()} contacts
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaign.templateName}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            variant={statusVariants[campaign.status]}
                            dot={campaign.status === 'SENDING'}
                            pulse={campaign.status === 'SENDING'}
                          >
                            {statusLabels[campaign.status]}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{campaign.messagesSent.toLocaleString()}</span>
                              <span className="text-muted-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-success">{deliveryRate}%</span>
                          {campaign.messagesFailed > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({campaign.messagesFailed} failed)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{readRate}%</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Send Campaign Dialog */}
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Campaign</DialogTitle>
              <DialogDescription>
                Configure and send a new WhatsApp campaign to your contacts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Message Template</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, templateId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({template.category})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactLimit">Contact Limit (optional)</Label>
                <Input
                  id="contactLimit"
                  type="number"
                  placeholder="Leave empty to send to all"
                  value={formData.contactLimit}
                  onChange={(e) => setFormData((p) => ({ ...p, contactLimit: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Limit the number of contacts to send to. Useful for testing.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Delay Between Messages (ms)</Label>
                <Select
                  value={formData.delayMs}
                  onValueChange={(v) => setFormData((p) => ({ ...p, delayMs: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="250">250ms (Fast)</SelectItem>
                    <SelectItem value="500">500ms (Normal)</SelectItem>
                    <SelectItem value="1000">1 second (Slow)</SelectItem>
                    <SelectItem value="2000">2 seconds (Very Slow)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Slower delays reduce the risk of rate limiting.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!formData.templateId || isSending}
                className="bg-brand text-brand-foreground hover:bg-brand-hover"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Start Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}
