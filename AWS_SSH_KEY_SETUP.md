# Adding SSH Key to EC2 Instance via AWS Console

## Public Key
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFx+oO3VclzLEooIHWa8CpK1p9u6RYe8hJW79rcJmkpg collegefinder-deployment
```

## Method 1: AWS Systems Manager (Recommended)

### Step 1: Open AWS Systems Manager
1. Go to AWS Console → EC2 → Instances
2. Find your instance (IP: 35.154.13.140)
3. Select the instance
4. Click "Connect" button
5. Choose "Session Manager" tab
6. Click "Connect"

### Step 2: Run Commands in Session Manager
Once connected, run these commands:

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the public key to authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFx+oO3VclzLEooIHWa8CpK1p9u6RYe8hJW79rcJmkpg collegefinder-deployment" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Verify the key was added
cat ~/.ssh/authorized_keys
```

## Method 2: AWS Systems Manager Run Command

### Step 1: Open AWS Systems Manager
1. Go to AWS Console → Systems Manager → Run Command
2. Click "Run command"

### Step 2: Configure Command
1. **Command document**: Select "AWS-RunShellScript"
2. **Targets**: 
   - Select "Choose instances manually"
   - Select your EC2 instance (35.154.13.140)
3. **Command parameters**:
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFx+oO3VclzLEooIHWa8CpK1p9u6RYe8hJW79rcJmkpg collegefinder-deployment" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
4. Click "Run"

## Method 3: EC2 Instance Connect (Temporary)

1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Click "Connect" → "EC2 Instance Connect" tab
4. Click "Connect"
5. Run the same commands as Method 1

## Method 4: Using AWS CLI (If configured)

Run the provided script:
```bash
./add_ssh_key.sh
```

Or manually:
```bash
# Find instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=ip-address,Values=35.154.13.140" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

# Send command via SSM
aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters commands="[
    'mkdir -p ~/.ssh',
    'chmod 700 ~/.ssh',
    'echo \"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFx+oO3VclzLEooIHWa8CpK1p9u6RYe8hJW79rcJmkpg collegefinder-deployment\" >> ~/.ssh/authorized_keys',
    'chmod 600 ~/.ssh/authorized_keys'
  ]"
```

## Verify Connection

After adding the key, test the connection:
```bash
ssh -i CollegeApp_New.pem ubuntu@35.154.13.140
```

## Files Created
- **Private Key**: `CollegeApp_New.pem` (keep this secure!)
- **Public Key**: `CollegeApp_New.pem.pub`
- **Setup Script**: `add_ssh_key.sh`



