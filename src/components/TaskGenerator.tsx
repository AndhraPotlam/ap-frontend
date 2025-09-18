'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Play, Square, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

interface TaskGeneratorProps {
  onTasksGenerated?: () => void;
}

export default function TaskGenerator({ onTasksGenerated }: TaskGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState<{ isRunning: boolean; message: string } | null>(null);
  const [generationForm, setGenerationForm] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    checklistType: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  // Fetch scheduler status
  const fetchSchedulerStatus = async () => {
    try {
      const response = await api.get('/tasks/scheduler/status');
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data);
      } else {
        setSchedulerStatus({ isRunning: false, message: 'Unable to fetch scheduler status' });
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      setSchedulerStatus({ isRunning: false, message: 'Error fetching scheduler status' });
    }
  };

  // Generate tasks for date range
  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post('/tasks/generate-date-range', generationForm);
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Tasks generated successfully');
        onTasksGenerated?.();
      } else {
        toast.error('Failed to generate tasks');
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast.error('Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate tasks for specific date
  const handleGenerateForDate = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post('/tasks/generate-date', {
        date: generationForm.startDate,
        checklistType: generationForm.checklistType
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Tasks generated successfully');
        onTasksGenerated?.();
      } else {
        toast.error('Failed to generate tasks');
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast.error('Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  // Start scheduler
  const handleStartScheduler = async () => {
    try {
      const response = await api.post('/tasks/scheduler/start');
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Task scheduler initialized for Vercel deployment');
        fetchSchedulerStatus();
      } else {
        toast.error('Failed to start scheduler');
      }
    } catch (error) {
      console.error('Error starting scheduler:', error);
      toast.error('Failed to start scheduler');
    }
  };

  // Stop scheduler
  const handleStopScheduler = async () => {
    try {
      const response = await api.post('/tasks/scheduler/stop');
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Task scheduler stopped');
        fetchSchedulerStatus();
      } else {
        toast.error('Failed to stop scheduler');
      }
    } catch (error) {
      console.error('Error stopping scheduler:', error);
      toast.error('Failed to stop scheduler');
    }
  };

  // Manual trigger for daily tasks
  const handleTriggerDaily = async () => {
    try {
      const response = await api.post('/tasks/trigger/daily');
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Daily tasks generated successfully');
        onTasksGenerated?.();
      } else {
        toast.error('Failed to generate daily tasks');
      }
    } catch (error) {
      console.error('Error triggering daily tasks:', error);
      toast.error('Failed to generate daily tasks');
    }
  };

  // Manual trigger for weekly tasks
  const handleTriggerWeekly = async () => {
    try {
      const response = await api.post('/tasks/trigger/weekly');
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Weekly tasks generated successfully');
        onTasksGenerated?.();
      } else {
        toast.error('Failed to generate weekly tasks');
      }
    } catch (error) {
      console.error('Error triggering weekly tasks:', error);
      toast.error('Failed to generate weekly tasks');
    }
  };

  // Manual trigger for monthly tasks
  const handleTriggerMonthly = async () => {
    try {
      const response = await api.post('/tasks/trigger/monthly');
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Monthly tasks generated successfully');
        onTasksGenerated?.();
      } else {
        toast.error('Failed to generate monthly tasks');
      }
    } catch (error) {
      console.error('Error triggering monthly tasks:', error);
      toast.error('Failed to generate monthly tasks');
    }
  };

  React.useEffect(() => {
    fetchSchedulerStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Scheduler Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task Scheduler Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {schedulerStatus?.isRunning ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Stopped
                </Badge>
              )}
              <span className="text-sm text-gray-600">
                {schedulerStatus?.message}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartScheduler}
                disabled={schedulerStatus?.isRunning}
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopScheduler}
                disabled={!schedulerStatus?.isRunning}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Task Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Manual Task Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={generationForm.startDate}
                onChange={(e) => setGenerationForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={generationForm.endDate}
                onChange={(e) => setGenerationForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="checklistType">Checklist Type</Label>
              <Select
                value={generationForm.checklistType}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setGenerationForm(prev => ({ ...prev, checklistType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleGenerateTasks}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Generate for Date Range
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateForDate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Generate for Single Date
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Manual Triggers (for testing)</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerDaily}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Trigger Daily
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerWeekly}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Trigger Weekly
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerMonthly}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Trigger Monthly
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="text-sm text-gray-600">
              Generating tasks... Please wait.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <div>
            <strong>Vercel Cron Jobs:</strong> The scheduler runs automatically via Vercel cron functions at:
          </div>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Daily tasks: 12:00 AM every day</li>
            <li>Weekly tasks: 12:00 AM every Sunday</li>
            <li>Monthly tasks: 12:00 AM on the 1st of each month</li>
          </ul>
          <div>
            <strong>Manual Generation:</strong> Use the form above to generate tasks for specific dates or date ranges.
          </div>
          <div>
            <strong>Manual Triggers:</strong> Use the trigger buttons to manually generate tasks for testing.
          </div>
          <div>
            <strong>Individual Tasks:</strong> Each day gets separate task entries, allowing individual tracking and completion status.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
