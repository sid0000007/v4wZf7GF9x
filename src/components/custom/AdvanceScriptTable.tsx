"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getAvailableEC2Instances,
  controlEC2Instance,
  controlScript,
} from "@/lib/aws-config";
import { EC2Instance } from "@/types/script-monitor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "../ui/switch";

interface ManagedInstance extends EC2Instance {
  scriptStatus: "off" | "on" | "error";
}

export function AdvanceScriptTable() {
  const [instances, setInstances] = useState<ManagedInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      const data = await getAvailableEC2Instances();
      // Map EC2 instances to ManagedInstances with default script status
      const managedInstances: ManagedInstance[] = data.map((instance: any) => ({
        ...instance,
        scriptStatus: "off",
      }));
      setInstances(managedInstances);
    } catch (err) {
      setError("Failed to fetch EC2 instances");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchInstances, 15000);
    return () => clearInterval(interval);
  }, [fetchInstances]);

  const handleScriptToggle = async (instanceId: string, checked: boolean) => {
    const action = checked ? "start" : "stop";
    setActionInProgress(instanceId);
    try {
      await controlScript(instanceId, action, "C:\\monitoring");
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? { ...i, scriptStatus: checked ? "on" : "off" }
            : i
        )
      );
      toast.success(
        `Successfully ${action}ed script on instance ${instanceId}`
      );
    } catch (error) {
      // Revert the toggle state on error
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? { ...i, scriptStatus: checked ? "off" : "on" }
            : i
        )
      );
      toast.error(`Failed to ${action} script on instance ${instanceId}`);
      console.error(error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleInstanceAction = async (
    instanceId: string,
    action: "start" | "stop"
  ) => {
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

  const handleScriptAction = async (
    instanceId: string,
    action: "start" | "stop"
  ) => {
    setActionInProgress(instanceId);
    try {
      await controlScript(instanceId, action, "C:\\monitoring");
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? { ...i, scriptStatus: action === "start" ? "on" : "off" }
            : i
        )
      );
      toast.success(
        `Successfully ${action}ed script on instance ${instanceId}`
      );
    } catch (error) {
      toast.error(`Failed to ${action} script on instance ${instanceId}`);
      console.error(error);
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId ? { ...i, scriptStatus: "error" } : i
        )
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case "running":
        return "default";
      case "stopped":
        return "outline";
      default:
        return "outline";
    }
  };

  const getScriptStatusBadge = (status: string) => {
    switch (status) {
      case "on":
        return <Badge variant="outline">Running</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error)
    return (
      <div className="bg-destructive/10 border border-destructive/50 p-4 rounded-lg text-destructive text-center">
        {error}
      </div>
    );

  return (
    <div className="space-y-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Instance Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="min-w-[200px]">Instance ID</TableHead>
                  <TableHead className="min-w-[120px]">Type</TableHead>
                  <TableHead className="min-w-[120px]">State</TableHead>
                  <TableHead className="min-w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>{instance.id}</TableCell>
                    <TableCell>{instance.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStateBadgeVariant(instance.state!)}>
                        {instance.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={
                          instance.state === "running"
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          handleInstanceAction(
                            instance.id,
                            instance.state === "running" ? "stop" : "start"
                          )
                        }
                        disabled={
                          actionInProgress === instance.id ||
                          instance.state === "pending" || instance.state === "stopping"
                        }
                      >
                        {actionInProgress === instance.id ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : instance.state === "running" ? (
                          "Stop"
                        ) : (
                          "Start"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Script Management among Instances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="min-w-[200px]">Instance ID</TableHead>
                  <TableHead className="min-w-[120px]">Script Status</TableHead>
                  <TableHead className="min-w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>{instance.id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getScriptStatusBadge(instance.scriptStatus)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {actionInProgress === instance.id ? (
                        <Loader2Icon className="h-4 w-4 animate-spin ml-auto" />
                      ) : (
                        <Switch
                          checked={instance.scriptStatus === "on"}
                          onCheckedChange={(checked) =>
                            handleScriptToggle(instance.id, checked)
                          }
                          disabled={instance.state !== "running"}
                          className="ml-auto"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
