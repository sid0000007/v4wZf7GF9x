import { NextResponse } from 'next/server';
import { EC2Client, DescribeInstancesCommand, StartInstancesCommand, StopInstancesCommand } from "@aws-sdk/client-ec2";
import { EC2Instance } from '@/types/script-monitor';

const ec2Client = new EC2Client({ 
  region: process.env.NEXT_PUBLIC_AWS_REGION
}); 

export async function GET() {
  try {
    const client = new EC2Client({ 
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    const command = new DescribeInstancesCommand({});
    const response = await client.send(command);
    
    const instances = response.Reservations?.flatMap(reservation => 
      reservation.Instances?.map(instance => ({
        id: instance.InstanceId || '',
        type: instance.InstanceType || '',
        state: instance.State?.Name || '',
        publicDns: instance.PublicDnsName || ''
      })) || []
    ) || [];

    return NextResponse.json({ instances });
  } catch (error) {
    console.error("Error fetching EC2 instances:", error);
    return NextResponse.json({ error: "Failed to fetch EC2 instances" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { instanceId, action } = await request.json();
    
    if (!instanceId || !action) {
      return NextResponse.json(
        { error: "Instance ID and action are required" },
        { status: 400 }
      );
    }

    let command;
    if (action === 'start') {
      command = new StartInstancesCommand({ InstanceIds: [instanceId] });
    } else if (action === 'stop') {
      command = new StopInstancesCommand({ InstanceIds: [instanceId] });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start' or 'stop'" },
        { status: 400 }
      );
    }

    await ec2Client.send(command);
    return NextResponse.json({ success: true, message: `Instance ${action} request sent` });
  } catch (error) {
    console.error(`Error ing EC2 instance:`, error);
    return NextResponse.json(
      { error: `Failed to EC2 instance` },
      { status: 500 }
    );
  }
}

