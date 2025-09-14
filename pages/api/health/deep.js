// import { withSentry } from '@sentry/nextjs';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Deep Health Check Endpoint
 * Performs comprehensive health checks of all system components
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  const correlationId = uuidv4();
  const startTime = Date.now();

  console.log(`🏥 [${correlationId}] Starting deep health check`);

  const results = {
    status: 'healthy',
    correlationId,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.4.0',
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // Basic server health
  results.checks.server = {
    status: 'healthy',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    nodejs: process.version
  };

  // Database connectivity check
  try {
    console.log(`🗄️ [${correlationId}] Checking Supabase connection...`);
    const supabaseCheckStart = Date.now();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);

      const dbResponseTime = Date.now() - supabaseCheckStart;

      if (error) {
        console.error(`❌ [${correlationId}] Database check failed:`, error);
        results.checks.database = {
          status: 'unhealthy',
          error: error.message,
          responseTime: `${dbResponseTime}ms`
        };
        results.status = 'degraded';
      } else {
        console.log(`✅ [${correlationId}] Database check passed (${dbResponseTime}ms)`);
        results.checks.database = {
          status: 'healthy',
          responseTime: `${dbResponseTime}ms`,
          connection: 'active'
        };
      }
    } else {
      results.checks.database = {
        status: 'configuration_missing',
        message: 'Database configuration not found'
      };
      results.status = 'degraded';
    }
  } catch (error) {
    console.error(`💥 [${correlationId}] Database check exception:`, error);
    results.checks.database = {
      status: 'error',
      error: error.message
    };
    results.status = 'degraded';
  }

  // AI Providers health check
  try {
    console.log(`🤖 [${correlationId}] Checking AI providers...`);

    // Claude API health check
    const claudeCheckStart = Date.now();
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'health' }]
          })
        });

        const claudeResponseTime = Date.now() - claudeCheckStart;

        if (claudeResponse.ok || claudeResponse.status === 400) {
          // 400 is expected for minimal request, means API is responding
          console.log(`✅ [${correlationId}] Claude API healthy (${claudeResponseTime}ms)`);
          results.checks.claude_api = {
            status: 'healthy',
            responseTime: `${claudeResponseTime}ms`
          };
        } else {
          console.error(`⚠️ [${correlationId}] Claude API responded with ${claudeResponse.status}`);
          results.checks.claude_api = {
            status: 'degraded',
            responseTime: `${claudeResponseTime}ms`,
            httpStatus: claudeResponse.status
          };
        }
      } catch (error) {
        console.error(`❌ [${correlationId}] Claude API check failed:`, error.message);
        results.checks.claude_api = {
          status: 'unhealthy',
          error: error.message
        };
      }
    } else {
      results.checks.claude_api = {
        status: 'configuration_missing',
        message: 'Claude API key not configured'
      };
    }

    // OpenAI API health check (fallback provider)
    const openaiCheckStart = Date.now();
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });

        const openaiResponseTime = Date.now() - openaiCheckStart;

        if (openaiResponse.ok) {
          console.log(`✅ [${correlationId}] OpenAI API healthy (${openaiResponseTime}ms)`);
          results.checks.openai_api = {
            status: 'healthy',
            responseTime: `${openaiResponseTime}ms`
          };
        } else {
          console.error(`⚠️ [${correlationId}] OpenAI API responded with ${openaiResponse.status}`);
          results.checks.openai_api = {
            status: 'degraded',
            responseTime: `${openaiResponseTime}ms`,
            httpStatus: openaiResponse.status
          };
        }
      } catch (error) {
        console.error(`❌ [${correlationId}] OpenAI API check failed:`, error.message);
        results.checks.openai_api = {
          status: 'unhealthy',
          error: error.message
        };
        results.status = 'degraded';
      }
    } else {
      results.checks.openai_api = {
        status: 'configuration_missing',
        message: 'OpenAI API key not configured'
      };
    }
  } catch (error) {
    console.error(`💥 [${correlationId}] AI providers check exception:`, error);
    results.checks.ai_providers = {
      status: 'error',
      error: error.message
    };
    results.status = 'degraded';
  }

  // Cloudflare Workers health check
  try {
    console.log(`⚡ [${correlationId}] Checking Cloudflare Workers...`);

    if (process.env.CLOUDFLARE_WORKER_URL) {
      const workerCheckStart = Date.now();
      const workerResponse = await fetch(`${process.env.CLOUDFLARE_WORKER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const workerResponseTime = Date.now() - workerCheckStart;

      if (workerResponse.ok) {
        console.log(`✅ [${correlationId}] Cloudflare Workers healthy (${workerResponseTime}ms)`);
        results.checks.cloudflare_workers = {
          status: 'healthy',
          responseTime: `${workerResponseTime}ms`
        };
      } else {
        console.error(`⚠️ [${correlationId}] Cloudflare Workers responded with ${workerResponse.status}`);
        results.checks.cloudflare_workers = {
          status: 'degraded',
          responseTime: `${workerResponseTime}ms`,
          httpStatus: workerResponse.status
        };
      }
    } else {
      results.checks.cloudflare_workers = {
        status: 'configuration_missing',
        message: 'Cloudflare Worker URL not configured'
      };
    }
  } catch (error) {
    console.error(`❌ [${correlationId}] Cloudflare Workers check failed:`, error.message);
    results.checks.cloudflare_workers = {
      status: 'unhealthy',
      error: error.message
    };
    results.status = 'degraded';
  }

  // Authentication provider check (Clerk)
  results.checks.authentication = {
    status: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'configured' : 'configuration_missing',
    provider: 'clerk'
  };

  // Calculate total response time
  const totalResponseTime = Date.now() - startTime;
  results.totalResponseTime = `${totalResponseTime}ms`;

  console.log(`🏁 [${correlationId}] Deep health check completed in ${totalResponseTime}ms - Status: ${results.status}`);

  // Determine final status
  const unhealthyChecks = Object.values(results.checks).filter(check =>
    check.status === 'unhealthy' || check.status === 'error'
  );

  if (unhealthyChecks.length > 0) {
    results.status = 'unhealthy';
    res.status(503).json(results);
  } else if (results.status === 'degraded') {
    res.status(200).json(results);
  } else {
    res.status(200).json(results);
  }
}

export default handler;