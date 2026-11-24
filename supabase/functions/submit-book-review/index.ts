const siteOrigin = Deno.env.get('SITE_ORIGIN') ?? '';
const corsHeaders = {
  'Access-Control-Allow-Origin': siteOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } });
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!siteOrigin || request.headers.get('Origin') !== siteOrigin) return json({ error: 'Origin not allowed' }, 403);
  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const bookTitle = typeof payload.bookTitle === 'string' ? payload.bookTitle.trim() : '';
  const nickname = typeof payload.nickname === 'string' ? payload.nickname.trim() : '';
  const reviewText = typeof payload.reviewText === 'string' ? payload.reviewText.trim() : '';
  const rating = payload.rating === null || payload.rating === '' ? null : Number(payload.rating);
  if (!bookTitle || bookTitle.length > 160 || !nickname || nickname.length > 32 || !reviewText || reviewText.length > 2000 || (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))) {
    return json({ error: '닉네임은 32자, 리뷰는 2,000자까지 입력해 주세요.' }, 400);
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  let serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (secretKeys) { try { serviceKey = JSON.parse(secretKeys).default ?? serviceKey; } catch { return json({ error: 'Supabase secret 설정을 확인해 주세요.' }, 500); } }
  const emailUrl = Deno.env.get('EMAIL_WEB_APP_URL');
  const bridgeToken = Deno.env.get('EMAIL_BRIDGE_TOKEN');
  if (!supabaseUrl || !serviceKey || !emailUrl || !bridgeToken) return json({ error: '서버 설정이 아직 끝나지 않았습니다.' }, 500);
  const inserted = await fetch(`${supabaseUrl}/rest/v1/book_reviews`, {
    method: 'POST', headers: { apikey: serviceKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ book_title: bookTitle, nickname, rating, review_text: reviewText }),
  });
  if (!inserted.ok) return json({ error: '리뷰 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
  let emailSent = false;
  try {
    const mail = await fetch(emailUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: bridgeToken, bookTitle, nickname, rating, reviewText }) });
    const result = await mail.json();
    emailSent = mail.ok && result.ok === true;
  } catch { /* The public review remains saved if Gmail is temporarily unavailable. */ }
  return json({ ok: true, emailSent });
});
