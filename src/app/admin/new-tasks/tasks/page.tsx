'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Task, User } from '@/types';
import api from '@/lib/api';
import { format, parseISO, addMinutes, startOfDay, endOfDay } from 'date-fns';
import { 
  Calendar, 
  List, 
  Clock, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Filter,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  XCircle,
  User as UserIcon,
  MapPin,
  Package,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'list' | 'timeline';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export default function GeneratedTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isLoading } = useAuth();
  const [date, setDate] = useState<string>(searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>('timeline');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  useEffect(() => {
    if (!isLoading) {
      if (!user) { router.push('/auth/login'); return; }
      // Check if user is admin or employee
      const isAdminOrEmployee = isAdmin || user?.role === 'employee';
      if (!isAdminOrEmployee) { router.push('/dashboard'); return; }
      fetchTasks();
      fetchUsers();
    }
  }, [isLoading, user, isAdmin, date]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(parseISO(date));
      const endDate = endOfDay(parseISO(date));
      const res = await api.get(`/tasks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        console.log('Fetched tasks for date:', date, 'Count:', (data.tasks || []).length);
      } else {
        console.error('Failed to fetch tasks:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (locationFilter !== 'all' && (task as any).location !== locationFilter) return false;
      if (assigneeFilter !== 'all') {
        const ownerId = typeof task.taskOwner === 'string' ? task.taskOwner : task.taskOwner?._id;
        if (ownerId !== assigneeFilter) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, locationFilter, assigneeFilter]);

  const timelineData = useMemo(() => {
    const locations = [...new Set(filteredTasks.map(t => (t as any).location || 'Kitchen'))];
    const timeline: Record<string, Task[]> = {};
    
    locations.forEach(location => {
      timeline[location] = filteredTasks.filter(t => (t as any).location === location);
    });
    
    return timeline;
  }, [filteredTasks]);

  const getTaskTypeColor = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'cooking': return 'bg-red-100 text-red-800 border-red-200';
      case 'cutting': return 'bg-green-100 text-green-800 border-green-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleaning': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'mixing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'removing': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'soaking': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'on_hold': return <Pause className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStartMinutes = (task: Task) => {
    if ((task as any).plannedStart) {
      const startTime = parseISO((task as any).plannedStart);
      return startTime.getHours() * 60 + startTime.getMinutes();
    }
    return 0;
  };

  const getDuration = (task: Task) => {
    if ((task as any).estimatedDuration) {
      return (task as any).estimatedDuration;
    }
    if ((task as any).plannedStart && (task as any).plannedEnd) {
      const start = parseISO((task as any).plannedStart);
      const end = parseISO((task as any).plannedEnd);
      return Math.max(5, (end.getTime() - start.getTime()) / (1000 * 60));
    }
    return 15; // Default duration
  };

  const getTaskOwnerName = (task: Task) => {
    const owner: any = (task as any).taskOwner;
    const ownerId = typeof owner === 'string' ? owner : owner?._id;
    const user = users.find(u => u._id === ownerId);
    if (user) return `${user.firstName} ${user.lastName}`;
    return typeof owner === 'string' ? owner : `${owner?.firstName ?? ''} ${owner?.lastName ?? ''}`.trim() || 'Unknown';
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status });
      if (res.ok) {
        toast.success('Task status updated');
        fetchTasks();
      } else {
        toast.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Error updating task status');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const res = await api.delete(`/tasks/${taskId}`);
      if (res.ok) {
        toast.success('Task deleted successfully');
        fetchTasks();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          minutes: hour * 60 + minute
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/admin/new-tasks')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to New Task Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generated Tasks</h1>
            <p className="text-gray-600 text-sm">View and manage tasks generated from recipe process day plans</p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTasks}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={view === 'timeline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('timeline')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Timeline
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {[...new Set(tasks.map(t => (t as any).location || 'Kitchen'))].map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Task Count */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredTasks.length} of {tasks.length} tasks for {format(parseISO(date), 'MMMM do, yyyy')}
          </div>
          <div className="flex gap-2">
            {Object.entries(
              tasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([status, count]) => (
              <Badge key={status} className={`${getStatusColor(status as TaskStatus)} text-xs`}>
                {status}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content */}
        {view === 'list' ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Task</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Assignee</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${getTaskTypeColor((task as any).type)} text-xs`}>
                            {(task as any).type || 'other'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{getTaskOwnerName(task)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{(task as any).location || 'Kitchen'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {(task as any).plannedStart && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO((task as any).plannedStart), 'HH:mm')}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {getDuration(task)} min
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${getStatusColor(task.status)} text-xs flex items-center gap-1 w-fit`}>
                            {getStatusIcon(task.status)}
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Select value={task.status} onValueChange={(status) => updateTaskStatus(task._id, status as TaskStatus)}>
                              <SelectTrigger className="w-32 h-8">
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
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/tasks/${task._id}`)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTask(task._id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Timeline Header */}
                  <div className="flex border-b bg-gray-50">
                    <div className="w-48 p-3 text-sm font-medium text-gray-700 border-r">Location</div>
                    <div className="flex-1">
                      <div className="grid grid-cols-48 gap-0">
                        {timeSlots.map(slot => (
                          <div key={slot.minutes} className="p-2 text-xs text-gray-500 border-r text-center">
                            {slot.time}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Rows */}
                  {Object.entries(timelineData).map(([location, locationTasks]) => (
                    <div key={location} className="flex border-b">
                      <div className="w-48 p-3 text-sm font-medium text-gray-700 border-r bg-gray-50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {location}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {locationTasks.length} tasks
                        </div>
                      </div>
                      <div className="flex-1 relative">
                        <div className="grid grid-cols-48 gap-0 h-16">
                          {timeSlots.map(slot => (
                            <div key={slot.minutes} className="border-r border-gray-100"></div>
                          ))}
                        </div>
                        
                        {/* Task Bars */}
                        <div className="absolute top-0 left-0 w-full h-full">
                          {locationTasks.map(task => {
                            const startMinutes = getStartMinutes(task);
                            const duration = getDuration(task);
                            const leftPercent = (startMinutes / (24 * 60)) * 100;
                            const widthPercent = (duration / (24 * 60)) * 100;
                            
                            return (
                              <div
                                key={task._id}
                                className="absolute top-1 bottom-1 rounded border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${Math.max(widthPercent, 0.5)}%`,
                                  backgroundColor: getTaskTypeColor((task as any).type).split(' ')[0].replace('bg-', ''),
                                  borderLeftColor: getPriorityColor(task.priority).split(' ')[0].replace('bg-', '')
                                }}
                                title={`${task.title} - ${getDuration(task)} min`}
                              >
                                <div className="p-1 h-full flex flex-col justify-between">
                                  <div className="text-xs font-medium text-white truncate">
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-white/80">
                                    {getTaskOwnerName(task)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4">
                {tasks.length === 0 
                  ? 'No tasks have been generated for this date yet.'
                  : 'No tasks match the current filters.'
                }
              </p>
              {tasks.length === 0 && (
                <Button onClick={() => router.push('/admin/new-tasks/planner')}>
                  Create Day Plan
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}