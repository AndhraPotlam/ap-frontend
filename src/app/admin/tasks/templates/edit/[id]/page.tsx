'use client';
import React, { useState, useEffect } from 'react';
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
import { TaskTemplate } from '@/types';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

export default function EditTemplatePage() {
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
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push('/dashboard');
        return;
      }
      if (templateId) {
        fetchTemplate();
      }
    }
  }, [user, isAdmin, authLoading, router, templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/task-templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        const template: TaskTemplate = data.template;
        
        setFormData({
          name: template.name || '',
          description: template.description || '',
          taskFor: template.taskFor || 'hotel',
          procedure: template.procedure || '',
          checklistType: template.checklistType || 'custom',
          estimatedDuration: template.estimatedDuration?.toString() || '',
          priority: template.priority || 'medium',
          location: template.location || '',
          category: template.category || '',
          instructions: template.instructions && template.instructions.length > 0 ? template.instructions : [''],
          requiredSkills: template.requiredSkills && template.requiredSkills.length > 0 ? template.requiredSkills : [''],
          equipment: template.equipment && template.equipment.length > 0 ? template.equipment : [''],
          safetyNotes: template.safetyNotes || '',
          tags: template.tags ? template.tags.join(', ') : '',
          isActive: template.isActive !== undefined ? template.isActive : true
        });
      } else {
        toast.error('Failed to load template');
        router.push('/admin/tasks/templates');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
      router.push('/admin/tasks/templates');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], '']
    }));
  };

  const removeArrayField = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter((_: string, i: number) => i !== index)
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
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      const response = await api.put(`/task-templates/${templateId}`, submitData);
      if (response.ok) {
        toast.success('Template updated successfully');
        router.push('/admin/tasks/templates');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoadingTemplate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading template...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Templates Button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/tasks/templates')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Task Template</h1>
          <p className="text-gray-600">Update the template details</p>
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

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Updating...' : 'Update Template'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/admin/tasks/templates')}>
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
