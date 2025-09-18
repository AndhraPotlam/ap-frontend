'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { User, TaskTemplate } from '@/types';
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function CreateTaskPage() {
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
    isRecurring: false,
    recurringPattern: {
      frequency: 'daily',
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: 1
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchUsers();
      fetchTemplates();
    }
  }, [user, isAdmin, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'none') {
      // Reset form data when "No template" is selected
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        taskFor: 'hotel',
        procedure: '',
        checklistType: 'custom',
        priority: 'medium',
        location: '',
        estimatedDuration: '',
        tags: ''
      }));
      return;
    }
    
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
        estimatedDuration: template.estimatedDuration.toString(),
        tags: template.tags.join(', ')
      }));
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
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined
      };

      const response = await api.post('/tasks', submitData);
      if (response.ok) {
        toast.success('Task created successfully');
        router.push('/admin/tasks');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Tasks Button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/tasks')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Task</h1>
          <p className="text-gray-600">Create a new task and assign it to a team member</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <Label htmlFor="template">Start from Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template to pre-fill form" />
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

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter task description"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Task For */}
                  <div>
                    <Label htmlFor="taskFor">Task Category *</Label>
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

                  {/* Task Owner */}
                  <div>
                    <Label htmlFor="taskOwner">Assign To *</Label>
                    <Select value={formData.taskOwner} onValueChange={(value) => handleInputChange('taskOwner', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team member" />
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

                  {/* Priority */}
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

                  {/* Checklist Type */}
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

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter task location"
                    />
                  </div>

                  {/* Estimated Duration */}
                  <div>
                    <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                      placeholder="Enter estimated duration in minutes"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="Enter tags separated by commas"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Creating...' : 'Create Task'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/tasks')}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/tasks/templates')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Templates
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/tasks')}
                >
                  View All Tasks
                </Button>
              </CardContent>
            </Card>

            {/* Form Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Task Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {formData.title || 'Not set'}</div>
                  <div><strong>Category:</strong> {formData.taskFor}</div>
                  <div><strong>Priority:</strong> {formData.priority}</div>
                  <div><strong>Type:</strong> {formData.checklistType}</div>
                  <div><strong>Assigned to:</strong> {
                    formData.taskOwner 
                      ? users.find(u => u._id === formData.taskOwner)?.firstName + ' ' + users.find(u => u._id === formData.taskOwner)?.lastName
                      : 'Not assigned'
                  }</div>
                  {formData.estimatedDuration && (
                    <div><strong>Duration:</strong> {formData.estimatedDuration} minutes</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
