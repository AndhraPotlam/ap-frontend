'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Edit, Trash2, CheckCircle, AlertCircle, Pause, XCircle, Play, Clock, User, Calendar, MapPin, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { Task, User as UserType } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function TasksListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const taskFor = searchParams.get('taskFor') || '';
  const checklistType = searchParams.get('checklistType') || '';
  const returnUrl = searchParams.get('returnUrl') || '/admin/tasks';

  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchTasks();
      fetchUsers();
    }
  }, [authLoading, user, currentPage, startDate, endDate, status, priority, taskFor, checklistType]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        startDate,
        endDate,
      });
      
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (taskFor) params.set('taskFor', taskFor);
      if (checklistType) params.set('checklistType', checklistType);

      const response = await api.get(`/tasks?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setTotalTasks(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        const errorText = await response.text();
        console.error('Tasks API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
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

  const handleViewTask = (taskId: string) => {
    const params = new URLSearchParams();
    // Construct returnUrl with current list page parameters
    const currentParams = new URLSearchParams();
    if (startDate) currentParams.set('startDate', startDate);
    if (endDate) currentParams.set('endDate', endDate);
    if (status) currentParams.set('status', status);
    if (priority) currentParams.set('priority', priority);
    if (taskFor) currentParams.set('taskFor', taskFor);
    if (checklistType) currentParams.set('checklistType', checklistType);
    
    const returnUrl = `/admin/tasks/list?${currentParams.toString()}`;
    params.set('returnUrl', returnUrl);
    router.push(`/admin/tasks/${taskId}?${params.toString()}`);
  };

  const handleEditTask = (taskId: string) => {
    const params = new URLSearchParams();
    const currentParams = new URLSearchParams();
    if (startDate) currentParams.set('startDate', startDate);
    if (endDate) currentParams.set('endDate', endDate);
    if (status) currentParams.set('status', status);
    if (priority) currentParams.set('priority', priority);
    if (taskFor) currentParams.set('taskFor', taskFor);
    if (checklistType) currentParams.set('checklistType', checklistType);
    
    const returnUrl = `/admin/tasks/list?${currentParams.toString()}`;
    params.set('returnUrl', returnUrl);
    router.push(`/admin/tasks/${taskId}/edit?${params.toString()}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await api.delete(`/tasks/${taskId}`);
        if (response.ok) {
          fetchTasks(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'on_hold': return <Pause className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="min-w-[40px]"
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {pages}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  const getFilterDescription = () => {
    const filters = [];
    if (startDate && endDate) {
      filters.push(`${format(new Date(startDate), 'MMM do')} - ${format(new Date(endDate), 'MMM do, yyyy')}`);
    }
    if (status) {
      filters.push(`Status: ${status}`);
    }
    if (priority) {
      filters.push(`Priority: ${priority}`);
    }
    if (taskFor) {
      filters.push(`Task For: ${taskFor}`);
    }
    if (checklistType) {
      filters.push(`Type: ${checklistType}`);
    }
    return filters.length > 0 ? ` (${filters.join(', ')})` : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
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
                  All Tasks{getFilterDescription()}
                </h1>
                <p className="text-gray-600">
                  {totalTasks} tasks found
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No tasks found</div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {task.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {task.taskFor} • {task.checklistType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${getStatusColor(task.status)}`}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {(() => {
                                const owner = (task as any).taskOwner;
                                const ownerId = typeof owner === 'string' ? owner : owner?._id;
                                const user = users.find(u => u._id === ownerId);
                                return user ? user.firstName : (typeof owner === 'string' ? owner : owner?.firstName || '');
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {task.dueDate ? format(new Date(task.dueDate), 'MMM do, yyyy') : 'No due date'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewTask(task._id)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTask(task._id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTask(task._id)}
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

                {/* Mobile Cards */}
                <div className="md:hidden">
                  <div className="space-y-4 p-4">
                    {tasks.map((task) => (
                      <div key={task._id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={`${getStatusColor(task.status)}`}>
                                {getStatusIcon(task.status)}
                                <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                              </Badge>
                              <Badge className={`${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {task.title}
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>
                                Assigned to: {(() => {
                                  const owner = (task as any).taskOwner;
                                  const ownerId = typeof owner === 'string' ? owner : owner?._id;
                                  const user = users.find(u => u._id === ownerId);
                                  return user ? user.firstName : (typeof owner === 'string' ? owner : owner?.firstName || '');
                                })()}
                              </div>
                              <div>
                                Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM do, yyyy') : 'No due date'}
                              </div>
                              <div>
                                {task.taskFor} • {task.checklistType}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTask(task._id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTask(task._id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTask(task._id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {renderPagination()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
