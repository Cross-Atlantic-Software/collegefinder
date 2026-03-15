# Backend deployment (e.g. EC2)

## SSH

```bash
ssh -i /path/to/your.pem ubuntu@YOUR_SERVER_IP
```

Keep the connection alive during long commands (e.g. `npm install`):

```bash
ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=5 -i /path/to/your.pem ubuntu@YOUR_SERVER_IP
```

## Installing dependencies on the server

SSH often drops during long-running `npm install`. Use one of these:

### Option 1: Run in foreground (with keep-alive SSH)

From your **local** terminal, use keep-alive so the session doesn’t time out:

```bash
ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=5 -i /path/to/your.pem ubuntu@YOUR_SERVER_IP
```

Then on the **server**:

```bash
cd /home/ubuntu/collegefinder/backend
npm install
pm2 restart collegefinder-backend
```

### Option 2: Use the install script (survives disconnect)

On the **server** (after SSH), run in background so it keeps going if you disconnect:

```bash
cd /home/ubuntu/collegefinder/backend
nohup bash scripts/install-deps-on-server.sh > npm-install.log 2>&1 &
tail -f npm-install.log
```

Press `Ctrl+C` to stop following the log; the install continues. Later, check the log and restart PM2 if needed:

```bash
cat npm-install.log
pm2 restart collegefinder-backend
```

### If `npm install` fails with ETIMEDOUT on the server

The deploy script retries up to 3 times and uses a longer npm fetch timeout. If it still fails (e.g. slow or restricted network to registry.npmjs.org), you can copy backend dependencies from your local machine:

```bash
# From your LOCAL machine (run in repo root):
rsync -avz --exclude=node_modules/.cache ./backend/node_modules/ ubuntu@YOUR_SERVER_IP:/home/ubuntu/collegefinder/backend/node_modules/
```

Then on the server: `pm2 restart collegefinder-backend`.

### Option 3: Use `screen` or `tmux`

On the **server**:

```bash
screen -S install   # or: tmux new -s install
cd /home/ubuntu/collegefinder/backend
npm install
pm2 restart collegefinder-backend
```

Detach with `Ctrl+A` then `D` (screen) or `Ctrl+B` then `D` (tmux). Reattach with `screen -r install` or `tmux attach -t install`.

## Full deploy (pull + npm install + build + restart)

From the **server** (after SSH). Use `nohup` if your SSH might drop:

```bash
cd /home/ubuntu/collegefinder
git pull
nohup bash backend/scripts/deploy-on-server.sh > deploy.log 2>&1 &
tail -f deploy.log
```

Or run in foreground (with keep-alive SSH):

```bash
cd /home/ubuntu/collegefinder && bash backend/scripts/deploy-on-server.sh
```

## After deploy

- Ensure `GOOGLE_API_KEY` is set in `backend/.env` for mock question generation.
- Ensure `exam_mock_prompts` table and prompts are set up (see `scripts/seedAllExamPrompts.js`).
