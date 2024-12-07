import { EC2Client, StartInstancesCommand, StopInstancesCommand } from "@aws-sdk/client-ec2";
import { SSMClient,  SendCommandCommand } from "@aws-sdk/client-ssm";

import { NextResponse } from "next/server";
const ec2Client = new EC2Client({ region: process.env.NEXT_PUBLIC_AWS_REGION });
const ssmClient = new SSMClient({ region: process.env.NEXT_PUBLIC_AWS_REGION });

export async function POST(request: Request) {
  try {
    const { instanceId, action, scriptPath } = await request.json();
    console.log('Instance management request', instanceId, action, scriptPath);
    
    // Start/Stop Instance
    const instanceCommand = action === 'start' 
      ? new StartInstancesCommand({ InstanceIds: [instanceId] })
      : new StopInstancesCommand({ InstanceIds: [instanceId] });
    
    console.log('Instance command', instanceCommand);
    await ec2Client.send(instanceCommand);

    // Send remote script command
    const remoteCommand = new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: "AWS-RunPowerShellScript",
      Parameters: {
        commands: [
        //   `node ${scriptPath || 'C:\\monitoring\\monitor.js'}`
          `node ${ 'C:\\monitoring\\monitor.js'}`
        ]
      }
    });

    console.log('Remote command', remoteCommand);
    await ssmClient.send(remoteCommand);

    console.log('Instance management request sent');
    return NextResponse.json({ 
      success: true, 
      message: `Instance ${action} request sent` 
    });
  } catch (error) {
    console.error('Instance management error:', error);
    return NextResponse.json({ error: 'Failed to manage instance' }, { status: 500 });
  }
}