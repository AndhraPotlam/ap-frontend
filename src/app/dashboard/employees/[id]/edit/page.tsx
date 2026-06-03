'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/types';

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const { user: currentUser, isAdmin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [employee, setEmployee] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'employee',
        department: '',
        position: '',
        hireDate: '',
        salary: '',
        address: '',
        dateOfBirth: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        isActive: true
    });

    const employeeId = params.id as string;

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard');
            return;
        }
        fetchEmployee();
    }, [isAdmin, employeeId, router]);

    const fetchEmployee = async () => {
        try {
            const response = await api.get('/users');
            if (response.ok) {
                const data = await response.json();
                const emp = (data.users || []).find((u: User) => u._id === employeeId);
                if (emp) {
                    setEmployee(emp);
                    setFormData({
                        firstName: emp.firstName || '',
                        lastName: emp.lastName || '',
                        email: emp.email || '',
                        phoneNumber: emp.phoneNumber || '',
                        role: emp.role || 'employee',
                        department: emp.department || '',
                        position: emp.position || '',
                        hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '',
                        salary: emp.salary?.toString() || '',
                        address: emp.address || '',
                        dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
                        emergencyContactName: emp.emergencyContact?.name || '',
                        emergencyContactPhone: emp.emergencyContact?.phone || '',
                        isActive: emp.isActive !== false
                    });
                } else {
                    toast.error('Employee not found');
                    router.push('/dashboard/employees');
                }
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
            toast.error('Failed to load employee');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const submitData: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                // Don't send email and phoneNumber - they can't be changed
                role: formData.role,
                department: formData.department || undefined,
                position: formData.position || undefined,
                hireDate: formData.hireDate || undefined,
                salary: formData.salary ? parseFloat(formData.salary) : undefined,
                address: formData.address || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                isActive: formData.isActive,
                emergencyContact: (formData.emergencyContactName || formData.emergencyContactPhone) ? {
                    name: formData.emergencyContactName || undefined,
                    phone: formData.emergencyContactPhone || undefined
                } : undefined
            };

            const response = await api.put(`/users/${employeeId}`, submitData);

            if (response.ok) {
                toast.success('Employee updated successfully');
                router.push(`/dashboard/employees/${employeeId}`);
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to update employee');
            }
        } catch (error) {
            toast.error('Failed to update employee');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin || !employee) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/employees/${employeeId}`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Employee</h1>
                        <p className="text-gray-600">Update employee information</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email * (Cannot be changed)</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phoneNumber">Phone Number (Cannot be changed)</Label>
                                        <Input
                                            id="phoneNumber"
                                            value={formData.phoneNumber}
                                            disabled
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employment Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="role">Role *</Label>
                                        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="employee">Employee</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="department">Department</Label>
                                        <Input
                                            id="department"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="e.g., Kitchen, Front Desk"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="position">Position</Label>
                                        <Input
                                            id="position"
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            placeholder="e.g., Chef, Manager"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="hireDate">Hire Date</Label>
                                        <Input
                                            id="hireDate"
                                            type="date"
                                            value={formData.hireDate}
                                            onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="salary">Monthly Salary</Label>
                                        <Input
                                            id="salary"
                                            type="number"
                                            value={formData.salary}
                                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.isActive ? 'active' : 'inactive'}
                                            onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Emergency Contact */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Emergency Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="emergencyContactName">Contact Name</Label>
                                        <Input
                                            id="emergencyContactName"
                                            value={formData.emergencyContactName}
                                            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                                        <Input
                                            id="emergencyContactPhone"
                                            value={formData.emergencyContactPhone}
                                            onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button type="submit" disabled={isLoading} className="flex-1">
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/employees/${employeeId}`)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
