'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import api from '@/lib/api';
import { Search, UserPlus, Users, ArrowLeft, Mail, Phone, Briefcase, Clock, Calendar } from 'lucide-react';

export default function EmployeesPage() {
    const router = useRouter();
    const { user, isAdmin, isLoading: authLoading } = useAuth();
    const [employees, setEmployees] = useState<User[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (!authLoading) {
            if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
                router.push('/dashboard');
                return;
            }
            fetchEmployees();
        }
    }, [authLoading, user, router]);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/users');
            if (response.ok) {
                const data = await response.json();
                const allUsers = data.users || [];
                // Filter to show only employees and admins
                const employeeList = allUsers.filter((u: User) =>
                    u.role === 'employee' || u.role === 'admin'
                );
                setEmployees(employeeList);
                setFilteredEmployees(employeeList);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let filtered = employees;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.firstName.toLowerCase().includes(query) ||
                emp.lastName.toLowerCase().includes(query) ||
                emp.email.toLowerCase().includes(query) ||
                emp.employeeId?.toLowerCase().includes(query)
            );
        }

        // Department filter
        if (departmentFilter !== 'all') {
            filtered = filtered.filter(emp => emp.department === departmentFilter);
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(emp => emp.role === roleFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter(emp => emp.isActive === isActive);
        }

        setFilteredEmployees(filtered);
    }, [searchQuery, departmentFilter, roleFilter, statusFilter, employees]);

    const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-500';
            case 'employee': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading employees...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Employee Management</h1>
                        <p className="text-gray-600">Manage your team and attendance</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard/employees/shifts')}
                            >
                                <Clock className="h-4 w-4 mr-2" />
                                Shifts
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard/attendance/admin')}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Attendance
                            </Button>
                            <Button onClick={() => router.push('/dashboard/employees/add')}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Employee
                            </Button>
                        </>
                    )}
                    {!isAdmin && (
                        <Button onClick={() => router.push('/dashboard/attendance')}>
                            <Clock className="h-4 w-4 mr-2" />
                            My Attendance
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employees.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {employees.filter(e => e.isActive).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {employees.filter(e => e.role === 'admin').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Departments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{departments.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">No employees found</p>
                    </div>
                ) : (
                    filteredEmployees.map((employee) => (
                        <Card
                            key={employee._id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => router.push(`/dashboard/employees/${employee._id}`)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {employee.firstName} {employee.lastName}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {employee.position || 'No position set'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Badge className={getRoleBadgeColor(employee.role)}>
                                            {employee.role}
                                        </Badge>
                                        {employee.isActive !== false && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    {employee.employeeId && (
                                        <div className="flex items-center text-gray-600">
                                            <Briefcase className="h-4 w-4 mr-2" />
                                            <span>ID: {employee.employeeId}</span>
                                        </div>
                                    )}
                                    {employee.department && (
                                        <div className="flex items-center text-gray-600">
                                            <Users className="h-4 w-4 mr-2" />
                                            <span>{employee.department}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-600">
                                        <Mail className="h-4 w-4 mr-2" />
                                        <span className="truncate">{employee.email}</span>
                                    </div>
                                    {employee.phoneNumber && (
                                        <div className="flex items-center text-gray-600">
                                            <Phone className="h-4 w-4 mr-2" />
                                            <span>{employee.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="mt-4 pt-4 border-t flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/employees/${employee._id}/edit`);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/employees/${employee._id}`);
                                            }}
                                        >
                                            View
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div >
    );
}
