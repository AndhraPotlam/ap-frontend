'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CashSessionType } from '@/types';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CashboxSettingsCRUDPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [types, setTypes] = useState<CashSessionType[]>([]);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchTypes();
    }
  }, [isLoading, user]);

  const fetchTypes = async () => {
    try {
      const res = await api.get('/cashbox/session-types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data.types || []);
      }
    } catch (error) {
      console.error('Error fetching session types:', error);
    }
  };


  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await api.post('/cashbox/session-types', { name: newName.trim(), description: newDescription.trim() });
      if (res.ok) {
        toast.success('Session type created');
        setNewName('');
        setNewDescription('');
        fetchTypes();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (t: CashSessionType) => {
    setEditId(t._id);
    setEditName(t.name);
    setEditDescription(t.description || '');
    setEditIsActive(t.isActive);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
    setEditDescription('');
    setEditIsActive(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setIsUpdating(true);
    try {
      const res = await api.put(`/cashbox/session-types/${editId}`, { name: editName.trim(), description: editDescription.trim(), isActive: editIsActive });
      if (res.ok) {
        toast.success('Session type updated');
        cancelEdit();
        fetchTypes();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/cashbox/session-types/${deleteId}`);
      if (res.ok) {
        toast.success('Deleted successfully');
        setDeleteId(null);
        fetchTypes();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to delete');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cash Box Session Types</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage list of session types (e.g., Morning, Afternoon, Evening)</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/cashbox')} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cash Box
            </Button>
          </div>
        </div>

        {/* Create New Card */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Create New Session Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="mb-2 block text-sm font-medium">Name *</Label>
                <Input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g., Morning" 
                  className="w-full"
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Description</Label>
                <Input 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)} 
                  placeholder="Optional description" 
                  className="w-full"
                />
              </div>
              <div className="flex justify-end sm:justify-start lg:justify-end">
                <Button 
                  onClick={handleCreate} 
                  disabled={isCreating}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" /> 
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Session Types */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Existing Session Types</CardTitle>
          </CardHeader>
          <CardContent>
            {types.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No session types found.</div>
            ) : (
              <div className="space-y-3">
                {types.map((t) => (
                  <div key={t._id} className="p-4 sm:p-6 border rounded-lg bg-white hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-lg">{t.name}</div>
                        {t.description && <div className="text-sm text-gray-600 mt-1">{t.description}</div>}
                        <div className="text-xs mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            t.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {t.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button variant="outline" size="sm" onClick={() => startEdit(t)} className="w-full sm:w-auto sm:min-w-[80px]">
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => confirmDelete(t._id)} className="w-full sm:w-auto sm:min-w-[80px]">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {editId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={cancelEdit} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="text-lg font-semibold text-gray-900">Edit Session Type</div>
                <button aria-label="Close" className="p-1 hover:bg-gray-100 rounded" onClick={cancelEdit}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="pt-4 space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium">Name *</Label>
                  <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Description</Label>
                  <Input 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="active" checked={editIsActive} onCheckedChange={setEditIsActive} />
                  <Label htmlFor="active" className="text-sm font-medium">Active</Label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button variant="outline" onClick={cancelEdit} className="w-full sm:flex-1">Cancel</Button>
                  <Button onClick={handleUpdate} disabled={isUpdating} className="w-full sm:flex-1">
                    <Save className="h-4 w-4 mr-2" /> {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
              <div className="text-lg font-semibold text-gray-900 mb-3">Delete Session Type</div>
              <div className="text-sm text-gray-600 mb-6">This will deactivate first. If already inactive, it will be permanently deleted. Continue?</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)} className="w-full sm:flex-1">Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full sm:flex-1">
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


