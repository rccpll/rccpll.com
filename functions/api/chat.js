export async function onRequestPost(context) {
  // Use environment variables for security
  // Set these in Cloudflare Dashboard → Pages → Settings → Environment variables
  const telegramBotToken = context.env.TELEGRAM_BOT_TOKEN;
  const chatId = context.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !chatId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { message, contact } = await context.request.json();

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${message}\n\n${contact}`,
        }),
      }
    );

    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, message: 'Message sent successfully.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      const errorData = await response.text();
      return new Response(
        JSON.stringify({ success: false, error: 'Telegram API error', details: errorData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

