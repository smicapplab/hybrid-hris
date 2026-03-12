'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { GraduationCap } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { CategoryListPanel } from './components/category-list-panel';
import { SkillManagementPanel } from './components/skill-management-panel';
import { CategoryDialog } from './components/category-dialog';
import { SkillCategory } from '@/types/skills.types';

export default function SkillsTaxonomyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch<SkillCategory[]>('/skills/categories');
      setCategories(result);

      setSelectedCategoryId((current) => {
        if (result.length > 0 && !current) return result[0].id;
        return current;
      });
    } catch (err) {
      toast({
        title: 'Failed to load categories',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user, loadCategories]);

  if (!user) return null;

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Skills Taxonomy</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage the global catalog of skills and categories used across the organization.
        </p>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 rounded-lg border">
        <ResizablePanel defaultSize={30} minSize={20}>
          <CategoryListPanel
            categories={categories}
            loading={loading}
            selectedId={selectedCategoryId}
            onSelectAction={setSelectedCategoryId}
            onAddAction={() => {
              setEditingCategory(null);
              setCategoryDialogOpen(true);
            }}
            onEditAction={(cat) => {
              setEditingCategory(cat);
              setCategoryDialogOpen(true);
            }}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <div className="h-full overflow-y-auto p-5">
            {!selectedCategory ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No category selected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a category from the list to manage its skills.
                  </p>
                </div>
              </div>
            ) : (
              <SkillManagementPanel category={selectedCategory} />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChangeAction={setCategoryDialogOpen}
        initialData={editingCategory}
        onSuccessAction={loadCategories}
      />
    </div>
  );
}
