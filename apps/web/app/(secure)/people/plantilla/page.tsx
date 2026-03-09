'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ManpowerRequestsList } from './components/manpower-requests-list';
import { PlantillaInventoryList } from './components/plantilla-inventory-list';
import { useRouter, usePathname } from 'next/navigation';

export default function PlantillaPage() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Plantilla & Recruitment</h1>
                    <p className="text-muted-foreground">
                        Manage headcount, manpower requests, and job postings.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.push(`/people/plantilla/requests/new?returnTo=${encodeURIComponent(pathname)}`)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Manpower Request
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="requests" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="requests">Manpower Requests</TabsTrigger>
                    <TabsTrigger value="inventory">Plantilla Inventory</TabsTrigger>
                    <TabsTrigger value="postings" disabled>Job Postings (Coming Soon)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manpower Requests</CardTitle>
                            <CardDescription>
                                Track and approve requests for new headcount or replacements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManpowerRequestsList />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plantilla Inventory</CardTitle>
                            <CardDescription>
                                Overview of approved headcount and vacancies across all departments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PlantillaInventoryList />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
