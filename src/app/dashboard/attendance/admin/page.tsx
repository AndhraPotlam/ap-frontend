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
import { User, Attendance } from '@/types';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle, XCircle, Calendar, Users as UsersIcon, TrendingUp, TrendingDown, CalendarRange, Search, Download, Edit2, Trash2, History, AlertCircle, Timer, Coffee } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { toast } from 'sonner';

export default function AdminAttendancePage() {
    const router = useRouter();
    const { user: currentUser, isAdmin } = useAuth();
    const [employees, setEmployees] = useState<User[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Date range state
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [dateRangePreset, setDateRangePreset] = useState('today');

    const [isLoading, setIsLoading] = useState(true);
    const [departmentFilter, setDepartmentFilter] = useState('all');

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

    // Selection state for bulk operations
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

    // Helper function to get date range based on preset
    const getDateRangeFromPreset = (preset: string) => {
        const today = new Date();
        let start: Date, end: Date;

        switch (preset) {
            case 'today':
                start = end = today;
                break;
            case 'yesterday':
                start = end = subDays(today, 1);
                break;
            case 'thisWeek':
                start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
                end = endOfWeek(today, { weekStartsOn: 1 });
                break;
            case 'lastWeek':
                const lastWeek = subWeeks(today, 1);
                start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                break;
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                const lastMonth = subMonths(today, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                break;
            default:
                start = end = today;
        }

        return {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        };
    };

    // Handle preset change
    const handlePresetChange = (preset: string) => {
        setDateRangePreset(preset);
        if (preset !== 'custom') {
            const { startDate: newStart, endDate: newEnd } = getDateRangeFromPreset(preset);
            setStartDate(newStart);
            setEndDate(newEnd);
            setSelectedDate(newStart); // Keep selectedDate for backward compatibility
        }
    };

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [isAdmin, startDate, endDate, router]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            // Fetch all employees
            const empResponse = await api.get('/users');
            if (empResponse.ok) {
                const empData = await empResponse.json();
                const employeeList = (empData.users || []).filter((u: User) =>
                    u.role === 'employee' || u.role === 'admin'
                );
                setEmployees(employeeList);
            }

            // Fetch attendance for the selected date range
            const attResponse = await api.get('/attendance', {
                startDate,
                endDate
            });
            if (attResponse.ok) {
                const attData = await attResponse.json();
                setAttendance(attData.attendance || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAttendance = async (employeeId: string, status: string) => {
        try {
            const response = await api.post('/attendance/admin/mark', {
                employeeId,
                date: selectedDate,
                status,
                clockIn: new Date().toISOString()
            });

            if (response.ok) {
                toast.success(`Attendance marked as ${status}`);
                fetchData();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to mark attendance');
            }
        } catch (error) {
            toast.error('Failed to mark attendance');
        }
    };

    const handleUpdateAttendance = async (attendanceId: string, status: string) => {
        try {
            const response = await api.put(`/attendance/${attendanceId}`, {
                status
            });

            if (response.ok) {
                toast.success(`Attendance updated to ${status}`);
                fetchData();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to update attendance');
            }
        } catch (error) {
            toast.error('Failed to update attendance');
        }
    };

    // Check if single date is selected (editable mode)
    const isSingleDate = startDate === endDate;

    const handleBulkMarkPresent = async () => {
        const absentEmployees = employees.filter(emp => {
            return !attendance.some(att => {
                const attEmp = typeof att.employee === 'object' ? att.employee._id : att.employee;
                return attEmp === emp._id;
            });
        });

        if (absentEmployees.length === 0) {
            toast.info('All employees already marked');
            return;
        }

        try {
            const response = await api.post('/attendance/admin/bulk', {
                employeeIds: absentEmployees.map(e => e._id),
                date: selectedDate,
                status: 'present'
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                fetchData();
            } else {
                toast.error('Failed to bulk mark attendance');
            }
        } catch (error) {
            toast.error('Failed to bulk mark attendance');
        }
    };

    const getEmployeeAttendance = (employeeId: string) => {
        return attendance.find(att => {
            const attEmp = typeof att.employee === 'object' ? att.employee._id : att.employee;
            return attEmp === employeeId;
        });
    };

    // Bulk selection handlers
    const handleSelectAll = () => {
        if (selectedEmployees.size === filteredEmployees.length) {
            setSelectedEmployees(new Set());
        } else {
            setSelectedEmployees(new Set(filteredEmployees.map(e => e._id)));
        }
    };

    const handleToggleSelect = (employeeId: string) => {
        const newSelection = new Set(selectedEmployees);
        if (newSelection.has(employeeId)) {
            newSelection.delete(employeeId);
        } else {
            newSelection.add(employeeId);
        }
        setSelectedEmployees(newSelection);
    };

    // Export to CSV
    const handleExportCSV = () => {
        const csvHeaders = ['Employee ID', 'Name', 'Department', 'Position', 'Status', 'Clock In', 'Clock Out', 'Working Hours', 'Late Minutes', 'Overtime Hours', 'Breaks', 'Monthly Attendance'];
        const csvRows = filteredEmployees.map(emp => {
            const empAtt = getEmployeeAttendanceForDate(emp._id);
            const monthlyStats = employeeMonthlyAttendance.get(emp._id);
            return [
                emp.employeeId || '',
                `${emp.firstName} ${emp.lastName}`,
                emp.department || '',
                emp.position || '',
                empAtt ? empAtt.status.replace('_', ' ') : 'Absent',
                empAtt && empAtt.clockIn ? format(new Date(empAtt.clockIn), 'h:mm a') : '',
                empAtt && empAtt.clockOut ? format(new Date(empAtt.clockOut), 'h:mm a') : '',
                empAtt?.workingHours?.toFixed(2) || empAtt?.totalHours?.toFixed(2) || '0',
                empAtt?.lateMinutes || '0',
                empAtt?.overtimeHours?.toFixed(2) || '0',
                empAtt?.breaks?.length || '0',
                monthlyStats ? `${monthlyStats.present}/${monthlyStats.total}` : '0/0'
            ];
        });

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${format(new Date(startDate), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Attendance exported successfully');
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

    const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

    // Filter attendance records for the selected marking date only (needed for filtering)
    const attendanceForMarkingDate = attendance.filter(att => {
        const attDate = new Date(att.date);
        const markDate = new Date(startDate); // Use startDate as the marking date
        return attDate.toDateString() === markDate.toDateString();
    });

    // Apply all filters: department, search, and status
    let filteredEmployees = departmentFilter === 'all'
        ? employees
        : employees.filter(e => e.department === departmentFilter);

    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEmployees = filteredEmployees.filter(e =>
            e.firstName.toLowerCase().includes(query) ||
            e.lastName.toLowerCase().includes(query) ||
            e.employeeId?.toLowerCase().includes(query) ||
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(query)
        );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
        filteredEmployees = filteredEmployees.filter(e => {
            const empAtt = attendanceForMarkingDate.find(att => {
                const attEmp = typeof att.employee === 'object' ? att.employee._id : att.employee;
                return attEmp === e._id;
            });

            if (statusFilter === 'absent') {
                return !empAtt; // No attendance record means absent
            }
            return empAtt && empAtt.status === statusFilter;
        });
    }


    // Calculate monthly attendance per employee for display
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const employeeMonthlyAttendance = new Map<string, { present: number; total: number }>();

    // Get all attendance records for current month
    const monthlyAttendance = attendance.filter(att => {
        const attDate = new Date(att.date);
        return attDate >= monthStart && attDate <= monthEnd;
    });

    // Calculate per-employee monthly stats
    filteredEmployees.forEach(emp => {
        const empAttendance = monthlyAttendance.filter(att => {
            const empId = typeof att.employee === 'object' ? att.employee._id : att.employee;
            return empId === emp._id;
        });

        const presentDays = empAttendance.filter(att =>
            att.status === 'present' || att.status === 'late'
        ).length;

        employeeMonthlyAttendance.set(emp._id, {
            present: presentDays,
            total: empAttendance.length
        });
    });

    // Calculate stats based on the selected marking date (not date range)
    const stats = {
        total: filteredEmployees.length,
        present: attendanceForMarkingDate.filter(att => att.status === 'present').length,
        absent: filteredEmployees.length - attendanceForMarkingDate.length,
        onLeave: attendanceForMarkingDate.filter(att => att.status === 'on_leave').length,
        late: attendanceForMarkingDate.filter(att => att.status === 'late').length,
        halfDay: attendanceForMarkingDate.filter(att => att.status === 'half_day').length,
        totalRecords: attendanceForMarkingDate.length,
        attendanceRate: filteredEmployees.length > 0
            ? Math.round((attendanceForMarkingDate.filter(att => att.status === 'present' || att.status === 'late').length / filteredEmployees.length) * 100)
            : 0
    };

    // Calculate per-employee status counts for date range
    const employeeStatusCounts = new Map<string, {
        present: number;
        late: number;
        absent: number;
        half_day: number;
        on_leave: number;
        total: number;
    }>();

    if (!isSingleDate) {
        // Get attendance records for the date range
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999);

        const rangeAttendance = attendance.filter(att => {
            const attDate = new Date(att.date);
            return attDate >= rangeStart && attDate <= rangeEnd;
        });

        // Calculate counts for each employee
        employees.forEach(emp => {
            const empAttendance = rangeAttendance.filter(att => {
                const empId = typeof att.employee === 'object' ? att.employee._id : att.employee;
                return empId === emp._id;
            });

            const counts = {
                present: empAttendance.filter(a => a.status === 'present').length,
                late: empAttendance.filter(a => a.status === 'late').length,
                absent: 0, // Will calculate based on total days
                half_day: empAttendance.filter(a => a.status === 'half_day').length,
                on_leave: empAttendance.filter(a => a.status === 'on_leave').length,
                total: empAttendance.length
            };

            // Calculate absent days (days in range without attendance record)
            const daysInRange = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            counts.absent = daysInRange - counts.total;

            employeeStatusCounts.set(emp._id, counts);
        });
    }

    // Helper to get employee attendance for the marking date
    const getEmployeeAttendanceForDate = (employeeId: string) => {
        return attendanceForMarkingDate.find(att => {
            const attEmp = typeof att.employee === 'object' ? att.employee._id : att.employee;
            return attEmp === employeeId;
        });
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/employees')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Employees
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Admin Attendance Management</h1>
                        <p className="text-gray-600">Mark and manage employee attendance</p>
                    </div>
                </div>

                {/* Date Range Selection */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {/* Preset Buttons */}
                            <div>
                                <Label className="mb-2 block">Quick Date Range</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={dateRangePreset === 'today' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePresetChange('today')}
                                    >
                                        Today
                                    </Button>
                                    <Button
                                        variant={dateRangePreset === 'yesterday' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePresetChange('yesterday')}
                                    >
                                        Yesterday
                                    </Button>
                                    <Button
                                        variant={dateRangePreset === 'thisWeek' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePresetChange('thisWeek')}
                                    >
                                        This Week
                                    </Button>
                                    <Button
                                        variant={dateRangePreset === 'lastWeek' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePresetChange('lastWeek')}
                                    >
                                        Last Week
                                    </Button>
                                    <Button
                                        variant={dateRangePreset === 'thisMonth' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePresetChange('thisMonth')}
                                    >
                                        This Month
                                    </Button>
                                    <Button
                                        variant={dateRangePreset === 'lastMonth' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePresetChange('lastMonth')}
                                    >
                                        Last Month
                                    </Button>
                                    <Button
                                        variant={dateRangePreset === 'custom' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setDateRangePreset('custom')}
                                    >
                                        <CalendarRange className="h-4 w-4 mr-1" />
                                        Custom
                                    </Button>
                                </div>
                            </div>

                            {/* Custom Date Range Inputs */}
                            {dateRangePreset === 'custom' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Selected Range Display */}
                            <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {startDate === endDate
                                            ? format(new Date(startDate), 'MMMM d, yyyy')
                                            : `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
                                        }
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleBulkMarkPresent}
                                    disabled={dateRangePreset !== 'today'}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark All Present
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search Bar */}
                        <div className="md:col-span-2">
                            <Label>Search Employees</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by name or employee ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Department Filter */}
                        <div>
                            <Label>Department</Label>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="on_leave">On Leave</SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                    <SelectItem value="half_day">Half Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Active Filters & Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            {(searchQuery || departmentFilter !== 'all' || statusFilter !== 'all') && (
                                <>
                                    <span className="text-sm text-gray-600">Active filters:</span>
                                    {searchQuery && (
                                        <Badge variant="secondary" className="gap-1">
                                            Search: {searchQuery}
                                            <XCircle
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => setSearchQuery('')}
                                            />
                                        </Badge>
                                    )}
                                    {departmentFilter !== 'all' && (
                                        <Badge variant="secondary" className="gap-1">
                                            Dept: {departmentFilter}
                                            <XCircle
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => setDepartmentFilter('all')}
                                            />
                                        </Badge>
                                    )}
                                    {statusFilter !== 'all' && (
                                        <Badge variant="secondary" className="gap-1">
                                            Status: {statusFilter.replace('_', ' ')}
                                            <XCircle
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => setStatusFilter('all')}
                                            />
                                        </Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setDepartmentFilter('all');
                                            setStatusFilter('all');
                                        }}
                                    >
                                        Clear all
                                    </Button>
                                </>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExportCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Table - Only show for date range */}
            {!isSingleDate && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Attendance Summary</CardTitle>
                        <CardDescription>
                            Status counts for each employee from {format(new Date(startDate), 'MMM d, yyyy')} to {format(new Date(endDate), 'MMM d, yyyy')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-medium text-gray-700">Employee</th>
                                        <th className="text-center p-3 font-medium text-gray-700">Present</th>
                                        <th className="text-center p-3 font-medium text-gray-700">Late</th>
                                        <th className="text-center p-3 font-medium text-gray-700">Absent</th>
                                        <th className="text-center p-3 font-medium text-gray-700">Half Day</th>
                                        <th className="text-center p-3 font-medium text-gray-700">On Leave</th>
                                        <th className="text-center p-3 font-medium text-gray-700">Total Days</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((employee) => {
                                        const counts = employeeStatusCounts.get(employee._id) || {
                                            present: 0,
                                            late: 0,
                                            absent: 0,
                                            half_day: 0,
                                            on_leave: 0,
                                            total: 0
                                        };
                                        const totalDays = counts.present + counts.late + counts.absent + counts.half_day + counts.on_leave;

                                        return (
                                            <tr key={employee._id} className="border-b hover:bg-gray-50">
                                                <td className="p-3">
                                                    <div>
                                                        <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                                                        <p className="text-xs text-gray-500">{employee.department} • {employee.position}</p>
                                                    </div>
                                                </td>
                                                <td className="text-center p-3">
                                                    <span className="font-semibold text-green-600">{counts.present}</span>
                                                </td>
                                                <td className="text-center p-3">
                                                    <span className="font-semibold text-yellow-600">{counts.late}</span>
                                                </td>
                                                <td className="text-center p-3">
                                                    <span className="font-semibold text-red-600">{counts.absent}</span>
                                                </td>
                                                <td className="text-center p-3">
                                                    <span className="font-semibold text-orange-600">{counts.half_day}</span>
                                                </td>
                                                <td className="text-center p-3">
                                                    <span className="font-semibold text-blue-600">{counts.on_leave}</span>
                                                </td>
                                                <td className="text-center p-3">
                                                    <span className="font-semibold">{totalDays}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center p-8 text-gray-500">
                                                No employees found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk Actions Bar */}
            {selectedEmployees.size > 0 && (
                <Card className="mb-4 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{selectedEmployees.size} employee(s) selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                        for (const empId of selectedEmployees) {
                                            await handleMarkAttendance(empId, 'present');
                                        }
                                        setSelectedEmployees(new Set());
                                    }}
                                    className="border-green-500 text-green-600 hover:bg-green-50"
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Present
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                        for (const empId of selectedEmployees) {
                                            await handleMarkAttendance(empId, 'absent');
                                        }
                                        setSelectedEmployees(new Set());
                                    }}
                                    className="border-red-500 text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Mark Absent
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                        for (const empId of selectedEmployees) {
                                            await handleMarkAttendance(empId, 'on_leave');
                                        }
                                        setSelectedEmployees(new Set());
                                    }}
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Mark Leave
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedEmployees(new Set())}
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Employee List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Employee Attendance - {format(new Date(startDate), 'MMMM d, yyyy')}</CardTitle>
                        {filteredEmployees.length > 0 && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-600">
                                    Select All ({selectedEmployees.size} selected)
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredEmployees.map((employee) => {
                                const empAttendance = getEmployeeAttendanceForDate(employee._id);
                                const monthlyStats = employeeMonthlyAttendance.get(employee._id);
                                const isSelected = selectedEmployees.has(employee._id);

                                return (
                                    <div
                                        key={employee._id}
                                        className={`flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-blue-300' : ''
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(employee._id)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">
                                                            {employee.firstName} {employee.lastName}
                                                        </p>
                                                        {empAttendance && !isSingleDate && (
                                                            <Badge
                                                                className={`${getStatusBadge(empAttendance.status)} text-white text-xs`}
                                                            >
                                                                {empAttendance.status.replace('_', ' ')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-sm text-gray-600">
                                                            {employee.department} • {employee.position}
                                                        </p>
                                                        {monthlyStats && monthlyStats.total > 0 && (
                                                            <p className="text-xs text-gray-500">
                                                                📊 {monthlyStats.present}/{monthlyStats.total} days this month
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isSingleDate ? (
                                                // Single date mode: Show current status with edit option
                                                empAttendance ? (
                                                    <div className="flex flex-col items-end gap-2">
                                                        {editingEmployeeId === employee._id ? (
                                                            // Edit mode: Show dropdown
                                                            <div className="flex items-center gap-2">
                                                                <Select
                                                                    value={empAttendance.status}
                                                                    onValueChange={(value) => {
                                                                        handleUpdateAttendance(empAttendance._id, value);
                                                                        setEditingEmployeeId(null);
                                                                    }}
                                                                    onOpenChange={(open) => {
                                                                        if (!open) {
                                                                            setEditingEmployeeId(null);
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="w-[150px]">
                                                                        <SelectValue>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-2 h-2 rounded-full ${getStatusBadge(empAttendance.status)}`} />
                                                                                <span className="capitalize">{empAttendance.status.replace('_', ' ')}</span>
                                                                            </div>
                                                                        </SelectValue>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="present">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                                                Present
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="late">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                                                Late
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="absent">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                                                Absent
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="half_day">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                                                Half Day
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="on_leave">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                                                On Leave
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setEditingEmployeeId(null)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            // View mode: Show status badge with edit button
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    className={`${getStatusBadge(empAttendance.status)} text-white`}
                                                                >
                                                                    {empAttendance.status.replace('_', ' ')}
                                                                </Badge>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setEditingEmployeeId(employee._id)}
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Edit2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            {empAttendance.clockIn && (
                                                                <span className="text-sm text-gray-600">
                                                                    {format(new Date(empAttendance.clockIn), 'h:mm a')}
                                                                </span>
                                                            )}
                                                            {empAttendance.clockOut && (
                                                                <span className="text-sm text-gray-600">
                                                                    - {format(new Date(empAttendance.clockOut), 'h:mm a')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            {empAttendance.lateMinutes && empAttendance.lateMinutes > 0 && (
                                                                <span className="text-yellow-600 flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {empAttendance.lateMinutes}min late
                                                                </span>
                                                            )}
                                                            {empAttendance.workingHours && (
                                                                <span className="text-gray-600 flex items-center gap-1">
                                                                    <Timer className="h-3 w-3" />
                                                                    {empAttendance.workingHours.toFixed(2)}h
                                                                </span>
                                                            )}
                                                            {empAttendance.overtimeHours && empAttendance.overtimeHours > 0 && (
                                                                <span className="text-orange-600 flex items-center gap-1">
                                                                    <TrendingUp className="h-3 w-3" />
                                                                    +{empAttendance.overtimeHours.toFixed(2)}h OT
                                                                </span>
                                                            )}
                                                            {empAttendance.breaks && empAttendance.breaks.length > 0 && (
                                                                <span className="text-blue-600 flex items-center gap-1">
                                                                    <Coffee className="h-3 w-3" />
                                                                    {empAttendance.breaks.length} break{empAttendance.breaks.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // No attendance: Show "Mark Attendance" button
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">Not marked</span>
                                                        {editingEmployeeId === employee._id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        handleMarkAttendance(employee._id, value);
                                                                        setEditingEmployeeId(null);
                                                                    }}
                                                                    onOpenChange={(open) => {
                                                                        if (!open) {
                                                                            setEditingEmployeeId(null);
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="w-[150px]">
                                                                        <SelectValue placeholder="Select status" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="present">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                                                Present
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="late">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                                                Late
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="absent">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                                                Absent
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="half_day">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                                                Half Day
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="on_leave">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                                                On Leave
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setEditingEmployeeId(null)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setEditingEmployeeId(employee._id)}
                                                            >
                                                                <Edit2 className="h-4 w-4 mr-1" />
                                                                Mark
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            ) : (
                                                // Date range mode: Show read-only or limited options
                                                empAttendance ? (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge
                                                            className={`${getStatusBadge(empAttendance.status)} text-white text-xs`}
                                                        >
                                                            {empAttendance.status.replace('_', ' ')}
                                                        </Badge>
                                                        <div className="flex items-center gap-2">
                                                            {empAttendance.clockIn && (
                                                                <span className="text-sm text-gray-600">
                                                                    {format(new Date(empAttendance.clockIn), 'h:mm a')}
                                                                </span>
                                                            )}
                                                            {empAttendance.clockOut && (
                                                                <span className="text-sm text-gray-600">
                                                                    - {format(new Date(empAttendance.clockOut), 'h:mm a')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleMarkAttendance(employee._id, 'present')}
                                                            className="border-green-500 text-green-600 hover:bg-green-50"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Present
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleMarkAttendance(employee._id, 'absent')}
                                                            className="border-red-500 text-red-600 hover:bg-red-50"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Absent
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleMarkAttendance(employee._id, 'on_leave')}
                                                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            Leave
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredEmployees.length === 0 && (
                                <div className="text-center py-8 text-gray-600">
                                    <UsersIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p>No employees found</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
