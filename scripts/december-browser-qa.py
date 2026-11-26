#!/usr/bin/env python3
"""Actual Expo export browser-emulation + API fixture QA. No DB/server API/Toss calls.
Run: python3 scripts/december-browser-qa.py [--port 8766]
Inspect static export: python3 scripts/december-browser-qa.py --serve
All browser traffic is guarded; only localhost static GET/HEAD leaves Playwright.
"""
import argparse
import hashlib
import json
import re
import threading
import time
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / 'dist-december'
OUT = ROOT / 'docs/december-event-qa'
CAP = OUT / 'captures'
EMAIL = 'december-qa@example.invalid'
START = '2026-11-30T15:00:00.000Z'
END = '2026-12-31T15:00:00.000Z'
ACTIVE = '2026-12-15T03:00:00.000Z'


def load_offers():
    source = (ROOT / 'shared/december-report-event.ts').read_text()
    pattern = r'\{ productCode: "([^"]+)", name: "([^"]+)", couponCode: "([^"]+)", listAmountKrw: ([\d_]+), finalAmountKrw: ([\d_]+), discountType: "([^"]+)", discountValue: ([\d_]+) \}'
    offers = [dict(productCode=a, name=b, couponCode=c, listAmountKrw=int(d.replace('_', '')), finalAmountKrw=int(e.replace('_', '')), discountType=f, discountValue=int(g.replace('_', ''))) for a,b,c,d,e,f,g in re.findall(pattern, source)]
    assert len(offers) == 3, 'Event schema changed: update fixture parser'
    return offers

OFFERS = load_offers()
PRODUCT_NAMES = {'personal_deep': '컬러 + 심리카드 개인 심화분석', 'couple_love_deep': '부부 · 연인 관계 심화분석', 'parent_child_deep': '부모 · 자녀 관계 심화분석'}

class StaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(EXPORT), **kw)
    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == '/__qa_health':
            body = json.dumps({'ready': True, 'export': 'dist-december', 'mode': 'static-only-no-api'}).encode()
            self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(body); return
        if path.startswith('/api/'):
            self.send_error(403, 'No backend is installed in QA static server'); return
        target = EXPORT / path.lstrip('/')
        if path == '/': self.path = '/index.html'
        elif not target.is_file() and (EXPORT / (path.lstrip('/') + '.html')).is_file(): self.path = path + '.html'
        super().do_GET()
    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass  # Expected when on-demand video closes during a static read.
    def log_message(self, fmt, *args):
        if args and str(args[1]) not in ('200', '304'): print('STATIC:', fmt % args, flush=True)


def superjson(data, dates=()):
    result = {'json': data}
    if dates: result['meta'] = {'values': {key: ['Date'] for key in dates}, 'v': 1}
    return {'result': {'data': result}}


def trpc_error(path, message, code='BAD_REQUEST'):
    return {'error': {'json': {'message': message, 'code': -32600, 'data': {'code': code, 'httpStatus': 400, 'path': path}}}}


class Fixture:
    def __init__(self, label, active=True, guest=False, state='issued', now=ACTIVE, mismatch=False):
        self.label=label; self.active=active; self.guest=guest; self.state=state; self.now=now; self.mismatch=mismatch
        self.calls=[]; self.blocked=[]; self.static_reads=[]; self.unknown=[]; self.errors=[]; self.login=[]
    def status(self):
        return {'active':self.active, 'serverNow':self.now, 'startsAt':START, 'endsAt':END, 'offers': [dict(o, state=self.state if self.active else 'expired') for o in OFFERS]}
    def response(self, name, input):
        if name=='auth.me':
            return superjson(None if self.guest else {'id': 990026, 'openId':'qa-synthetic-december-990026', 'name':'가상 QA 회원', 'email':EMAIL, 'loginMethod':'fixture', 'role':'user', 'lastSignedIn':self.now})
        if name=='auth.kakaoStatus': return superjson({'enabled':False})
        if name=='commerce.coupons.decemberStatus': return superjson(self.status(), ['serverNow','startsAt','endsAt'])
        if name=='commerce.coupons.claimDecember':
            if self.guest: return trpc_error(name,'UNAUTHORIZED','UNAUTHORIZED')
            if not self.active: return trpc_error(name,'COUPON_NOT_IN_VALID_PERIOD')
            self.state='issued'; return superjson(self.status(), ['serverNow','startsAt','endsAt'])
        if name=='commerce.checkout.testMode': return superjson({'localSimulatorEnabled':False,'tossTestEnabled':False,'tossLiveEnabled':True,'tossCardReviewEnabled':False,'paidAnalysisPublicEnabled':True})
        if name in ('visitors.log','conversionFunnel.track','auth.logout'): return superjson({'success':True})
        if name=='commerce.coupons.preview':
            offer=next((o for o in OFFERS if o['couponCode']==input.get('couponCode','').strip().upper() and o['productCode']==input.get('productCode')),None)
            if not offer or not self.active or self.state!='issued' or self.guest: return trpc_error(name,'COUPON_NOT_IN_VALID_PERIOD' if not self.active else 'COUPON_NOT_ELIGIBLE')
            return superjson({'couponId':990000+OFFERS.index(offer),'code':offer['couponCode'],'discountType':offer['discountType'],'discountValue':offer['discountValue'],'discountAmountKrw':offer['listAmountKrw']-offer['finalAmountKrw'],'finalAmountKrw':offer['finalAmountKrw']})
        if name in ('commerce.checkout.createTossLive','commerce.checkout.createTossTest'):
            offer=next(o for o in OFFERS if o['productCode']==input['productCode'])
            if input.get('couponCode') and (not self.active or self.guest or self.state!='issued'): return trpc_error(name,'COUPON_NOT_IN_VALID_PERIOD')
            final=offer['finalAmountKrw'] if input.get('couponCode') else offer['listAmountKrw']
            if self.mismatch: final+=100
            return superjson({'orderNumber':'QA-FIXTURE-'+offer['productCode'], 'productCode':offer['productCode'], 'productName':PRODUCT_NAMES[offer['productCode']], 'listAmountKrw':offer['listAmountKrw'], 'discountAmountKrw':offer['listAmountKrw']-final, 'finalAmountKrw':final, 'expiresAt':'2026-12-15T03:30:00.000Z', 'status':'pending','startGrant':None,'tossClientKey':'qa_stub_no_real_key'}, ['expiresAt'])
        # No productCatalog procedure exists in current app/server. Products are shared/commerce.ts constants.
        self.unknown.append(name)
        return trpc_error(name,'QA_UNHANDLED_PROCEDURE','NOT_FOUND')
    def route(self, route):
        req=route.request; url=urlparse(req.url); path=url.path
        if '/api/trpc/' in path:
            names=unquote(path.split('/api/trpc/',1)[1]).split(',')
            q=parse_qs(url.query)
            raw=json.loads(req.post_data or '{}') if req.method=='POST' else json.loads(q.get('input',['{}'])[0])
            results=[]
            for i,name in enumerate(names):
                item=raw.get(str(i),{}) if q.get('batch') else raw
                input=item.get('json',{}) if isinstance(item,dict) else {}
                self.calls.append({'procedure':name,'method':req.method,'input':input})
                results.append(self.response(name,input or {}))
            route.fulfill(status=200, content_type='application/json', body=json.dumps(results if q.get('batch') else results[0],ensure_ascii=False)); return
        if path=='/api/auth/kakao/login':
            self.login.append(req.url); route.fulfill(status=204,body=''); return
        if path=='/api/public-sample-report':
            code=parse_qs(url.query).get('product',[''])[0]
            files={'personal_deep':'husimcolor-personal-deep-sample.pdf','couple_love_deep':'husimcolor-couple-love-sample.pdf','parent_child_deep':'husimcolor-parent-child-sample.pdf'}
            if code in files:
                route.fulfill(status=200, content_type='application/pdf', body=(EXPORT/'sample-reports'/files[code]).read_bytes()); return
        if url.hostname in ('127.0.0.1','localhost') and url.port==ARGS.port and not path.startswith('/api/') and req.method in ('GET','HEAD'):
            self.static_reads.append(path); route.continue_(); return
        self.blocked.append({'url':req.url,'method':req.method}); route.abort('blockedbyclient')

RESULTS=[]
FIXTURES=[]
CAPTURES=[]

def check(name, condition, detail=None):
    result={'name':name,'passed':bool(condition)}
    if detail is not None: result['detail']=detail
    RESULTS.append(result)
    print(('PASS ' if condition else 'FAIL ')+name,flush=True)
    return condition


def capture(page,name):
    page.screenshot(path=str(CAP/(name+'.png')),full_page=False)
    CAPTURES.append(str((CAP/(name+'.png')).relative_to(ROOT)))


def new_page(browser,label, viewport=(390,844),**kw):
    fixture=Fixture(label,**kw); FIXTURES.append(fixture)
    context=browser.new_context(viewport={'width':viewport[0],'height':viewport[1]}, device_scale_factor=1, locale='ko-KR', timezone_id='Asia/Seoul', service_workers='block')
    context.route('**/*',fixture.route)
    # Stub only the SDK, never the UI. Date is offset but keeps advancing for 5-tap guard.
    millis=int(datetime.fromisoformat(fixture.now.replace('Z','+00:00')).timestamp()*1000)
    context.add_init_script(f'''(() => {{
      const RealDate = Date, offset = {millis} - RealDate.now();
      class QADate extends RealDate {{ constructor(...args) {{ super(...(args.length ? args : [RealDate.now()+offset])); }} static now() {{ return RealDate.now()+offset; }} }}
      window.Date=QADate; window.__qaPayments=[]; window.__qaTossFactoryCalls=[];
      window.TossPayments = (key) => {{ window.__qaTossFactoryCalls.push(key); return {{payment: (customer) => ({{requestPayment: async (input) => {{window.__qaPayments.push(input);}} }})}}; }};
    }})();''')
    page=context.new_page(); page.set_default_timeout(12000)
    page.on('pageerror',lambda error: fixture.errors.append({'url':page.url,'message':str(error)}))
    return page,fixture,context


def go(page,path):
    page.goto(f'http://127.0.0.1:{ARGS.port}'+path,wait_until='networkidle')
    page.wait_for_timeout(1650 if path=='/' else 300)


def text(page): return page.locator('body').inner_text()
def krw(number): return f'{number:,}원'


def capture_scroll(page,locator,name):
    locator.scroll_into_view_if_needed(); page.wait_for_timeout(150); capture(page,name)


def run(browser):
    # Responsive home first viewport + coupon issuance + each real checkout.
    for label,viewport in [('mobile390',(390,844)),('narrow360',(360,844)),('pc1365',(1365,900))]:
        p,f,c=new_page(browser,label,viewport,state='available')
        go(p,'/')
        banner=p.get_by_test_id('december-event-banner'); cta=p.get_by_test_id('december-event-cta')
        b=banner.bounding_box(); button=cta.bounding_box()
        check(label+' home banner and CTA first viewport',bool(b and button and b['y']>=0 and b['y']+b['height']<=viewport[1] and button['y']+button['height']<=viewport[1]),{'banner':b,'button':button,'viewport':viewport})
        capture(p,label+'-home-first-viewport')
        check(label+' no horizontal viewport overflow',p.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        cta.click(); p.get_by_test_id('december-claim-all').wait_for(); p.wait_for_timeout(350)
        check(label+' home CTA opens coupon screen','december-coupons' in p.url)
        p.get_by_test_id('december-claim-all').click()
        p.get_by_text('쿠폰 상태를 확인했습니다.',exact=False).wait_for()
        check(label+' authenticated claim fixture called once',sum(x['procedure']=='commerce.coupons.claimDecember' for x in f.calls)==1)
        for offer in OFFERS:
            card=p.get_by_test_id('december-coupon-'+offer['productCode'])
            check(label+' issued '+offer['productCode'], '발급 완료' in card.inner_text() and offer['couponCode'] in card.inner_text() and krw(offer['listAmountKrw']) in card.inner_text() and krw(offer['finalAmountKrw']) in card.inner_text())
        capture(p,label+'-coupons-issued-top')
        capture_scroll(p,p.get_by_test_id('december-coupon-parent_child_deep'),label+'-coupons-issued-bottom')
        # Distinguish real in-app route interaction from direct-export hydration.
        for offer in OFFERS:
            go(p,'/december-coupons')
            errors_before=len(f.errors)
            p.get_by_test_id('december-coupon-'+offer['productCode']).get_by_role('link').click()
            p.get_by_text('쿠폰이 적용되었습니다',exact=True).wait_for()
            check(label+' coupon product link routes '+offer['productCode'],parse_qs(urlparse(p.url).query).get('product')==[offer['productCode']])
            check(label+' in-app checkout navigation no page error '+offer['productCode'],len(f.errors)==errors_before)
        for offer in OFFERS:
            go(p,'/commerce-checkout?product='+offer['productCode'])
            p.get_by_text('쿠폰이 적용되었습니다',exact=True).wait_for()
            body=text(p)
            buttonText=krw(offer['finalAmountKrw'])+' · 토스페이먼츠 결제하기'
            pay=p.get_by_text(buttonText,exact=True)
            check(label+' checkout prices '+offer['productCode'],krw(offer['listAmountKrw']) in body and krw(offer['finalAmountKrw']) in body and pay.count()==1)
            check(label+' automatic dedicated coupon '+offer['productCode'],p.get_by_placeholder('쿠폰 코드를 입력하세요').input_value()==offer['couponCode'] and not p.get_by_placeholder('쿠폰 코드를 입력하세요').is_editable())
            capture(p,label+'-checkout-'+offer['productCode']+'-top')
            capture_scroll(p,pay,label+'-checkout-'+offer['productCode']+'-payment')
            pay.click(); p.wait_for_function('window.__qaPayments.length===1')
            payments=p.evaluate('window.__qaPayments')
            check(label+' requestPayment exact amount '+offer['productCode'],payments[0]['amount']=={'currency':'KRW','value':offer['finalAmountKrw']},payments)
        c.close()

    p,f,c=new_page(browser,'guest-claim',guest=True,state='available'); go(p,'/december-coupons')
    p.get_by_test_id('december-claim-all').click(no_wait_after=True); p.wait_for_timeout(400)
    check('guest claim routes to login with returnTo',bool(f.login) and parse_qs(urlparse(f.login[0]).query).get('returnTo')==['/december-coupons'],f.login)
    check('guest does not call claim mutation',not any(x['procedure']=='commerce.coupons.claimDecember' for x in f.calls))
    capture(p,'guest-claim-login-required'); c.close()

    for label,now in [('before-december','2026-11-30T14:59:59.000Z'),('after-january1',END)]:
        p,f,c=new_page(browser,label,active=False,now=now)
        go(p,'/'); check(label+' home banner hidden',p.get_by_test_id('december-event-banner').count()==0)
        check(label+' home personal normal price','29,000원' in text(p) and '9,900원' not in text(p)); capture(p,label+'-home')
        go(p,'/couple-start'); check(label+' relationship normal prices','59,000원' in text(p) and '39,000원' in text(p) and '23,600원' not in text(p)); capture(p,label+'-relationships')
        go(p,'/december-coupons'); check(label+' coupon claim disabled',p.get_by_test_id('december-claim-all').get_attribute('aria-disabled')=='true')
        check(label+' coupons normal prices',all(krw(o['listAmountKrw']) in text(p) for o in OFFERS) and '로그인 쿠폰 적용 시' not in text(p)); capture(p,label+'-coupons')
        for offer in OFFERS:
            go(p,'/commerce-checkout?product='+offer['productCode']+'&couponCode='+offer['couponCode'])
            coupon=p.get_by_placeholder('쿠폰 코드를 입력하세요')
            check(label+' checkout normal price '+offer['productCode'],p.get_by_text(krw(offer['listAmountKrw'])+' · 토스페이먼츠 결제하기',exact=True).count()==1 and coupon.input_value()=='')
        if label=='after-january1':
            coupon.fill('DEC2026-PARENT-CHILD'); p.get_by_text('쿠폰을 적용할 수 없습니다. 코드와 조건을 확인해 주세요.',exact=True).wait_for()
            pay=p.get_by_text('39,000원 · 토스페이먼츠 결제하기',exact=True)
            check('expired DEC prefix preview rejected and payment disabled',pay.locator('..').get_attribute('aria-disabled')=='true')
            before=len([x for x in f.calls if x['procedure'].startswith('commerce.checkout.create')])
            # DOM forced click cannot bypass the disabled Pressable guard.
            pay.click(force=True); p.wait_for_timeout(250)
            check('expired DEC prefix does not emit checkout or SDK',not p.evaluate('window.__qaPayments') and len([x for x in f.calls if x['procedure'].startswith('commerce.checkout.create')])==before)
            capture_scroll(p,pay,'after-january1-expired-dec-rejected')
        c.close()

    p,f,c=new_page(browser,'server-amount-mismatch',mismatch=True)
    go(p,'/commerce-checkout?product=personal_deep'); p.get_by_text('쿠폰이 적용되었습니다',exact=True).wait_for()
    p.get_by_text('9,900원 · 토스페이먼츠 결제하기',exact=True).click()
    p.get_by_text('쿠폰 상태 또는 결제 금액이 변경되었습니다.',exact=False).wait_for()
    check('server mismatch 10000 versus quoted 9900 blocks SDK',p.evaluate('window.__qaPayments.length===0 && window.__qaTossFactoryCalls.length===0'))
    capture_scroll(p,p.get_by_text('쿠폰 상태 또는 결제 금액이 변경되었습니다.',exact=False),'server-amount-mismatch-blocked'); c.close()

    # Regression interactions are actual Expo UI, public sample bytes are localhost fixture reads.
    p,f,c=new_page(browser,'regressions'); go(p,'/')
    check('personal video is poster-first no MP4 request',p.locator('video').count()==0 and not any(x.endswith('.mp4') for x in f.static_reads))
    p.get_by_role('button',name='개인 심화분석 소개 영상 재생하기',exact=True).click(); p.locator('video').wait_for()
    p.wait_for_timeout(400)
    check('personal video player opens local source without autoplay',p.locator('video').count()==1 and p.locator('video').evaluate('(v)=> !v.autoplay && v.paused && v.currentSrc.includes(location.origin)'))
    capture_scroll(p,p.locator('video'),'regression-personal-video'); p.get_by_role('button',name='개인 심화분석 소개 영상 닫기',exact=True).click()
    p.get_by_role('link',name='개인 심화분석 리포트 샘플 보기',exact=True).click(); p.wait_for_url('**/sample-report?*'); p.wait_for_timeout(1300)
    check('personal sample viewer opens', 'product=personal_deep' in p.url and '가상 데이터 샘플' in text(p))
    check('personal sample canvas rendered',p.frame_locator('iframe').locator('canvas').count()>0)
    capture(p,'regression-personal-sample'); p.get_by_role('button',name='← 상품 선택',exact=True).click(); p.wait_for_timeout(300)
    check('personal sample back restores home',urlparse(p.url).path in ('/','/index'))
    p.get_by_text('무료로 체험하기 →',exact=True).click(); p.wait_for_timeout(350)
    check('free color entry still selects colors','/select' in p.url); capture(p,'regression-free-color')
    go(p,'/couple-start')
    check('relationship discounted list and final prices',all(krw(o['listAmountKrw']) in text(p) and krw(o['finalAmountKrw']) in text(p) for o in OFFERS[1:]))
    check('friend card remains free','친구 관계 분석' in text(p) and '무료' in text(p))
    check('relationship video poster-first',p.locator('video').count()==0)
    p.get_by_role('button',name='두 사람이 이용하는 방법 영상 재생하기',exact=True).click(); p.locator('video').wait_for()
    check('relationship video player opens',p.locator('video').count()==1); p.get_by_role('button',name='두 사람이 이용하는 방법 닫기',exact=True).click()
    for code,name in [('couple_love_deep','부부·연인 PDF 샘플 보기'),('parent_child_deep','부모·자녀 PDF 샘플 보기')]:
        p.get_by_role('link',name=name,exact=True).click(); p.wait_for_url('**/sample-report?*'); p.wait_for_timeout(1000)
        check(code+' sample opens and canvas renders','product='+code in p.url and p.frame_locator('iframe').locator('canvas').count()>0)
        capture(p,'regression-sample-'+code); p.get_by_role('button',name='← 상품 선택',exact=True).click(); p.wait_for_timeout(400)
        check(code+' sample back restores relationship selection','/couple-start' in p.url)
    p.get_by_text('🌿 친구 관계 분석',exact=True).click(); p.get_by_text('다음 · 두 사람 정보 입력하기',exact=True).click(); p.wait_for_timeout(400)
    check('free friend routes to information with friend relation','/couple-info' in p.url and parse_qs(urlparse(p.url).query).get('relationType')==['친구']); capture(p,'regression-free-friend')
    go(p,'/'); symbol=p.get_by_alt_text('휴심컬러 심볼',exact=True)
    for i in range(4): symbol.click(); p.wait_for_timeout(180)
    check('symbol first four taps do not navigate admin','/admin' not in p.url)
    symbol.click(); p.wait_for_timeout(500)
    check('symbol fifth tap opens admin route','/admin' in p.url); capture(p,'regression-symbol-five-tap'); c.close()


def finish():
    check('no unhandled tRPC fixture procedures',not any(f.unknown for f in FIXTURES),{f.label:f.unknown for f in FIXTURES if f.unknown})
    check('no JavaScript page errors',not any(f.errors for f in FIXTURES),{f.label:f.errors for f in FIXTURES if f.errors})
    check('no external Toss SDK request reached network',all(not any('tosspayments' in x for x in f.static_reads) for f in FIXTURES))
    result={'qaType':'browser-emulation + API fixture QA; NOT DB E2E, NOT real Android or real Toss payment', 'export':'dist-december','exportIndexSha256':hashlib.sha256((EXPORT/'index.html').read_bytes()).hexdigest(),'generatedAt':datetime.now(timezone.utc).isoformat(), 'email':EMAIL, 'safety':{'databaseConnected':False,'productionApiCalled':False,'networkWritesForwarded':0,'tossSdk':'injected recording stub; external requests blocked','allowedNetwork':'GET/HEAD static files on loopback QA server only','productCatalog':'No procedure exists in inspected current app; local shared/commerce.ts definitions used'}, 'summary':{'passed':sum(r['passed'] for r in RESULTS),'failed':sum(not r['passed'] for r in RESULTS),'checks':len(RESULTS)}, 'checks':RESULTS,'captures':CAPTURES,'fixtures':[{'label':f.label,'serverNow':f.now,'active':f.active,'guest':f.guest,'calls':f.calls,'blocked':f.blocked,'login':f.login,'pageErrors':f.errors,'unknown':f.unknown} for f in FIXTURES]}
    (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    lines=['# 12월 이벤트 브라우저 QA 결과','','**실제 Expo export 브라우저 에뮬레이션 + API fixture QA입니다. DB E2E, 실제 Android 또는 실제 Toss 결제가 아닙니다.**','',f"- 결과: {result['summary']['passed']} 통과 / {result['summary']['failed']} 실패 ({len(RESULTS)} 검사)",'- 실행: `python3 scripts/december-browser-qa.py`','- 대상: `dist-december` 실제 Expo export, Chromium / Playwright','- 화면: 390×844, 360×844, 1365×900 (캡처는 실제 스크롤 위치별 viewport)','- 로그인: 가상 회원 990026 / `december-qa@example.invalid`','- 모든 `/api/trpc/*` 응답을 Playwright에서 superjson fixture로 처리. POST도 네트워크 전송 전에 fulfill.','- DB·프로덕션 API·비밀값·실제 결제·이메일 발송 없음. 외부 네트워크 요청 전면 차단.','- Toss SDK는 `requestPayment` 기록 stub. checkout API fixture의 9,900/23,600/15,600원과 SDK 인자를 대조.','- 상품 카탈로그 API는 현재 앱에 없으며 `shared/commerce.ts` 로컬 상품 정의를 사용.','- 공개 PDF 샘플은 export에 포함된 가상 샘플 bytes로 fixture 처리.','','## 검사','']
    lines+=['- '+('PASS' if r['passed'] else '**FAIL**')+' — '+r['name'] for r in RESULTS]
    if any(f.errors for f in FIXTURES):
        lines+=['','## 발견 이슈: 결제 URL 직접 진입의 hydration mismatch','','`/commerce-checkout?product=personal_deep` 및 나머지 2개 상품을 새 문서로 직접 열면 React minified error #418이 발생합니다. 390/360/1365 및 이벤트 기간 전후에서도 재현됩니다. UI는 React의 client 재생성 후 정상 동작하지만, 오류 없는 hydration 품질 검사는 실패했습니다.','', '`dist-december/commerce-checkout.html`의 SSR 본문은 상품 쿼리가 없어 “결제할 분석 상품을 먼저 선택해 주세요.”입니다. 브라우저의 첫 render는 `useLocalSearchParams`의 product를 알아 실제 checkout/gate 본문으로 바뀌므로 초기 markup이 일치하지 않는 것이 원인으로 판단됩니다.','', '**제안하는 최소 수정(미적용)**: `app/(tabs)/commerce-checkout.tsx`에 client hydration 완료 state를 두고, 모든 훅 이후 현재 잘못된 상품 분기 직전에 초기 SSR와 동일한 fallback을 반환합니다. 예: `const [hydrated,setHydrated]=useState(false); useEffect(()=>setHydrated(true),[]);`를 훅 영역에 추가하고 기존 `if ((!isPaidAnalysisCode(...`의 조건에 `!hydrated ||`를 추가합니다. 그 뒤 Expo 재export 및 본 QA를 재실행하십시오. hook 순서를 바꾸거나 early return을 훅 사이에 넣으면 안 됩니다.','', 'UI 파일은 본 QA에서 수정하지 않았습니다. 현재 결과의 JS 오류 상세 URL은 `results.json`의 fixtures/pageErrors에 보존되어 있습니다.']
    lines+=['','## 캡처','']+['- ['+Path(path).name+'](captures/'+Path(path).name+')' for path in CAPTURES]
    lines+=['','## 범위와 한계','','서버 쿠폰 유효기간·소유권·원장·중복 사용/예약 경쟁 처리는 실제 DB로 검증하지 않았습니다. 이 검사는 서버 응답 계약을 모사하여 UI 표시, 탐색, 만료 거절 상태, 금액 불일치 시 결제창 차단을 검증합니다. OAuth는 로그인 경로 요청과 returnTo만 검증하며 카카오 인증을 실행하지 않습니다. Toss 요청 기록은 승인·청구·callback 완료 증거가 아닙니다.','']
    (OUT/'results.md').write_text('\n'.join(lines))
    print(json.dumps(result['summary']),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--port',type=int,default=8766); parser.add_argument('--serve',action='store_true'); ARGS=parser.parse_args()
    if ARGS.serve:
        print(f'Static Expo-only QA server ready at http://127.0.0.1:{ARGS.port}/__qa_health (no API)',flush=True)
        ThreadingHTTPServer(('127.0.0.1',ARGS.port),StaticHandler).serve_forever()
    OUT.mkdir(parents=True,exist_ok=True); CAP.mkdir(parents=True,exist_ok=True)
    import urllib.request
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{ARGS.port}/__qa_health',timeout=2) as response: assert json.load(response)['mode']=='static-only-no-api'
    except Exception:
        server=ThreadingHTTPServer(('127.0.0.1',ARGS.port),StaticHandler); threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
            try: run(browser)
            finally: browser.close()
    except Exception as exc:
        check('QA runner completed',False,str(exc)); print('RUNNER ERROR:',exc,flush=True)
    finally: finish()
    raise SystemExit(1 if any(not r['passed'] for r in RESULTS) else 0)
