const REVIEW_RECIPIENT = 'nghiahanghia205@gmail.com';

// Run this once in the Apps Script editor, then copy the execution log value
// into the Supabase Edge Function secret EMAIL_BRIDGE_TOKEN.
function setupBridgeToken() {
  const token = Utilities.getUuid() + Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('BRIDGE_TOKEN', token);
  console.log('EMAIL_BRIDGE_TOKEN=' + token);
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty('BRIDGE_TOKEN');
    if (!expected || data.token !== expected) return output({ ok: false });
    const bookTitle = clean(data.bookTitle, 160);
    const nickname = clean(data.nickname, 32);
    const reviewText = String(data.reviewText || '').trim();
    const rating = data.rating == null ? '선택 안 함' : Number(data.rating);
    if (!bookTitle || !nickname || !reviewText || reviewText.length > 2000 || (rating !== '선택 안 함' && (!Number.isInteger(rating) || rating < 1 || rating > 5))) return output({ ok: false });
    const stars = rating === '선택 안 함' ? rating : '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const safeTitle = escapeHtml(bookTitle), safeNickname = escapeHtml(nickname), safeText = escapeHtml(reviewText).replace(/\n/g, '<br>');
    MailApp.sendEmail({
      to: REVIEW_RECIPIENT,
      subject: '[도서 리뷰] ' + bookTitle + ' · ' + nickname,
      body: '책: ' + bookTitle + '\n닉네임: ' + nickname + '\n별점: ' + stars + '\n\n' + reviewText,
      htmlBody: '<h2>새 도서 리뷰</h2><p><b>책:</b> ' + safeTitle + '</p><p><b>닉네임:</b> ' + safeNickname + '</p><p><b>별점:</b> ' + stars + '</p><hr><p>' + safeText + '</p>'
    });
    return output({ ok: true });
  } catch (err) {
    console.error(err);
    return output({ ok: false });
  }
}

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
}
function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
