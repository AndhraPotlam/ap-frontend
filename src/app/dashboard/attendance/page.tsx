'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Attendance } from '@/types';
import api from '@/lib/api';
import { Clock, LogIn, LogOut, Calendar, ArrowLeft, TrendingUp, Coffee, AlertCircle, Timer } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function AttendancePage() {
    const router = useRouter();
    const { user, isAdmin, isLoading: authLoading } = useAuth();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClocking, setIsClocking] = useState(false);
    const [isBreakAction, setIsBreakAction] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
                router.push('/dashboard');
                return;
            }
            fetchAttendance();
        }
    }, [authLoading, user, router]);

    const fetchAttendance = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/attendance');
            if (response.ok) {
                const data = await response.json();
                setAttendance(data.attendance || []);

                // Find today's attendance
                const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
                const todayRecord = (data.attendance || []).find((a: Attendance) => {
                    const attDate = format(new Date(a.date), 'yyyy-MM-dd');
                    return attDate === today &&
                        (typeof a.employee === 'object' ? a.employee._id === user?._id : a.employee === user?._id);
                });
                setTodayAttendance(todayRecord || null);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            setIsClocking(true);
            const response = await api.post('/attendance/clock-in', {});
            if (response.ok) {
                toast.success('Clocked in successfully');
                fetchAttendance();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to clock in');
            }
        } catch (error) {
            toast.error('Failed to clock in');
        } finally {
            setIsClocking(false);
        }
    };

    const handleClockOut = async () => {
        try {
            setIsClocking(true);
            const response = await api.post('/attendance/clock-out', {});
            if (response.ok) {
                toast.success('Clocked out successfully');
                fetchAttendance();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to clock out');
            }
        } catch (error) {
            toast.error('Failed to clock out');
        } finally {
            setIsClocking(false);
        }
    };

    const handleStartBreak = async (type: 'lunch' | 'tea' | 'other' = 'other') => {
        try {
            setIsBreakAction(true);
            const response = await api.post('/attendance/break/start', { type });
            if (response.ok) {
                toast.success('Break started');
                fetchAttendance();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to start break');
            }
        } catch (error) {
            toast.error('Failed to start break');
        } finally {
            setIsBreakAction(false);
        }
    };

    const handleEndBreak = async () => {
        try {
            setIsBreakAction(true);
            const response = await api.post('/attendance/break/end', {});
            if (response.ok) {
                toast.success('Break ended');
                fetchAttendance();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to end break');
            }
        } catch (error) {
            toast.error('Failed to end break');
        } finally {
            setIsBreakAction(false);
        }
    };

    const getActiveBreak = () => {
        if (!todayAttendance?.breaks) return null;
        return todayAttendance.breaks.find((b: any) => !b.endTime);
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            present: 'bg-green-500',
            absent: 'bg-red-500',
            late: 'bg-yellow-500',
            half_day: 'bg-orange-500',
            on_leave: 'bg-blue-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const calculateStats = () => {
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const late = attendance.filter(a => a.status === 'late').length;
        const onLeave = attendance.filter(a => a.status === 'on_leave').length;
        const avgHours = attendance
            .filter(a => a.workingHours || a.totalHours)
            .reduce((sum, a) => sum + (a.workingHours || a.totalHours || 0), 0) / (attendance.filter(a => a.workingHours || a.totalHours).length || 1);
        const totalOvertime = attendance
            .filter(a => a.overtimeHours)
            .reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

        return { total, present, late, onLeave, avgHours: avgHours.toFixed(1), totalOvertime: totalOvertime.toFixed(1) };
    };

    const stats = calculateStats();

    if (authLoading || isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading attendance...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(isAdmin ? '/dashboard/employees' : '/dashboard')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Back to Employees' : 'Back to Dashboard'}
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{isAdmin ? 'Employee Attendance' : 'My Attendance'}</h1>
                    <p className="text-gray-600">{isAdmin ? 'Track all employee work hours' : 'Track your work hours'}</p>
                </div>
            </div>

            {/* Clock In/Out Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Today's Attendance</CardTitle>
                    <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {todayAttendance ? (
                        <div className="space-y-4">
                            {/* Status and Late Indicator */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <LogIn className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Clock In</p>
                                            <p className="font-semibold">{format(new Date(todayAttendance.clockIn), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                    {todayAttendance.lateMinutes && todayAttendance.lateMinutes > 0 && (
                                        <>
                                            <div className="h-8 w-px bg-gray-300" />
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Late</p>
                                                    <p className="font-semibold text-yellow-600">{todayAttendance.lateMinutes} min</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {todayAttendance.clockOut && (
                                        <>
                                            <div className="h-8 w-px bg-gray-300" />
                                            <div className="flex items-center gap-2">
                                                <LogOut className="h-5 w-5 text-red-600" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Clock Out</p>
                                                    <p className="font-semibold">{format(new Date(todayAttendance.clockOut), 'h:mm a')}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <Badge className={getStatusBadge(todayAttendance.status)}>
                                    {todayAttendance.status.replace('_', ' ')}
                                </Badge>
                            </div>

                            {/* Hours Summary */}
                            {todayAttendance.clockOut && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-600">Total Hours</p>
                                        <p className="text-lg font-semibold">{todayAttendance.totalHours?.toFixed(2) || '0'}h</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Working Hours</p>
                                        <p className="text-lg font-semibold">{todayAttendance.workingHours?.toFixed(2) || todayAttendance.totalHours?.toFixed(2) || '0'}h</p>
                                    </div>
                                    {todayAttendance.breakDuration && todayAttendance.breakDuration > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-600">Break Time</p>
                                            <p className="text-lg font-semibold">{todayAttendance.breakDuration.toFixed(2)}h</p>
                                        </div>
                                    )}
                                    {todayAttendance.overtimeHours && todayAttendance.overtimeHours > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-600">Overtime</p>
                                            <p className="text-lg font-semibold text-orange-600">{todayAttendance.overtimeHours.toFixed(2)}h</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Break Management */}
                            {!todayAttendance.clockOut && (
                                <div className="space-y-3">
                                    {getActiveBreak() ? (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Coffee className="h-5 w-5 text-yellow-600" />
                                                    <div>
                                                        <p className="font-medium text-yellow-900">Break in progress</p>
                                                        <p className="text-sm text-yellow-700">
                                                            Started at {format(new Date(getActiveBreak()!.startTime), 'h:mm a')}
                                                            {getActiveBreak()!.type && ` (${getActiveBreak()!.type})`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={handleEndBreak} 
                                                    disabled={isBreakAction}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    End Break
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button 
                                                onClick={() => handleStartBreak('lunch')} 
                                                disabled={isBreakAction}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Coffee className="h-4 w-4 mr-2" />
                                                Start Lunch Break
                                            </Button>
                                            <Button 
                                                onClick={() => handleStartBreak('tea')} 
                                                disabled={isBreakAction}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Coffee className="h-4 w-4 mr-2" />
                                                Start Tea Break
                                            </Button>
                                        </div>
                                    )}
                                    <Button onClick={handleClockOut} disabled={isClocking} className="w-full">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Clock Out
                                    </Button>
                                </div>
                            )}

                            {/* Break History */}
                            {todayAttendance.breaks && todayAttendance.breaks.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Break History</p>
                                    <div className="space-y-2">
                                        {todayAttendance.breaks.map((breakItem: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <Coffee className="h-4 w-4 text-gray-400" />
                                                    <span className="capitalize">{breakItem.type || 'break'}</span>
                                                    <span className="text-gray-500">
                                                        {format(new Date(breakItem.startTime), 'h:mm a')}
                                                        {breakItem.endTime && ` - ${format(new Date(breakItem.endTime), 'h:mm a')}`}
                                                    </span>
                                                </div>
                                                {breakItem.duration && (
                                                    <span className="text-gray-600 font-medium">
                                                        {breakItem.duration.toFixed(2)}h
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">You haven't clocked in today</p>
                            <Button onClick={handleClockIn} disabled={isClocking} size="lg">
                                <LogIn className="h-5 w-5 mr-2" />
                                Clock In
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Present</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Late</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg Hours/Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgHours}</div>
                    </CardContent>
                </Card>
                {parseFloat(stats.totalOvertime) > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Overtime</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.totalOvertime}h</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Recent Attendance */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Attendance</CardTitle>
                    <CardDescription>Your attendance history</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {attendance.slice(0, 10).map((record) => (
                            <div key={record._id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                                        <p className="text-sm text-gray-600">
                                            {format(new Date(record.clockIn), 'h:mm a')}
                                            {record.clockOut && ` - ${format(new Date(record.clockOut), 'h:mm a')}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        {record.workingHours ? (
                                            <>
                                                <p className="text-sm text-gray-600">Working</p>
                                                <p className="font-semibold">{record.workingHours.toFixed(2)}h</p>
                                                {record.overtimeHours && record.overtimeHours > 0 && (
                                                    <p className="text-xs text-orange-600">+{record.overtimeHours.toFixed(2)}h OT</p>
                                                )}
                                            </>
                                        ) : record.totalHours ? (
                                            <>
                                                <p className="text-sm text-gray-600">Hours</p>
                                                <p className="font-semibold">{record.totalHours.toFixed(2)}h</p>
                                            </>
                                        ) : null}
                                        {record.lateMinutes && record.lateMinutes > 0 && (
                                            <p className="text-xs text-yellow-600">{record.lateMinutes}min late</p>
                                        )}
                                    </div>
                                    <Badge className={getStatusBadge(record.status)}>
                                        {record.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {attendance.length === 0 && (
                            <div className="text-center py-8 text-gray-600">
                                No attendance records found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
