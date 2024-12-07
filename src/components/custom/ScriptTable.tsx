'use client';
import { useEffect, useState } from 'react';
import { getAvailableEC2Instances, controlEC2Instance } from '@/lib/aws-config';
import { EC2Instance } from '@/types/script-monitor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2Icon, PlusIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SavedInstance extends EC2Instance {
  saved: boolean;
}

export function ScriptTable() {
  const [instances, setInstances] = useState<SavedInstance[]>([]);
  const [availableInstances, setAvailableInstances] = useState<EC2Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchInstances = async () => {
    try {
      const data = await getAvailableEC2Instances();
      setAvailableInstances(data);
      // Only set instances that were previously saved
      setInstances(data.filter((instance: any) => 
        localStorage.getItem(`saved_instance_${instance.id}`)
      ).map((instance: any) => ({ ...instance, saved: true })));
    } catch (err) {
      setError('Failed to fetch EC2 instances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleInstanceAction = async (instanceId: string, action: 'start' | 'stop') => {
    setActionInProgress(instanceId);
    try {
      await controlEC2Instance(instanceId, action);
      toast.success(`Successfully ${action}ed instance ${instanceId}`);
      await fetchInstances();
    } catch (error) {
      toast.error(`Failed to ${action} instance ${instanceId}`);
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAddRow = () => {
    setInstances(prev => [...prev, { id: '', saved: false }]);
  };

  const handleSaveInstance = (instanceId: string) => {
    const instance = availableInstances.find(i => i.id === instanceId);
    if (instance) {
      localStorage.setItem(`saved_instance_${instanceId}`, 'true');
      setInstances(prev => 
        prev.map(i => i.saved ? i : { ...instance, saved: true })
      );
      toast.success('Instance added to monitoring');
    }
  };

  const handleDeleteRow = (instanceId: string) => {
    localStorage.removeItem(`saved_instance_${instanceId}`);
    setInstances(prev => prev.filter(i => i.id !== instanceId));
    toast.success('Instance removed from monitoring');
  };

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case 'running': return 'default';
      case 'stopped': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="bg-destructive/10 border border-destructive/50 p-4 rounded-lg text-destructive text-center">
      {error}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold tracking-tight">
          EC2 Instances
        </CardTitle>
        <Button onClick={handleAddRow} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Instance
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[160px]">Instance ID</TableHead>
              <TableHead className="w-[120px] hidden md:table-cell">Type</TableHead>
              <TableHead className="w-[120px]">State</TableHead>
              <TableHead className="flex-1">Public DNS</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
              <TableHead className="w-[80px] text-right">Remove</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No EC2 instances found
                </TableCell>
              </TableRow>
            ) : (
              instances.map((instance) => (
                <TableRow key={instance.id || 'new'} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-sm">
                    {instance.saved ? (
                      instance.id 
                    ) : (
                      <Select onValueChange={handleSaveInstance}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Instance" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInstances
                            .filter(i => !instances.some(saved => saved.id === i.id))
                            .map(i => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.id}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {instance.type || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {instance.state && (
                      <Badge 
                        variant={getStateBadgeVariant(instance.state)} 
                        className="capitalize"
                      >
                        {instance.state}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="table-cell">
                    {instance.publicDns || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {instance.saved && (
                      <Button 
                        variant={instance.state === 'running' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleInstanceAction(
                          instance.id, 
                          instance.state === 'running' ? 'stop' : 'start'
                        )}
                        disabled={actionInProgress === instance.id}
                        className="w-20"
                      >
                        {actionInProgress === instance.id ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          instance.state === 'running' ? 'Stop' : 'Start'
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {instance.saved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(instance.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
     
    </Card>
  );
}