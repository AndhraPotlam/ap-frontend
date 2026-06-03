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
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { User } from '@/types';

export default function CreateTemplatePage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    taskFor: 'hotel',
    procedure: '',
    checklistType: 'custom',
    estimatedDuration: '',
    priority: 'medium',
    location: '',
    category: '',
    instructions: [''],
    requiredSkills: [''],
    equipment: [''],
    safetyNotes: '',
    tags: '',
    defaultDueTime: '09:00',
    defaultAssignees: [] as string[]
  });
  const [users, setUsers] = useState<User[]>([]);
  const [assigneePicker, setAssigneePicker] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error loading users', error);
      }
    };
    if (!authLoading && user && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, user, isAdmin]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), '']
    }));
  };

  const removeArrayField = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_: string, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.procedure || !formData.estimatedDuration) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        estimatedDuration: parseInt(formData.estimatedDuration),
        instructions: formData.instructions.filter(instruction => instruction.trim()),
        requiredSkills: formData.requiredSkills.filter(skill => skill.trim()),
        equipment: formData.equipment.filter(item => item.trim()),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        defaultAssignees: formData.defaultAssignees
      };

      const response = await api.post('/task-templates', submitData);
      if (response.ok) {
        toast.success('Template created successfully');
        router.push('/dashboard/tasks/templates');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const addDefaultAssignee = () => {
    if (!assigneePicker) return;
    if (formData.defaultAssignees.includes(assigneePicker)) {
      setAssigneePicker('');
      return;
    }
    setFormData(prev => ({
      ...prev,
      defaultAssignees: [...prev.defaultAssignees, assigneePicker]
    }));
    setAssigneePicker('');
  };

  const removeDefaultAssignee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      defaultAssignees: prev.defaultAssignees.filter(existing => existing !== id)
    }));
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
      {/* Back to Templates Button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/tasks/templates')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Task Template</h1>
          <p className="text-gray-600">Create a reusable template for generating tasks</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter template name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Enter category"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter template description"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="estimatedDuration">Estimated Duration (minutes) *</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                    placeholder="Enter estimated duration"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter default location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="defaultDueTime">Default Due Time</Label>
                  <Input
                    id="defaultDueTime"
                    type="time"
                    value={formData.defaultDueTime}
                    onChange={(e) => handleInputChange('defaultDueTime', e.target.value)}
                  />
                </div>
              </div>

              {/* Procedure */}
              <div>
                <Label htmlFor="procedure">Procedure *</Label>
                <Textarea
                  id="procedure"
                  value={formData.procedure}
                  onChange={(e) => handleInputChange('procedure', e.target.value)}
                  placeholder="Enter detailed procedure steps"
                  rows={6}
                  required
                />
              </div>

              {/* Instructions */}
              <div>
                <Label>Instructions</Label>
                <div className="space-y-2">
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={instruction}
                        onChange={(e) => handleArrayFieldChange('instructions', index, e.target.value)}
                        placeholder={`Instruction ${index + 1}`}
                      />
                      {formData.instructions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayField('instructions', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField('instructions')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Instruction
                  </Button>
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <Label>Required Skills</Label>
                <div className="space-y-2">
                  {formData.requiredSkills.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={skill}
                        onChange={(e) => handleArrayFieldChange('requiredSkills', index, e.target.value)}
                        placeholder={`Skill ${index + 1}`}
                      />
                      {formData.requiredSkills.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayField('requiredSkills', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField('requiredSkills')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </div>
              </div>

              {/* Equipment */}
              <div>
                <Label>Equipment</Label>
                <div className="space-y-2">
                  {formData.equipment.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('equipment', index, e.target.value)}
                        placeholder={`Equipment ${index + 1}`}
                      />
                      {formData.equipment.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayField('equipment', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField('equipment')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                  </Button>
                </div>
              </div>

              {/* Safety Notes */}
              <div>
                <Label htmlFor="safetyNotes">Safety Notes</Label>
                <Textarea
                  id="safetyNotes"
                  value={formData.safetyNotes}
                  onChange={(e) => handleInputChange('safetyNotes', e.target.value)}
                  placeholder="Enter safety notes and precautions"
                  rows={3}
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

              <div>
                <Label>Default Assignees</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Select value={assigneePicker} onValueChange={(value) => setAssigneePicker(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u._id} value={u._id}>
                            {u.firstName} {u.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={addDefaultAssignee}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  {formData.defaultAssignees.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.defaultAssignees.map((id) => {
                        const assignee = users.find(u => u._id === id);
                        const label = assignee ? `${assignee.firstName} ${assignee.lastName}` : id;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                          >
                            {label}
                            <button
                              type="button"
                              onClick={() => removeDefaultAssignee(id)}
                              className="text-gray-500 hover:text-gray-700"
                              aria-label="Remove assignee"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Create Template'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/tasks/templates')}>
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
