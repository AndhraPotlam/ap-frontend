'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { User, TaskTemplate, Task } from '@/types';
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function EditTaskPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskFor: 'hotel',
    taskOwner: '',
    priority: 'medium',
    procedure: '',
    checklistType: 'custom',
    dueDate: '',
    notes: '',
    location: '',
    estimatedDuration: '',
    tags: '',
    status: 'pending',
    isRecurring: false,
    recurringPattern: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
      interval: 1,
      daysOfWeek: [] as number[],
      dayOfMonth: 1
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchUsers();
      fetchTemplates();
      if (taskId) {
        fetchTask();
      }
    }
  }, [user, isAdmin, authLoading, router, taskId]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        const task: Task = data.task;
        
        setFormData({
          title: task.title || '',
          description: task.description || '',
          taskFor: task.taskFor || 'hotel',
          taskOwner: task.taskOwner ? (typeof task.taskOwner === 'string' ? task.taskOwner : task.taskOwner._id) : '',
          priority: task.priority || 'medium',
          procedure: task.procedure || '',
          checklistType: task.checklistType || 'custom',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          notes: task.notes || '',
          location: task.location || '',
          estimatedDuration: task.estimatedDuration?.toString() || '',
          tags: task.tags ? task.tags.join(', ') : '',
          status: task.status || 'pending',
          isRecurring: task.isRecurring || false,
          recurringPattern: (task.recurringPattern as any) || {
            frequency: 'daily',
            interval: 1,
            daysOfWeek: [] as number[],
            dayOfMonth: 1
          }
        });
      } else {
        toast.error('Failed to load task');
        router.push('/admin/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Failed to load task');
      router.push('/admin/tasks');
    } finally {
      setIsLoadingTask(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/task-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRecurringPatternChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurringPattern: {
        ...prev.recurringPattern,
        [field]: value
      }
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId && templateId !== 'none') {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev,
          title: template.name,
          description: template.description,
          taskFor: template.taskFor,
          procedure: template.procedure,
          checklistType: template.checklistType,
          priority: template.priority,
          location: template.location || '',
          estimatedDuration: template.estimatedDuration?.toString() || '',
          tags: template.tags ? template.tags.join(', ') : ''
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.taskOwner) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined
      };

      const response = await api.put(`/tasks/${taskId}`, submitData);
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Task updated successfully');
        router.push(`/admin/tasks/${taskId}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoadingTask) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading task...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Task Button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/admin/tasks/${taskId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Task
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Task</h1>
          <p className="text-gray-600">Update the task details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Selection */}
              <div>
                <Label htmlFor="template">Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template to pre-fill fields" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.name} ({template.checklistType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="taskOwner">Assigned To *</Label>
                  <Select value={formData.taskOwner} onValueChange={(value) => handleInputChange('taskOwner', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                  required
                />
              </div>

              {/* Task Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="taskFor">Task Category</Label>
                  <Select value={formData.taskFor} onValueChange={(value) => handleInputChange('taskFor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="guest_services">Guest Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="checklistType">Checklist Type</Label>
                  <Select value={formData.checklistType} onValueChange={(value) => handleInputChange('checklistType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                    placeholder="Enter estimated duration"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter task location"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              {/* Procedure */}
              <div>
                <Label htmlFor="procedure">Procedure</Label>
                <Textarea
                  id="procedure"
                  value={formData.procedure}
                  onChange={(e) => handleInputChange('procedure', e.target.value)}
                  placeholder="Enter detailed procedure steps"
                  rows={4}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter additional notes"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Updating...' : 'Update Task'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(`/admin/tasks/${taskId}`)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
