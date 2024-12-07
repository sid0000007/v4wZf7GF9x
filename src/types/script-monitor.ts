export interface ScriptMonitorRow {
    id: string;
    scriptStatus: boolean;
    ec2Name: string;
    isRunning: boolean;
}

export interface EC2Instance {
  id: string;
  type?: string;
  state?: string;
  publicDns?: string;
}

export interface ScriptTableRow {
  id: string;
  scriptName: string;
  status: string;
  lastRun: string;
  ec2Instance: EC2Instance;
}

export type EC2Action = 'start' | 'stop';

export interface EC2ActionRequest {
  instanceId: string;
  action: EC2Action;
}