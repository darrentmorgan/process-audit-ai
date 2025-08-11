#!/bin/bash
# Development server management script

case "$1" in
  start)
    echo "🚀 Starting development servers..."
    
    # Start Cloudflare Worker
    cd workers
    nohup npm run dev > worker.log 2>&1 & echo $! > worker.pid
    echo "✅ Cloudflare Worker starting (PID: $(cat worker.pid))"
    
    # Start Next.js
    cd ..
    nohup npm run dev > nextjs.log 2>&1 & echo $! > nextjs.pid
    echo "✅ Next.js starting (PID: $(cat nextjs.pid))"
    
    echo "⏳ Waiting for servers to start..."
    sleep 5
    
    # Test servers
    curl -s http://localhost:3000 > /dev/null && echo "✅ Next.js ready at http://localhost:3000" || echo "❌ Next.js failed to start"
    curl -s http://localhost:8787/health > /dev/null && echo "✅ Worker ready at http://localhost:8787" || echo "❌ Worker failed to start"
    ;;
    
  stop)
    echo "🛑 Stopping development servers..."
    
    # Stop Next.js
    if [ -f nextjs.pid ]; then
      kill $(cat nextjs.pid) 2>/dev/null && echo "✅ Next.js stopped" || echo "⚠️ Next.js was not running"
      rm -f nextjs.pid
    fi
    
    # Stop Worker
    if [ -f workers/worker.pid ]; then
      kill $(cat workers/worker.pid) 2>/dev/null && echo "✅ Worker stopped" || echo "⚠️ Worker was not running"
      rm -f workers/worker.pid
    fi
    
    # Fallback: kill by process name
    pkill -f "next dev" 2>/dev/null
    pkill -f "wrangler dev" 2>/dev/null
    ;;
    
  status)
    echo "📊 Server Status:"
    
    # Check processes
    if ps aux | grep -E "(next dev|wrangler dev)" | grep -v grep > /dev/null; then
      ps aux | grep -E "(next dev|wrangler dev)" | grep -v grep | while read line; do
        echo "🟢 Running: $line"
      done
    else
      echo "🔴 No development servers running"
    fi
    
    echo ""
    echo "🌐 Testing endpoints:"
    curl -s http://localhost:3000 > /dev/null && echo "✅ Next.js: http://localhost:3000" || echo "❌ Next.js not responding"
    curl -s http://localhost:8787/health > /dev/null && echo "✅ Worker: http://localhost:8787" || echo "❌ Worker not responding"
    ;;
    
  logs)
    echo "📋 Recent logs:"
    echo ""
    echo "=== Next.js logs ==="
    tail -10 nextjs.log 2>/dev/null || echo "No Next.js logs found"
    echo ""
    echo "=== Worker logs ==="
    tail -10 workers/worker.log 2>/dev/null || echo "No Worker logs found"
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start  - Start both development servers in background"
    echo "  stop   - Stop all development servers"
    echo "  status - Show server status and test endpoints"
    echo "  logs   - Show recent logs from both servers"
    exit 1
    ;;
esac