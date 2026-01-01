#!/bin/bash

# Script to add SSH public key to EC2 instance via AWS Systems Manager
# Make sure you have AWS CLI configured with appropriate permissions

# Configuration
INSTANCE_IP="35.154.13.140"
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFx+oO3VclzLEooIHWa8CpK1p9u6RYe8hJW79rcJmkpg collegefinder-deployment"

# First, find the instance ID by IP
echo "Finding instance ID for IP: $INSTANCE_IP"
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=ip-address,Values=$INSTANCE_IP" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo "Could not find instance. Trying alternative method..."
  # Alternative: List all instances and find by IP
  INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running" \
    --query "Reservations[*].Instances[?PublicIpAddress=='$INSTANCE_IP'].InstanceId" \
    --output text)
fi

if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo "Error: Could not find EC2 instance with IP $INSTANCE_IP"
  echo "Please provide the instance ID manually:"
  echo "aws ec2-instance-connect send-ssh-public-key \\"
  echo "  --instance-id <INSTANCE_ID> \\"
  echo "  --instance-os-user ubuntu \\"
  echo "  --ssh-public-key file://CollegeApp_New.pem.pub"
  exit 1
fi

echo "Found instance: $INSTANCE_ID"
echo "Adding SSH key to instance..."

# Method 1: Using EC2 Instance Connect (temporary, expires in 60 seconds)
aws ec2-instance-connect send-ssh-public-key \
  --instance-id "$INSTANCE_ID" \
  --instance-os-user ubuntu \
  --ssh-public-key file://CollegeApp_New.pem.pub

if [ $? -eq 0 ]; then
  echo "SSH key sent successfully! Now adding to authorized_keys..."
  
  # Connect and add to authorized_keys
  ssh -i CollegeApp_New.pem -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP \
    "echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Key added successfully!'"
else
  echo "Failed to send SSH key. Trying alternative method..."
  
  # Method 2: Using AWS Systems Manager (SSM)
  echo "Using AWS Systems Manager to add the key..."
  aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[
      'mkdir -p ~/.ssh',
      'chmod 700 ~/.ssh',
      'echo \"$PUBLIC_KEY\" >> ~/.ssh/authorized_keys',
      'chmod 600 ~/.ssh/authorized_keys',
      'echo \"SSH key added successfully\"'
    ]" \
    --output text
  
  echo "Command sent. Check the result in AWS Systems Manager console."
fi



