// Vercel serverless function that proxies Polar webhooks to Supabase Edge Function
// This allows Polar to use https://shyftcut.vercel.app/api/webhooks/polar
// while the actual handler is in Supabase Edge Functions

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, webhook-signature, x-webhook-signature',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get Supabase project URL from environment
    // Vercel exposes env vars without VITE_ prefix for serverless functions
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('SUPABASE_URL not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract project ref from Supabase URL (e.g., https://xxxxx.supabase.co)
    const supabaseBaseUrl = supabaseUrl.replace(/\/$/, '');
    const webhookUrl = `${supabaseBaseUrl}/functions/v1/webhook-polar`;

    // Forward the request body
    const body = await req.text();

    // Forward all headers (especially webhook-signature)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward webhook signature headers
    const signatureHeader = req.headers.get('webhook-signature') || req.headers.get('x-webhook-signature');
    if (signatureHeader) {
      headers['webhook-signature'] = signatureHeader;
    }

    // Forward the request to Supabase Edge Function
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
    });

    // Forward the response
    const responseText = await response.text();
    
    return new Response(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Webhook proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
