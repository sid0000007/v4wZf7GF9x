export const getAvailableEC2Instances = async () => {
  try {
    const response = await fetch('/api/ec2-instances');
    if (!response.ok) {
      throw new Error('Failed to fetch EC2 instances');
    }
    const data = await response.json();
    return data.instances;
  } catch (error) {
    console.error("Error fetching EC2 instances:", error);
    return [];
  }
};


export const controlEC2Instance = async (instanceId: string, action: 'start' | 'stop') => {
  try {
    const response = await fetch('/api/ec2-instances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instanceId, action }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${action} EC2 instance`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error ${action}ing EC2 instance:`, error);
    throw error;
  }
};

export const controlec2instance_advnace = async (
  instanceId: string, 
  action: 'start' | 'stop',
  scriptPath?: string
) => {
  try {
    const response = await fetch('/api/scriptRunners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        instanceId, 
        action,
        scriptPath 
      }),
    });

    console.log(response);
    
    if (!response.ok) {
      throw new Error(`Failed to ${action} EC2 instance and script`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error ${action}ing EC2 instance and script:`, error);
    throw error;
  }
};