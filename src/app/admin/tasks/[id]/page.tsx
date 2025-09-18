'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Task } from '@/types';
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  Tag,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle,
  Play,
  FileText,
  Timer
} from 'lucide-react';
import { format } from 'date-fns';

export default function TaskDetailsPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
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
      fetchTask();
    }
  }, [user, isAdmin, authLoading, router, taskId]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
      } else {
        toast.error('Failed to load task');
        router.push('/admin/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Failed to load task');
      router.push('/admin/tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (response.ok) {
        toast.success('Task status updated successfully');
        fetchTask();
      } else {
        toast.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'on_hold':
        return <Pause className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskForColor = (taskFor: string) => {
    switch (taskFor) {
      case 'hotel':
        return 'bg-blue-100 text-blue-800';
      case 'restaurant':
        return 'bg-orange-100 text-orange-800';
      case 'maintenance':
        return 'bg-purple-100 text-purple-800';
      case 'cleaning':
        return 'bg-green-100 text-green-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'guest_services':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Task not found</div>
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
        {/* Task Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {getStatusIcon(task.status)}
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge className={getTaskForColor(task.taskFor)}>
                  {task.taskFor.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">
                  {task.checklistType}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={task.status}
                onValueChange={handleStatusUpdate}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-40">
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
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/tasks/${task._id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>

            {/* Procedure */}
            {task.procedure && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Procedure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{task.procedure}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {task.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{task.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Subtasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(subtask.status)}
                          <span className="font-medium">{subtask.title}</span>
                        </div>
                        <Badge className={getStatusColor(subtask.status)}>
                          {subtask.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Assigned To</div>
                    <div className="font-medium">
                      {task.taskOwner.firstName} {task.taskOwner.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{task.taskOwner.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Assigned By</div>
                    <div className="font-medium">
                      {task.assignedBy.firstName} {task.assignedBy.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{task.assignedBy.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-medium">{formatDateTime(task.createdAt)}</div>
                  </div>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Due Date</div>
                      <div className="font-medium">{formatDateTime(task.dueDate)}</div>
                    </div>
                  </div>
                )}

                {task.startTime && (
                  <div className="flex items-center gap-3">
                    <Timer className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Started</div>
                      <div className="font-medium">{formatDateTime(task.startTime)}</div>
                    </div>
                  </div>
                )}

                {task.endTime && (
                  <div className="flex items-center gap-3">
                    <Timer className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Completed</div>
                      <div className="font-medium">{formatDateTime(task.endTime)}</div>
                    </div>
                  </div>
                )}

                {task.completedAt && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Completed At</div>
                      <div className="font-medium">{formatDateTime(task.completedAt)}</div>
                    </div>
                  </div>
                )}

                {task.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Location</div>
                      <div className="font-medium">{task.location}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Estimated Duration</div>
                    <div className="font-medium">{formatDuration(task.estimatedDuration)}</div>
                  </div>
                </div>

                {task.timeTaken && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Actual Duration</div>
                      <div className="font-medium">{formatDuration(task.timeTaken)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recurring Pattern */}
            {task.isRecurring && task.recurringPattern && (
              <Card>
                <CardHeader>
                  <CardTitle>Recurring Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Frequency:</strong> {task.recurringPattern.frequency}</div>
                    <div><strong>Interval:</strong> Every {task.recurringPattern.interval} {task.recurringPattern.frequency}</div>
                    {task.recurringPattern.daysOfWeek && task.recurringPattern.daysOfWeek.length > 0 && (
                      <div><strong>Days:</strong> {task.recurringPattern.daysOfWeek.join(', ')}</div>
                    )}
                    {task.recurringPattern.dayOfMonth && (
                      <div><strong>Day of Month:</strong> {task.recurringPattern.dayOfMonth}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
