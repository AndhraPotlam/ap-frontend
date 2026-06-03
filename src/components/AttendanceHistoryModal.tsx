'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { X, ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Attendance, User } from '@/types';

interface AttendanceHistoryModalProps {
    employeeId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AttendanceHistoryModal({ employeeId, isOpen, onClose }: AttendanceHistoryModalProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [employee, setEmployee] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        on_leave: 0,
        half_day: 0,
        total_days: 0
    });

    useEffect(() => {
        if (isOpen && employeeId) {
            fetchEmployeeAndAttendance();
        }
    }, [isOpen, employeeId, currentDate]);

    const fetchEmployeeAndAttendance = async () => {
        setIsLoading(true);
        try {
            // Fetch employee details if not already fetched
            if (!employee) {
                const userRes = await api.get(`/users/${employeeId}`); // Assuming this endpoint exists or similar
                // If specific endpoint doesn't exist, we might need to fetch list and find. 
                // But for now let's assume we can get user details. 
                // If not, we can pass employee object as prop instead of ID.
                // Actually, let's fetch all users and find for safety as per EditUserModal pattern
                const usersRes = await api.get('/users');
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    const found = (data.users || []).find((u: User) => u._id === employeeId);
                    if (found) setEmployee(found);
                }
            }

            // Fetch attendance for the month
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);

            const attRes = await api.get(`/attendance/employee/${employeeId}?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);

            if (attRes.ok) {
                const data = await attRes.json();
                setAttendance(data.attendance || []);
                calculateStats(data.attendance || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (data: Attendance[]) => {
        const newStats = {
            present: 0,
            absent: 0,
            late: 0,
            on_leave: 0,
            half_day: 0,
            total_days: 0
        };

        data.forEach(att => {
            if (att.status === 'present') newStats.present++;
            else if (att.status === 'absent') newStats.absent++;
            else if (att.status === 'late') newStats.late++;
            else if (att.status === 'on_leave') newStats.on_leave++;
            else if (att.status === 'half_day') newStats.half_day++;
        });

        newStats.total_days = data.length;
        setStats(newStats);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present': return 'bg-green-500 hover:bg-green-600';
            case 'absent': return 'bg-red-500 hover:bg-red-600';
            case 'late': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'on_leave': return 'bg-blue-500 hover:bg-blue-600';
            case 'half_day': return 'bg-orange-500 hover:bg-orange-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <CardTitle>Attendance History</CardTitle>
                            {employee && (
                                <Badge variant="outline" className="text-base font-normal">
                                    {employee.firstName} {employee.lastName}
                                </Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>

                <div className="p-4 border-b flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="font-medium w-40 text-center text-lg">
                            {format(currentDate, 'MMMM yyyy')}
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>Present: {stats.present}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span>Late: {stats.late}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Absent: {stats.absent}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>Leave: {stats.on_leave}</span>
                        </div>
                    </div>
                </div>

                <CardContent className="flex-1 overflow-y-auto p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Clock In</th>
                                    <th className="px-6 py-3">Clock Out</th>
                                    <th className="px-6 py-3">Working Hours</th>
                                    <th className="px-6 py-3">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {attendance.length > 0 ? (
                                    attendance.map((record) => (
                                        <tr key={record._id} className="bg-white hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">
                                                {format(new Date(record.date), 'EEE, MMM d')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={getStatusBadge(record.status)}>
                                                    {record.status.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {record.clockIn ? format(new Date(record.clockIn), 'h:mm a') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {record.clockOut ? format(new Date(record.clockOut), 'h:mm a') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {record.workingHours ? `${record.workingHours.toFixed(2)}h` : '-'}
                                                {record.overtimeHours && record.overtimeHours > 0 ? (
                                                    <span className="text-xs text-orange-600 ml-2">
                                                        (+{record.overtimeHours.toFixed(2)} OT)
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">
                                                {record.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No attendance records found for this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
