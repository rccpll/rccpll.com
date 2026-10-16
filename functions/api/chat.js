// POST /api/chat — forwards the contact form to Telegram.
// Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Cloudflare Dashboard →
// Pages → Settings → Environment variables.

const MAX_MESSAGE = 2000;
const MAX_CONTACT = 500;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isSameOrigin(request) {
  try {
    return new URL(request.headers.get('Origin')).host === request.headers.get('Host');
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  // Only accept requests made by this site's own pages.
  if (!isSameOrigin(request)) {
    return json({ success: false, error: 'Forbidden' }, 403);
  }
  if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) {
    return json({ success: false, error: 'Expected JSON' }, 415);
  }

  const raw = await request.text();
  if (raw.length > MAX_MESSAGE + MAX_CONTACT + 200) {
    return json({ success: false, error: 'Too long' }, 413);
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, 400);
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const contact = typeof body?.contact === 'string' ? body.contact.trim() : '';
  if (!message || !contact || message.length > MAX_MESSAGE || contact.length > MAX_CONTACT) {
    return json({ success: false, error: 'Invalid message' }, 400);
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ success: false, error: 'Server configuration error' }, 500);
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: `[rccpll.com]\n${message}\n\nContact: ${contact}`,
          link_preview_options: { is_disabled: true },
        }),
      }
    );

    if (!response.ok) {
      // Log details for `wrangler pages deployment tail`, don't send them to the browser.
      console.error('Telegram API error', response.status, await response.text());
      return json({ success: false, error: 'Could not send' }, 502);
    }
    return json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error(error);
    return json({ success: false, error: 'Could not send' }, 502);
  }
}
