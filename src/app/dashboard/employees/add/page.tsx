'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AddEmployeePage() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
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
        emergencyContactPhone: ''
    });

    React.useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard');
        }
    }, [isAdmin, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            // Create user with a temporary random password
            const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

            const submitData: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: tempPassword, // Temporary password
                role: formData.role,
                department: formData.department || undefined,
                position: formData.position || undefined,
                hireDate: formData.hireDate || undefined,
                salary: formData.salary ? parseFloat(formData.salary) : undefined,
                address: formData.address || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                emergencyContact: (formData.emergencyContactName || formData.emergencyContactPhone) ? {
                    name: formData.emergencyContactName || undefined,
                    phone: formData.emergencyContactPhone || undefined
                } : undefined
            };

            const response = await api.post('/users/register', submitData);

            if (response.ok) {
                const data = await response.json();
                const userId = data.user._id;

                // Send password reset email
                const resetResponse = await api.post(`/password-reset/admin/reset/${userId}`, {});

                if (resetResponse.ok) {
                    const resetData = await resetResponse.json();
                    if (resetData.emailSent) {
                        toast.success(`Employee added! Password reset link sent to ${formData.email}`);
                    } else {
                        toast.success('Employee added successfully');
                        toast.info('Email service unavailable - please manually send password reset link');
                    }
                } else {
                    toast.success('Employee added successfully');
                    toast.warning('Failed to send password reset email');
                }

                router.push('/dashboard/employees');
            } else {
                const error = await response.json();
                // Display all error messages
                if (error.errors && Array.isArray(error.errors)) {
                    error.errors.forEach((err: string) => toast.error(err));
                } else {
                    toast.error(error.message || 'Failed to add employee');
                }
            }
        } catch (error) {
            toast.error('Failed to add employee');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin) {
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
                        onClick={() => router.push('/dashboard/employees')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Employees
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Add Employee</h1>
                        <p className="text-gray-600">Create a new employee account</p>
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
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                                        <Input
                                            id="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            required
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
                                {isLoading ? 'Adding Employee...' : 'Add Employee'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/employees')}
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
