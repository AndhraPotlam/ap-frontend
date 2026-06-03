'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shift, ShiftAssignment } from '@/types';
import api from '@/lib/api';
import { ArrowLeft, Plus, Clock, Calendar, Users, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ShiftsPage() {
    const router = useRouter();
    const { user: currentUser, isAdmin } = useAuth();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddShift, setShowAddShift] = useState(false);
    const [showAssignShift, setShowAssignShift] = useState(false);

    // Form states
    const [shiftForm, setShiftForm] = useState({
        name: '',
        startTime: '',
        endTime: '',
        duration: '',
        daysOfWeek: [] as number[]
    });

    const [assignForm, setAssignForm] = useState({
        employeeId: '',
        shiftId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [isAdmin, router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);

            // Fetch shifts
            const shiftsRes = await api.get('/shifts');
            if (shiftsRes.ok) {
                const data = await shiftsRes.json();
                setShifts(data.shifts || []);
            }

            // Fetch employees
            const empRes = await api.get('/users');
            if (empRes.ok) {
                const data = await empRes.json();
                const employeeList = (data.users || []).filter((u: User) =>
                    u.role === 'employee' || u.role === 'admin'
                );
                setEmployees(employeeList);
            }

            // Fetch shift assignments
            const assignRes = await api.get('/shift-assignments');
            if (assignRes.ok) {
                const data = await assignRes.json();
                setAssignments(data.assignments || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateShift = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await api.post('/shifts', {
                ...shiftForm,
                duration: parseFloat(shiftForm.duration),
                isActive: true
            });

            if (response.ok) {
                toast.success('Shift created successfully');
                setShowAddShift(false);
                setShiftForm({ name: '', startTime: '', endTime: '', duration: '', daysOfWeek: [] });
                fetchData();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to create shift');
            }
        } catch (error) {
            toast.error('Failed to create shift');
        }
    };

    const handleAssignShift = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await api.post('/shift-assignments', {
                employee: assignForm.employeeId,
                shift: assignForm.shiftId,
                date: assignForm.startDate,
                status: 'scheduled'
            });

            if (response.ok) {
                toast.success('Shift assigned successfully');
                setShowAssignShift(false);
                setAssignForm({ employeeId: '', shiftId: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') });
                fetchData();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to assign shift');
            }
        } catch (error) {
            toast.error('Failed to assign shift');
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (!confirm('Are you sure you want to delete this shift?')) return;

        try {
            const response = await api.delete(`/shifts/${shiftId}`);
            if (response.ok) {
                toast.success('Shift deleted successfully');
                fetchData();
            } else {
                toast.error('Failed to delete shift');
            }
        } catch (error) {
            toast.error('Failed to delete shift');
        }
    };

    const toggleDay = (day: number) => {
        setShiftForm(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day]
        }));
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/employees')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Employees
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Shift Management</h1>
                        <p className="text-gray-600">Manage shift templates and assignments</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/employees/shifts/calendar')}
                >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar View
                </Button>
            </div>

            <Tabs defaultValue="templates" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="templates">Shift Templates</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>

                {/* Shift Templates Tab */}
                <TabsContent value="templates" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600">Create and manage shift templates</p>
                        <Button onClick={() => setShowAddShift(!showAddShift)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Shift Template
                        </Button>
                    </div>

                    {/* Add Shift Form */}
                    {showAddShift && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Shift Template</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateShift} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">Shift Name *</Label>
                                            <Input
                                                id="name"
                                                value={shiftForm.name}
                                                onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                                                placeholder="e.g., Morning Shift"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="duration">Duration (hours) *</Label>
                                            <Input
                                                id="duration"
                                                type="number"
                                                step="0.5"
                                                value={shiftForm.duration}
                                                onChange={(e) => setShiftForm({ ...shiftForm, duration: e.target.value })}
                                                placeholder="8"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="startTime">Start Time *</Label>
                                            <Input
                                                id="startTime"
                                                type="time"
                                                value={shiftForm.startTime}
                                                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="endTime">End Time *</Label>
                                            <Input
                                                id="endTime"
                                                type="time"
                                                value={shiftForm.endTime}
                                                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Days of Week</Label>
                                        <div className="flex gap-2 mt-2">
                                            {dayNames.map((day, index) => (
                                                <Button
                                                    key={index}
                                                    type="button"
                                                    variant={shiftForm.daysOfWeek.includes(index) ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => toggleDay(index)}
                                                >
                                                    {day}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit">Create Shift</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowAddShift(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Shift List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shifts.map((shift) => (
                            <Card key={shift._id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{shift.name}</CardTitle>
                                            <CardDescription>
                                                {shift.startTime} - {shift.endTime}
                                            </CardDescription>
                                        </div>
                                        <Badge>{shift.duration}hrs</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>{shift.duration} hours</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {shift.daysOfWeek.map((day: number) => (
                                                <Badge key={day} variant="outline" className="text-xs">
                                                    {dayNames[day]}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteShift(shift._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {shifts.length === 0 && !isLoading && (
                            <div className="col-span-full text-center py-12">
                                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">No shift templates yet</p>
                                <p className="text-sm text-gray-500">Create your first shift template to get started</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600">Assign shifts to employees</p>
                        <Button onClick={() => setShowAssignShift(!showAssignShift)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Shift
                        </Button>
                    </div>

                    {/* Assign Shift Form */}
                    {showAssignShift && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assign Shift to Employee</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAssignShift} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="employee">Employee *</Label>
                                            <Select value={assignForm.employeeId} onValueChange={(value) => setAssignForm({ ...assignForm, employeeId: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select employee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employees.map(emp => (
                                                        <SelectItem key={emp._id} value={emp._id}>
                                                            {emp.firstName} {emp.lastName} - {emp.department}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="shift">Shift *</Label>
                                            <Select value={assignForm.shiftId} onValueChange={(value) => setAssignForm({ ...assignForm, shiftId: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select shift" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {shifts.map(shift => (
                                                        <SelectItem key={shift._id} value={shift._id}>
                                                            {shift.name} ({shift.startTime} - {shift.endTime})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="date">Date *</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={assignForm.startDate}
                                                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit">Assign Shift</Button>
                                        <Button type="button" variant="outline" onClick={() => setShowAssignShift(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Assignments List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Shift Assignments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {assignments.slice(0, 10).map((assignment) => {
                                    const employee = typeof assignment.employee === 'object' ? assignment.employee : null;
                                    const shift = typeof assignment.shift === 'object' ? assignment.shift : null;

                                    return (
                                        <div key={assignment._id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {shift ? shift.name : 'Unknown Shift'} • {format(new Date(assignment.date), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                            <Badge className={assignment.status === 'scheduled' ? 'bg-blue-500' : 'bg-green-500'}>
                                                {assignment.status}
                                            </Badge>
                                        </div>
                                    );
                                })}
                                {assignments.length === 0 && !isLoading && (
                                    <div className="text-center py-8 text-gray-600">
                                        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                        <p>No shift assignments yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
