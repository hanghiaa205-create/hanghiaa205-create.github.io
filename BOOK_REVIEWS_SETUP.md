# 도서 리뷰 설정

현재 홈페이지는 GitHub Pages 주소(`https://hanghiaa205-create.github.io`)이며, 별도 발신 도메인이 없으므로 이메일 알림은 Google Apps Script의 Gmail 권한으로 보냅니다. 공개 리뷰는 Supabase에 저장됩니다.

## 준비된 항목
- 홈페이지에 닉네임/별점/리뷰 입력란과 공개 리뷰 목록을 추가했습니다.
- Supabase 리뷰 테이블을 만들었고, 공개 읽기 정책이 적용됐습니다.
- 브라우저에는 Supabase Publishable key만 둡니다. 비밀 키는 브라우저 코드에 넣지 않습니다.

## 남은 설정
1. Google 계정으로 https://script.google.com/ 에서 새 Apps Script 프로젝트를 만듭니다.
2. 이 저장소의 `apps-script/Code.gs` 내용을 기본 코드 파일에 붙여 넣습니다.
3. 함수 목록에서 `setupBridgeToken`을 선택하고 실행합니다. Google이 Gmail 발송 권한을 요청하면 본인이 확인하고 승인합니다. 실행 로그에서 `EMAIL_BRIDGE_TOKEN=` 뒤의 값을 복사합니다.
4. Deploy → New deployment → Web app에서 Execute as me, Who has access는 Anyone으로 설정하고 배포합니다. 이렇게 하면 공개 웹 주소에서 함수에 도달할 수 있습니다. 토큰을 모르는 요청은 메일 발송하지 않습니다. 웹 앱 배포의 공개 접근 설정은 사용자 계정에서 직접 승인해 주세요.
5. Apps Script가 표시하는 Web app URL을 복사합니다.
6. Supabase의 Edge Functions → Secrets에 다음을 등록합니다.
   - `SITE_ORIGIN`: `https://hanghiaa205-create.github.io`
   - `EMAIL_WEB_APP_URL`: 앞서 복사한 Web app URL
   - `EMAIL_BRIDGE_TOKEN`: 실행 로그의 토큰 값
7. 프로젝트 루트에서 Supabase CLI를 로그인/연결한 다음 `supabase functions deploy submit-book-review`를 실행합니다.

## 운영 메모
- 이메일은 Apps Script를 실행한 Google 계정에서 발송되고, 수신자는 `nghiahanghia205@gmail.com`입니다. Apps Script가 Gmail 발송 권한을 요구할 때 계정을 확인하세요.
- 닉네임·별점·리뷰는 모든 방문자에게 공개됩니다. 닉네임은 인증되지 않습니다.
- 공개 리뷰 등록은 현재 로그인 없이 가능하므로 스팸 방지/신고 기능이 필요하면 추가해야 합니다.
- 데이터베이스 저장 성공 후 Gmail 발송에 실패하면 리뷰는 공개되며 화면에 알림 실패가 표시됩니다.
