'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Attendance } from '@/types';
import api from '@/lib/api';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Users, Edit, UserX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function EmployeeProfilePage() {
    const router = useRouter();
    const params = useParams();
    const { user: currentUser, isAdmin } = useAuth();
    const [employee, setEmployee] = useState<User | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const employeeId = params.id as string;

    useEffect(() => {
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee')) {
            fetchEmployee();
            fetchAttendance();
        } else {
            router.push('/dashboard');
        }
    }, [currentUser, employeeId, router]);

    const fetchEmployee = async () => {
        try {
            const response = await api.get('/users');
            if (response.ok) {
                const data = await response.json();
                const emp = (data.users || []).find((u: User) => u._id === employeeId);
                if (emp) {
                    setEmployee(emp);
                } else {
                    toast.error('Employee not found');
                    router.push('/dashboard/employees');
                }
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await api.get(`/attendance/employee/${employeeId}`);
            if (response.ok) {
                const data = await response.json();
                setAttendance(data.attendance || []);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const handleToggleStatus = async () => {
        if (!employee) return;

        try {
            const response = await api.put(`/users/${employeeId}`, {
                isActive: !employee.isActive
            });

            if (response.ok) {
                toast.success(`Employee ${employee.isActive ? 'deactivated' : 'activated'} successfully`);
                fetchEmployee();
            } else {
                toast.error('Failed to update employee status');
            }
        } catch (error) {
            toast.error('Failed to update employee status');
        }
    };

    const calculateAttendanceStats = () => {
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const onLeave = attendance.filter(a => a.status === 'on_leave').length;
        const avgHours = attendance
            .filter(a => a.totalHours)
            .reduce((sum, a) => sum + (a.totalHours || 0), 0) / (attendance.filter(a => a.totalHours).length || 1);

        return { total, present, onLeave, avgHours: avgHours.toFixed(1), attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : '0' };
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading employee...</div>
            </div>
        );
    }

    if (!employee) {
        return null;
    }

    const stats = calculateAttendanceStats();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/dashboard/employees')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {employee.firstName} {employee.lastName}
                            </h1>
                            <p className="text-gray-600">{employee.position || 'No position set'}</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/dashboard/employees/${employeeId}/edit`)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant={employee.isActive ? 'destructive' : 'default'}
                                onClick={handleToggleStatus}
                            >
                                {employee.isActive ? (
                                    <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Activate
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                    <Badge className={employee.isActive ? 'bg-green-500' : 'bg-red-500'}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className="ml-2 bg-blue-500">{employee.role}</Badge>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="employment">Employment</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-medium">{employee.email}</p>
                                        </div>
                                    </div>
                                    {employee.phoneNumber && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-600">Phone</p>
                                                <p className="font-medium">{employee.phoneNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                    {employee.address && (
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-600">Address</p>
                                                <p className="font-medium">{employee.address}</p>
                                            </div>
                                        </div>
                                    )}
                                    {employee.dateOfBirth && (
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-600">Date of Birth</p>
                                                <p className="font-medium">{format(new Date(employee.dateOfBirth), 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Emergency Contact</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {employee.emergencyContact?.name || employee.emergencyContact?.phone ? (
                                        <>
                                            {employee.emergencyContact.name && (
                                                <div>
                                                    <p className="text-sm text-gray-600">Name</p>
                                                    <p className="font-medium">{employee.emergencyContact.name}</p>
                                                </div>
                                            )}
                                            {employee.emergencyContact.phone && (
                                                <div>
                                                    <p className="text-sm text-gray-600">Phone</p>
                                                    <p className="font-medium">{employee.emergencyContact.phone}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-500">No emergency contact set</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Employment Tab */}
                    <TabsContent value="employment" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {employee.employeeId && (
                                        <div>
                                            <p className="text-sm text-gray-600">Employee ID</p>
                                            <p className="font-medium">{employee.employeeId}</p>
                                        </div>
                                    )}
                                    {employee.department && (
                                        <div className="flex items-center gap-3">
                                            <Users className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-600">Department</p>
                                                <p className="font-medium">{employee.department}</p>
                                            </div>
                                        </div>
                                    )}
                                    {employee.position && (
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-600">Position</p>
                                                <p className="font-medium">{employee.position}</p>
                                            </div>
                                        </div>
                                    )}
                                    {employee.hireDate && (
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-600">Hire Date</p>
                                                <p className="font-medium">{format(new Date(employee.hireDate), 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {isAdmin && employee.salary && (
                                        <div>
                                            <p className="text-sm text-gray-600">Monthly Salary</p>
                                            <p className="font-medium">₹{employee.salary.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Attendance Tab */}
                    <TabsContent value="attendance" className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
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
                        </div>

                        {/* Recent Attendance */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Attendance</CardTitle>
                                <CardDescription>Last 10 attendance records</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {attendance.slice(0, 10).map((record) => (
                                        <div key={record._id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                                                <p className="text-sm text-gray-600">
                                                    {format(new Date(record.clockIn), 'h:mm a')}
                                                    {record.clockOut && ` - ${format(new Date(record.clockOut), 'h:mm a')}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {record.totalHours && (
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">Hours</p>
                                                        <p className="font-semibold">{record.totalHours.toFixed(2)}</p>
                                                    </div>
                                                )}
                                                <Badge>{record.status.replace('_', ' ')}</Badge>
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
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
