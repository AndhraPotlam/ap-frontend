'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { TaskTemplate } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function TaskGenerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
  const [skippedTasks, setSkippedTasks] = useState<any[]>([]);
  
  const taskType = searchParams.get('type') || 'daily';
  const initialStart = searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');
  const initialEnd = searchParams.get('endDate') || format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState<string>(initialStart);
  const [endDate, setEndDate] = useState<string>(initialEnd);
  const returnUrl = searchParams.get('returnUrl') || '/admin/tasks';

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchTemplates();
    }
  }, [isLoading, user, isAdmin, taskType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/task-templates?checklistType=${taskType}&isActive=true`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Templates API error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async () => {
    try {
      setGenerating(true);
      const response = await api.post('/tasks/generate-date-range', {
        startDate,
        endDate,
        checklistType: taskType
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTasks(data.generatedTasks || []);
        setSkippedTasks(data.skippedTasks || []);
        toast.success(`Generated ${data.totalGenerated} tasks successfully`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate tasks');
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast.error('Failed to generate tasks');
    } finally {
      setGenerating(false);
    }
  };

  const applyDateRange = () => {
    // Update URL params to reflect edited date range (and keep current type/returnUrl)
    const params = new URLSearchParams();
    params.set('type', taskType);
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    if (returnUrl) params.set('returnUrl', returnUrl as string);
    router.replace(`/admin/tasks/generate?${params.toString()}`, { scroll: false });
  };

  const getTaskTypeInfo = (type: string) => {
    switch (type) {
      case 'daily':
        return {
          title: 'Daily Tasks',
          description: 'Generate daily recurring tasks for each day in the selected range',
          color: 'bg-blue-100 text-blue-800',
          icon: <Calendar className="h-4 w-4" />
        };
      case 'weekly':
        return {
          title: 'Weekly Tasks',
          description: 'Generate weekly tasks only for days that fall within the same week as the start date',
          color: 'bg-green-100 text-green-800',
          icon: <Calendar className="h-4 w-4" />
        };
      case 'monthly':
        return {
          title: 'Monthly Tasks',
          description: 'Generate monthly tasks only for days that fall within the same month as the start date',
          color: 'bg-purple-100 text-purple-800',
          icon: <Calendar className="h-4 w-4" />
        };
      default:
        return {
          title: 'Custom Tasks',
          description: 'Generate custom tasks',
          color: 'bg-gray-100 text-gray-800',
          icon: <Calendar className="h-4 w-4" />
        };
    }
  };

  const taskTypeInfo = getTaskTypeInfo(taskType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(returnUrl)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Tasks</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Generate {taskTypeInfo.title}
                </h1>
                <p className="text-gray-600">
                  {taskTypeInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Type Badge */}
        <div className="mb-6">
          <Badge className={`${taskTypeInfo.color} text-sm px-3 py-1`}>
            {taskTypeInfo.icon}
            <span className="ml-2">{taskTypeInfo.title}</span>
          </Badge>
        </div>

        {/* Date Range Info */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={applyDateRange}>
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Templates */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-600" />
              Available Templates ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No {taskType} templates found</p>
                <p className="text-sm text-gray-600 mb-4">
                  You need to create {taskType} task templates before generating tasks.
                </p>
                <Button onClick={() => router.push('/admin/tasks/templates')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Templates
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template._id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Category: {template.category}</span>
                          <span>Duration: {template.estimatedDuration}min</span>
                          <span>Priority: {template.priority}</span>
                          <span>For: {template.taskFor}</span>
                        </div>
                      </div>
                      <Badge className={`${taskTypeInfo.color} ml-4`}>
                        {template.checklistType}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        {templates.length > 0 && (
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Generate Tasks
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will create individual task instances for each template and each applicable day in the date range.
                </p>
                <Button 
                  onClick={generateTasks} 
                  disabled={generating}
                  size="lg"
                  className="px-8"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Tasks...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Tasks
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {(generatedTasks.length > 0 || skippedTasks.length > 0) && (
          <div className="space-y-6">
            {/* Generated Tasks */}
            {generatedTasks.length > 0 && (
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Generated Tasks ({generatedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedTasks.slice(0, 10).map((task, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-green-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{task.title}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              - {format(new Date(task.dueDate), 'MMM do, yyyy')}
                            </span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Generated</Badge>
                        </div>
                      </div>
                    ))}
                    {generatedTasks.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {generatedTasks.length - 10} more tasks
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skipped Tasks */}
            {skippedTasks.length > 0 && (
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-orange-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Skipped Tasks ({skippedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {skippedTasks.slice(0, 10).map((task, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-orange-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{task.template}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              - {format(new Date(task.date), 'MMM do, yyyy')}
                            </span>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">Skipped</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{task.reason}</p>
                      </div>
                    ))}
                    {skippedTasks.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {skippedTasks.length - 10} more skipped tasks
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
