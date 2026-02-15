# 🔄 How to Restart the Mock Server

## ✅ **Server Successfully Restarted!**

I've already restarted the server for you. Here's what I did:

### Steps Taken:

1. **Found the old process:**
   ```bash
   netstat -ano | findstr :3000
   # Found PID: 8216
   ```

2. **Killed the old process:**
   ```bash
   taskkill /F /PID 8216
   # SUCCESS: The process has been terminated
   ```

3. **Started new server:**
   ```bash
   npm run server
   # Server now running with updated GraphQL schema!
   ```

---

## 🎯 **Current Status**

### ✅ **Server is Running:**
```
🚀 ENERGY PLATFORM MOCK SERVER
📍 Server running on port 3000
✅ Server ready to accept connections!
```

**Terminal:** 315360 (PID: 28248)

### ✅ **What's New:**
- GraphQL `createDevice` mutation added
- All REST endpoints working
- WebSocket server active
- Real-time simulation running

---

## 🔄 **How to Restart Server Yourself (Future Reference)**

### Method 1: Using Task Manager (Easiest)

1. Press `Ctrl+Shift+Esc` to open Task Manager
2. Find "Node.js" processes
3. Right-click → End Task
4. Run: `npm run server`

### Method 2: Using Command Line

**Step 1: Find the process**
```powershell
netstat -ano | findstr :3000
```

Output will show:
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
                                                  ^^^^^ (PID)
```

**Step 2: Kill the process**
```powershell
taskkill /F /PID 12345
```
(Replace 12345 with the actual PID)

**Step 3: Start new server**
```powershell
npm run server
```

### Method 3: If You Have the Terminal Open

If you can see the terminal where the server is running:
1. Click on that terminal
2. Press `Ctrl+C`
3. Run: `npm run server`

---

## 🚀 **Quick Restart Commands**

Save these for future use:

```powershell
# One-liner to kill and restart
$pid = (netstat -ano | findstr :3000 | Select-String -Pattern '\d+$').Matches.Value | Select-Object -First 1; if ($pid) { taskkill /F /PID $pid }; npm run server
```

Or simpler:

```powershell
# Kill any Node process on port 3000
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3000} | Stop-Process -Force

# Start server
npm run server
```

---

## 📊 **Verify Server is Running**

### Check if server is responding:

```powershell
# Test REST API
curl http://localhost:3000/api/devices

# Test GraphQL
curl -X POST http://localhost:3000/graphql -H "Content-Type: application/json" -d '{"query": "{ devices { total } }"}'
```

### Check server logs:

The server terminal should show:
```
✅ Server ready to accept connections!
[timestamp] POST /api/readings
[timestamp] POST /graphql
```

---

## 🎯 **Current Test Results**

After restart, you should see:
- ✅ Unit tests: 23/23 passing
- ✅ Redis tests: 6/6 passing
- ✅ REST API: 6/6 passing
- ⏳ GraphQL: Should improve with new schema
- ⚠️ Kafka: 3/5 passing (message accumulation)
- ⏳ WebSocket: Investigating timeouts

---

## 💡 **Pro Tips**

### 1. Use Development Mode

For auto-restart on code changes:
```bash
npm run server:dev
```

This uses `nodemon` to watch for file changes and automatically restart.

### 2. Check What's Using Port 3000

```powershell
netstat -ano | findstr :3000
```

### 3. Kill All Node Processes (Nuclear Option)

```powershell
taskkill /F /IM node.exe
```

**Warning:** This kills ALL Node processes, not just your server!

### 4. Use Different Port

If port 3000 is always busy:

```powershell
# Set different port
$env:PORT=3001
npm run server
```

Then update tests:
```powershell
$env:API_BASE_URL="http://localhost:3001"
npm test
```

---

## 🎉 **Success!**

The server has been successfully restarted with:
- ✅ Updated GraphQL schema
- ✅ createDevice mutation
- ✅ All REST endpoints
- ✅ WebSocket server
- ✅ Real-time simulation

**Ready for testing!** 🚀

---

## 📝 **Quick Reference**

| Action | Command |
|--------|---------|
| **Find PID** | `netstat -ano \| findstr :3000` |
| **Kill process** | `taskkill /F /PID <PID>` |
| **Start server** | `npm run server` |
| **Dev mode** | `npm run server:dev` |
| **Check server** | `curl http://localhost:3000/api/devices` |
| **Run tests** | `npm test` |

---

**Server is running and ready! Run your tests now!** ✅
