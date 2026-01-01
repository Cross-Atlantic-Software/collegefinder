# Simple SSH Key Setup - One Command

## ✅ Easiest Method: AWS Systems Manager Session Manager

### Step 1: Connect via AWS Console
1. Go to **AWS Console → EC2 → Instances**
2. Select your instance (IP: 35.154.13.140)
3. Click **"Connect"** button
4. Choose **"Session Manager"** tab
5. Click **"Connect"**

### Step 2: Run This Single Command
Copy and paste this entire command:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFx+oO3VclzLEooIHWa8CpK1p9u6RYe8hJW79rcJmkpg collegefinder-deployment" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "✅ SSH key added!" && tail -1 ~/.ssh/authorized_keys
```

**That's it!** This single command:
- Creates the `.ssh` directory if needed
- Sets correct permissions
- Adds your public key to `authorized_keys`
- Verifies it was added

### Step 3: Test Connection
After running the command, test from your local machine:

```bash
ssh -i CollegeApp_New.pem ubuntu@35.154.13.140
```

---

## Alternative: AWS Systems Manager Run Command

If you prefer not to use Session Manager:

1. Go to **AWS Console → Systems Manager → Run Command**
2. Click **"Run command"**
3. Select **"AWS-RunShellScript"**
4. Select your instance
5. Paste this in the command box:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFx+oO3VclzLEooIHWa8CpK1p9u6RYe8hJW79rcJmkpg collegefinder-deployment" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys
```

6. Click **"Run"**

---

**Yes, one command is enough!** Just use AWS Systems Manager Session Manager - no AWS CLI configuration needed.



