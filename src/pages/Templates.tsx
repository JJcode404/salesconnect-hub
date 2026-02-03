import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout, PageContainer } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Copy } from 'lucide-react';
import { WhatsAppTemplate, TemplateCategory, TemplateLanguage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const categoryLabels: Record<TemplateCategory, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utility',
  AUTHENTICATION: 'Authentication',
};

const categoryVariants: Record<TemplateCategory, 'brand' | 'info' | 'warning'> = {
  MARKETING: 'brand',
  UTILITY: 'info',
  AUTHENTICATION: 'warning',
};

const languageLabels: Record<TemplateLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
};

export default function Templates() {
  const { templates, isLoading, refreshTemplates } = useOrganization();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WhatsAppTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'UTILITY' as TemplateCategory,
    language: 'en' as TemplateLanguage,
  });
  const [isSaving, setIsSaving] = useState(false);

  const canManage = hasRole(['OWNER', 'ADMIN']);

  const resetForm = () => {
    setFormData({ name: '', content: '', category: 'UTILITY', language: 'en' });
  };

  const openCreate = () => {
    resetForm();
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (template: WhatsAppTemplate) => {
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      language: template.language,
    });
    setEditTarget(template);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editTarget) {
        // await api.templates.update(editTarget.id, formData);
        toast({ title: 'Template updated' });
      } else {
        // await api.templates.create(formData);
        toast({ title: 'Template created' });
      }
      await new Promise((r) => setTimeout(r, 1000));
      setModalOpen(false);
      resetForm();
      setEditTarget(null);
      refreshTemplates();
    } catch (error) {
      toast({ title: 'Failed to save template', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (template: WhatsAppTemplate) => {
    try {
      // await api.templates.toggle(template.id);
      toast({ title: template.isActive ? 'Template deactivated' : 'Template activated' });
      refreshTemplates();
    } catch (error) {
      toast({ title: 'Failed to toggle status', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // await api.templates.delete(deleteTarget.id);
      toast({ title: 'Template deleted' });
      setDeleteTarget(null);
      refreshTemplates();
    } catch (error) {
      toast({ title: 'Failed to delete template', variant: 'destructive' });
    }
  };

  const handleDuplicate = (template: WhatsAppTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      content: template.content,
      category: template.category,
      language: template.language,
    });
    setEditTarget(null);
    setModalOpen(true);
  };

  return (
    <AppLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Templates"
            description="Create and manage your WhatsApp message templates."
          >
            {canManage && (
              <Button onClick={openCreate} className="bg-brand text-brand-foreground hover:bg-brand-hover">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            )}
          </PageHeader>

          {/* Templates Table */}
          <div className="rounded-xl border bg-card">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={5} columns={6} />
              </div>
            ) : templates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No templates"
                description="Create your first message template to start sending campaigns."
                action={canManage ? { label: 'Create Template', onClick: openCreate } : undefined}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {template.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={categoryVariants[template.category]}>
                          {categoryLabels[template.category]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {languageLabels[template.language]}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{template.usageCount.toLocaleString()}</span>
                        <span className="text-muted-foreground"> uses</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={() => handleToggle(template)}
                            disabled={!canManage}
                          />
                          <span className="text-sm text-muted-foreground">
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(template)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(template)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTarget ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                {editTarget
                  ? 'Update your message template details.'
                  : 'Create a new WhatsApp message template.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="Welcome Message"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData((p) => ({ ...p, category: v as TemplateCategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(v) => setFormData((p) => ({ ...p, language: v as TemplateLanguage }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  placeholder="Hi {{1}}! Welcome to {{2}}..."
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{1}}"}, {"{{2}}"}, etc. for dynamic variables.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.content || isSaving}
                className="bg-brand text-brand-foreground hover:bg-brand-hover"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editTarget ? 'Save Changes' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </AppLayout>
  );
}
