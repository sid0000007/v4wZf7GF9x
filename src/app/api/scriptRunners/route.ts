import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { NextResponse } from "next/server";

const ssmClient = new SSMClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  },
});

const ec2Client = new EC2Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  },
});

async function checkInstanceRequirements(instanceId: string) {
  const describeCommand = new DescribeInstancesCommand({
    InstanceIds: [instanceId],
  });

  const response = await ec2Client.send(describeCommand);
  const instance = response.Reservations?.[0]?.Instances?.[0];

  if (!instance) {
    throw new Error(`Instance ${instanceId} not found`);
  }

  if (instance.State?.Name !== "running") {
    throw new Error(
      `Instance ${instanceId} is not running. Current state: ${instance.State?.Name}. Please start the instance first.`
    );
  }

  return true;
}

export async function POST(request: Request) {
  try {
    console.log("Received Request Body:", await request.clone().text());

    const { instanceId, action, scriptPath } = await request.json();
    console.log("Script Management Request:", {
      instanceId,
      action,
      scriptPath,
    });

    if (!instanceId || !action) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    await checkInstanceRequirements(instanceId);

    // Note: the script path is required as the EC2 machines do have sripts saved in them already

    const nodeCommands = {
      start: [
        "cd C:\\monitoring",
        "dir",
        "where node",
        "node --version",
        "node monitor.js start",
      ],

      stop: ["cd C:\\monitoring", "node monitor.js stop"],
    };

    const remoteCommand = new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: "AWS-RunPowerShellScript",
      Parameters: {
        commands: nodeCommands[action as "start" | "stop"],
      },
    });

    try {
      const response = await ssmClient.send(remoteCommand);
      return NextResponse.json({
        success: true,
        commandId: response.Command?.CommandId,
        message: `Script ${action}ed successfully`,
      });
    } catch (error: any) {
      console.error(`Detailed Error (${action} action):`, {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          error: `Failed to ${action} script`,
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unhandled Script Management Error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: `Unexpected error: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
