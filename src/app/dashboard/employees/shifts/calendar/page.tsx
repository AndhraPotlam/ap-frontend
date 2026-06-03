'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shift, ShiftAssignment, User } from '@/types';
import api from '@/lib/api';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export default function ShiftCalendarPage() {
    const router = useRouter();
    const { user: currentUser, isAdmin } = useAuth();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [isAdmin, currentDate, router]);

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

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getAssignmentsForDay = (day: Date) => {
        return assignments.filter(assignment =>
            isSameDay(new Date(assignment.date), day)
        );
    };

    const getShiftColor = (shiftId: string) => {
        const colors = [
            'bg-blue-100 text-blue-800',
            'bg-green-100 text-green-800',
            'bg-purple-100 text-purple-800',
            'bg-orange-100 text-orange-800',
            'bg-pink-100 text-pink-800',
        ];
        const index = shifts.findIndex(s => s._id === shiftId);
        return colors[index % colors.length];
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

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
                        onClick={() => router.push('/dashboard/employees/shifts')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Shifts
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Shift Calendar</h1>
                        <p className="text-gray-600">View shift assignments by calendar</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={previousMonth}>Previous</Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <Button variant="outline" onClick={nextMonth}>Next</Button>
                </div>
            </div>

            {/* Month/Year Display */}
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
            </div>

            {/* Calendar */}
            <Card>
                <CardContent className="p-4">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-semibold text-gray-600 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => {
                            const dayAssignments = getAssignmentsForDay(day);
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[120px] p-2 border rounded-lg ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    <div className={`text-sm font-semibold mb-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayAssignments.map((assignment) => {
                                            const employee = typeof assignment.employee === 'object' ? assignment.employee : null;
                                            const shift = typeof assignment.shift === 'object' ? assignment.shift : null;

                                            return (
                                                <div
                                                    key={assignment._id}
                                                    className={`text-xs p-1 rounded ${shift ? getShiftColor(shift._id) : 'bg-gray-100'}`}
                                                    title={`${employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'} - ${shift ? shift.name : 'Unknown Shift'}`}
                                                >
                                                    <div className="truncate font-medium">
                                                        {employee ? `${employee.firstName} ${employee.lastName.charAt(0)}.` : 'Unknown'}
                                                    </div>
                                                    <div className="truncate text-xs opacity-75">
                                                        {shift ? shift.name : 'Unknown'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Shift Legend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {shifts.map((shift, index) => (
                            <Badge key={shift._id} className={getShiftColor(shift._id)}>
                                {shift.name} ({shift.startTime} - {shift.endTime})
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
