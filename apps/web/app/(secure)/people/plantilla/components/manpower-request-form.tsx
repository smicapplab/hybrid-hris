'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/ui/numeric-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import { OrgUnit, Position, ManpowerRequest } from '@hybrid-hris/db/types';
import { 
    ManpowerRequestType, 
    EmploymentType, 
    RequestPriority 
} from '@hybrid-hris/domain';

interface ManpowerRequestFormProps {
    initialData?: ManpowerRequest | null;
    preOrgUnitId?: string | null;
    prePositionId?: string | null;
    returnTo?: string;
}

export function ManpowerRequestForm({ initialData, preOrgUnitId, prePositionId, returnTo }: ManpowerRequestFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const isEdit = !!initialData;
    const isReadOnly = isEdit && initialData?.status !== 'DRAFT';

    // Data State
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        orgUnitId: initialData?.orgUnitId || preOrgUnitId || '',
        positionId: initialData?.positionId || prePositionId || '',
        jobTitle: initialData?.jobTitle || '',
        requestType: (initialData?.requestType as ManpowerRequestType) || 'REPLACEMENT',
        quantity: initialData?.quantity || 1,
        employmentType: (initialData?.employmentType as EmploymentType) || 'REGULAR',
        priority: (initialData?.priority as RequestPriority) || 'NORMAL',
        jobSummary: initialData?.jobSummary || '',
        responsibilities: initialData?.responsibilities || '',
        qualifications: initialData?.qualifications || '',
        targetHireDate: initialData?.targetHireDate || '',
    });

    // Load org units
    useEffect(() => {
        apiFetch<OrgUnit[]>('/org-units')
            .then(data => {
                setOrgUnits(data || []);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    // Load positions for selected Org Unit
    useEffect(() => {
        if (formData.orgUnitId) {
            apiFetch<Position[]>(`/org-units/${formData.orgUnitId}/positions`)
                .then(setPositions)
                .catch(console.error);
        }
    }, [formData.orgUnitId]);

    const handlePositionChange = (val: string) => {
        const posId = val === 'none' ? '' : val;
        const pos = positions.find(p => p.id === posId);
        setFormData(prev => ({
            ...prev,
            positionId: posId,
            jobTitle: pos ? pos.title : prev.jobTitle
        }));
    };

    async function handleSubmit(submitForApproval: boolean) {
        if (!formData.orgUnitId || !formData.jobTitle) {
            toast({ title: 'Organization Unit and Job Title are required', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            let requestId = initialData?.id;

            if (isEdit) {
                await apiFetch(`/manpower/requests/${requestId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        ...formData,
                        positionId: formData.positionId || null,
                    }),
                });
            } else {
                const result = await apiFetch<ManpowerRequest[]>('/manpower/requests', {
                    method: 'POST',
                    body: JSON.stringify({
                        ...formData,
                        positionId: formData.positionId || undefined,
                    }),
                });
                requestId = result[0]?.id;
            }

            if (submitForApproval && requestId) {
                await apiFetch(`/manpower/requests/${requestId}/submit`, { method: 'POST' });
                toast({ title: isEdit ? 'Request updated and submitted' : 'Request created and submitted', variant: 'success' });
            } else {
                toast({ title: isEdit ? 'Request updated' : 'Draft request saved', variant: 'success' });
            }

            const redirectPath = returnTo || searchParams.get('returnTo') || '/people/plantilla';
            router.push(redirectPath);
            router.refresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to save request',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEdit ? (isReadOnly ? 'View Manpower Request' : 'Edit Manpower Request') : 'Create Manpower Request'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-muted-foreground">
                            {isEdit ? 'Details of your recruitment needs.' : 'Draft your recruitment needs and job posting details.'}
                        </p>
                        {isEdit && initialData && (
                            <Badge variant={initialData.status === 'APPROVED' ? 'default' : (initialData.status === 'REJECTED' ? 'destructive' : 'outline')}>
                                {initialData.status}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Request Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Request Metadata</CardTitle>
                            <CardDescription>Basic info about the hiring need.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Organization Unit</Label>
                                <Select 
                                    value={formData.orgUnitId} 
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, orgUnitId: val, positionId: '' }))}
                                    disabled={isEdit} // Usually Org Unit shouldn't change after creation
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orgUnits.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Request Type</Label>
                                <Select 
                                    value={formData.requestType} 
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, requestType: val as ManpowerRequestType }))}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW_HEADCOUNT">New Headcount</SelectItem>
                                        <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                                        <SelectItem value="PROJECT_BASED">Project Based</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Existing Position (Optional)</Label>
                                <Select value={formData.positionId || "none"} onValueChange={handlePositionChange} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select existing..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- New Role --</SelectItem>
                                        {positions.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <NumericInput 
                                        mode="int" 
                                        value={formData.quantity} 
                                        onChangeAction={(val) => setFormData(prev => ({ ...prev, quantity: val }))} 
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select 
                                        value={formData.priority} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val as RequestPriority }))}
                                        disabled={isReadOnly}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="NORMAL">Normal</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="URGENT">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Employment Type</Label>
                                <Select 
                                    value={formData.employmentType} 
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, employmentType: val as EmploymentType }))}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                        <SelectItem value="PROBATIONARY">Probationary</SelectItem>
                                        <SelectItem value="CONTRACTUAL">Contractual</SelectItem>
                                        <SelectItem value="CONSULTANT">Consultant</SelectItem>
                                        <SelectItem value="INTERN">Intern</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Target Hire Date</Label>
                                <Input 
                                    type="date" 
                                    value={formData.targetHireDate} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, targetHireDate: e.target.value }))} 
                                    disabled={isReadOnly}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Job Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Job Posting Details</CardTitle>
                            <CardDescription>This information will be synced to job boards like LinkedIn.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Official Job Title</Label>
                                <Input 
                                    className="text-lg font-bold h-12"
                                    value={formData.jobTitle} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                                    placeholder="e.g. Lead Software Engineer (Cloud Native)"
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Summary / Pitch</Label>
                                <RichTextEditor 
                                    value={formData.jobSummary} 
                                    onChangeAction={val => setFormData(prev => ({ ...prev, jobSummary: val }))}
                                    placeholder="A short hook to attract candidates..."
                                    minHeight="80px"
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Responsibilities</Label>
                                <RichTextEditor 
                                    value={formData.responsibilities} 
                                    onChangeAction={val => setFormData(prev => ({ ...prev, responsibilities: val }))}
                                    placeholder="What will they do on a daily basis?"
                                    minHeight="200px"
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Qualifications</Label>
                                <RichTextEditor 
                                    value={formData.qualifications} 
                                    onChangeAction={val => setFormData(prev => ({ ...prev, qualifications: val }))}
                                    placeholder="Required skills, experience, and education..."
                                    minHeight="200px"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {!isReadOnly && (
                        <div className="flex justify-end gap-3 pb-10">
                            <Button 
                                variant="outline" 
                                size="lg" 
                                disabled={submitting}
                                onClick={() => handleSubmit(false)}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isEdit ? 'Update Draft' : 'Save as Draft'}
                            </Button>
                            <Button 
                                size="lg" 
                                disabled={submitting}
                                onClick={() => handleSubmit(true)}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {isEdit ? 'Update & Submit' : 'Submit for Approval'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
