'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ExpenseCategory } from '@/types';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{ id: string; name: string; description: string; isActive: boolean }>({ id: '', name: '', description: '', isActive: true });
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchCategories();
    }
  }, [user, isAdmin, authLoading, router]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expense-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!newName.trim()) {
      setCreateError('Name is required');
      toast.error('Name is required');
      return;
    }
    setIsCreating(true);
    try {
      const response = await api.post('/expense-categories', { name: newName.trim(), description: newDescription.trim() });
      if (response.ok) {
        toast.success('Expense category created');
        setNewName('');
        setNewDescription('');
        fetchCategories();
      } else {
        const error = await response.json();
        const msg = error?.message || 'Failed to create expense category';
        setCreateError(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error('Error creating expense category:', error);
      setCreateError('Unexpected error while creating expense category');
      toast.error('Failed to create expense category');
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = (category: ExpenseCategory) => {
    setDeleteTarget(category);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await api.delete(`/expense-categories/${deleteTarget._id}`);
      if (response.ok) {
        toast.success('Expense category deleted');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        fetchCategories();
      } else {
        const error = await response.json();
        // If deletion blocked due to linked expenses, guide user to inactivate
        if (error?.message?.includes('Mark it inactive')) {
          toast.error('Cannot delete: expenses exist. Mark it inactive instead.');
        } else {
          toast.error(error.message || 'Failed to delete expense category');
        }
      }
    } catch (error) {
      console.error('Error deleting expense category:', error);
      toast.error('Failed to delete expense category');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (category: ExpenseCategory) => {
    setEditForm({
      id: category._id,
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsSavingEdit(true);
    try {
      const response = await api.put(`/expense-categories/${editForm.id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        isActive: editForm.isActive,
      });
      if (response.ok) {
        toast.success('Expense category updated');
        setEditModalOpen(false);
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update expense category');
      }
    } catch (error) {
      console.error('Error updating expense category:', error);
      toast.error('Failed to update expense category');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/admin/expenses')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Expenses
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Expense Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Description (optional)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              <Button onClick={handleCreate} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Adding...' : 'Add'}
              </Button>
            </div>
            {createError && (
              <div className="text-sm text-red-600 mt-2">{createError}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center text-gray-500">No categories</div>
            ) : (
              <div className="space-y-2">
                {categories.map((c) => (
                  <div key={c._id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {c.name}
                        {!c.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border">Inactive</span>
                        )}
                      </div>
                      {c.description && <div className="text-sm text-gray-600">{c.description}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => confirmDelete(c)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <DeleteModal 
        open={deleteModalOpen} 
        onClose={() => { if (!isDeleting) { setDeleteModalOpen(false); setDeleteTarget(null); } }} 
        onConfirm={handleDeleteConfirmed} 
        categoryName={deleteTarget?.name} 
        isDeleting={isDeleting}
      />
      <EditCategoryModal
        open={editModalOpen}
        onClose={() => { if (!isSavingEdit) setEditModalOpen(false); }}
        form={editForm}
        setForm={setEditForm}
        onSave={handleEditSave}
        isSaving={isSavingEdit}
      />
    </div>
  );
}

// Delete Confirmation Modal
// Simple inline modal to avoid browser alerts
function DeleteModal({ open, onClose, onConfirm, categoryName, isDeleting }: { open: boolean; onClose: () => void; onConfirm: () => void; categoryName?: string; isDeleting: boolean; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Delete Expense Category</h3>
          <button className="p-1" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p>Are you sure you want to delete "{categoryName}"? This action cannot be undone.</p>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
        </div>
      </div>
    </div>
  );
}

function EditCategoryModal({ open, onClose, form, setForm, onSave, isSaving }: { open: boolean; onClose: () => void; form: { id: string; name: string; description: string; isActive: boolean }; setForm: React.Dispatch<React.SetStateAction<{ id: string; name: string; description: string; isActive: boolean }>>; onSave: () => void; isSaving: boolean; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Expense Category</h3>
          <button className="p-1" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Active</span>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
}


