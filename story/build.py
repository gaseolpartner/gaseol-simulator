# -*- coding: utf-8 -*-
"""가설파트너 이야기 글 페이지 만들기
data.json(유튜브 공개 영상의 제목·설명)을 읽어 story/index.html + story/NN.html + sitemap.xml 을 만든다.
새 편이 공개되면 data.json 의 items 에 {n,id,title,desc,tags} 를 추가하고 `python3 story/build.py` 를 실행하면 된다.
예약 공개(아직 비공개) 영상은 넣지 말 것 — 공개된 다음에 추가.
"""
import html, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = 'https://gaseolpartner.github.io/gaseol-simulator/story/'
HOME = 'https://gaseolpartner.com'
KAKAO = 'https://pf.kakao.com/_xovuVG/chat'
PLAYLIST = 'https://www.youtube.com/playlist?list=PLFsv-qUGE9vY'

EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿️‍]')


def clean(t):
    return re.sub(r'\s+', ' ', EMOJI.sub('', t)).strip()


def esc(t):
    return html.escape(t, quote=True)


def paras(desc):
    out = []
    for block in re.split(r'\n\s*\n|\n', desc):
        b = block.strip()
        if b:
            out.append('<p>' + esc(b) + '</p>')
    return '\n'.join(out)


def topic_links(item):
    """글 내용에 맞는 바로가기 (가설파트너 서비스)"""
    t = item['title'] + ' ' + item['desc'] + ' ' + ' '.join(item['tags'])
    links = []
    if re.search('동바리|서포트|거푸집|비계|벽이음|구조', t):
        links.append(('우리 현장, 구조검토 대상일까?', HOME + '/pages/structureatuntroduction#gpck', '높이·종류만 넣으면 법정 대상인지 바로 확인'))
    if re.search('비계|동바리|서포트', t):
        links.append(('간편 구조계산 (무료)', 'https://gaseolpartner.github.io/structure-calc/', '시스템 비계·동바리 참고용 계산'))
        links.append(('물량·견적 계산기 (무료)', 'https://gaseolpartner.github.io/calculators/', '면적만 넣으면 자재 수량'))
    if re.search('풍하중|바람|태풍|붕괴|무너|넘어', t):
        links.append(('3D 위험 체험 시뮬레이터', 'https://gaseolpartner.github.io/gaseol-simulator/', '바람·과하중에 비계·동바리가 어떻게 무너지는지'))
    links.append(('가설 설계 프로그램 CATS', HOME + '/pages/introduction', '선만 그으면 비계·동바리 배치부터 수량까지'))
    seen, uniq = set(), []
    for l in links:
        if l[0] not in seen:
            seen.add(l[0]); uniq.append(l)
    return uniq[:4]


HEAD = '''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#1B1B1B">
<meta property="og:type" content="{ogtype}">
<meta property="og:site_name" content="가설파트너">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<link rel="icon" type="image/png" sizes="32x32" href="../icons/favicon-32.png">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="../gp-common.css">
<style>
*{{box-sizing:border-box}}
body{{margin:0;background:#F6F6F4;color:#2B2B2B;font-family:Pretendard,"Malgun Gothic",sans-serif}}
.st-wrap{{max-width:820px;margin:0 auto;padding:28px 20px 56px}}
.st-crumb{{font-size:13px;color:#888;margin:0 0 14px}}.st-crumb a{{color:#888;text-decoration:none}}.st-crumb a:hover{{color:#1B1B1B}}
.st-no{{display:inline-block;background:#1B1B1B;color:#F2B705;font-weight:800;font-size:13px;border-radius:8px;padding:4px 10px;margin:0 0 10px}}
h1.st-h{{font-size:28px;line-height:1.4;margin:0 0 20px;color:#1B1B1B;word-break:keep-all}}
.st-video{{position:relative;max-width:360px;aspect-ratio:9/16;margin:0 auto 24px;border-radius:14px;overflow:hidden;background:#000 center/cover no-repeat;cursor:pointer}}
.st-video button{{position:absolute;inset:0;width:100%;height:100%;border:0;background:rgba(0,0,0,.25);color:#fff;font:800 16px Pretendard,sans-serif;cursor:pointer}}
.st-video button span{{display:inline-block;background:#F2B705;color:#1B1B1B;border-radius:999px;padding:12px 20px}}
.st-video iframe{{position:absolute;inset:0;width:100%;height:100%;border:0}}
.st-body{{background:#fff;border:1px solid #E3E3E3;border-radius:14px;padding:24px 26px;font-size:16.5px;line-height:1.85}}
.st-body p{{margin:0 0 14px;word-break:keep-all}}.st-body p:last-child{{margin:0}}
.st-tags{{margin:16px 0 0;display:flex;flex-wrap:wrap;gap:6px}}.st-tags span{{font-size:13px;color:#666;background:#EDEDEA;border-radius:6px;padding:3px 8px}}
.st-rel{{margin:26px 0 0}}.st-rel h2{{font-size:18px;margin:0 0 12px;color:#1B1B1B}}
.st-cards{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
.st-cards a{{display:block;background:#1B1B1B;color:#fff;border-radius:12px;padding:14px 16px;text-decoration:none;border-left:5px solid #F2B705}}
.st-cards a b{{display:block;font-size:15.5px}}.st-cards a small{{display:block;color:#cfcfcf;font-size:13px;margin-top:3px;line-height:1.5}}
.st-cards a:hover b{{color:#F2B705}}
.st-nav{{display:flex;justify-content:space-between;gap:10px;margin:28px 0 0;flex-wrap:wrap}}
.st-nav a{{flex:1 1 240px;display:block;background:#fff;border:1px solid #E3E3E3;border-radius:12px;padding:12px 14px;color:#1B1B1B;text-decoration:none;font-size:14px;line-height:1.5}}
.st-nav a:hover{{border-color:#F2B705}}.st-nav small{{display:block;color:#888;font-size:12px}}
.st-help{{margin:26px 0 0;background:#fff;border:1px solid #E3E3E3;border-radius:14px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}}
.st-help b{{font-size:16px}}.st-help span{{display:block;color:#666;font-size:14px;margin-top:2px}}
.st-help a{{background:#F2B705;color:#1B1B1B;font-weight:800;padding:11px 18px;border-radius:10px;text-decoration:none;white-space:nowrap}}
/* 목록 */
.st-search{{width:100%;font:inherit;font-size:16px;padding:13px 16px;border:1px solid #E3E3E3;border-radius:12px;margin:0 0 18px;background:#fff}}
.st-search:focus{{outline:none;border-color:#F2B705}}
.st-grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.st-item{{display:block;background:#fff;border:1px solid #E3E3E3;border-radius:14px;overflow:hidden;color:#1B1B1B;text-decoration:none}}
.st-item:hover{{border-color:#F2B705}}
.st-item i{{display:block;aspect-ratio:16/9;background:#222 center/cover no-repeat}}
.st-item div{{padding:12px 14px}}.st-item small{{color:#B88A00;font-weight:800;font-size:12.5px}}
.st-item b{{display:block;font-size:15px;line-height:1.5;margin-top:3px;word-break:keep-all}}
.st-empty{{display:none;color:#888;padding:20px 0}}
@media(max-width:760px){{.st-wrap{{padding:20px 16px 44px}}h1.st-h{{font-size:22px}}.st-body{{padding:18px;font-size:16px}}.st-cards{{grid-template-columns:1fr}}.st-grid{{grid-template-columns:1fr 1fr;gap:10px}}.st-item b{{font-size:14px}}}}
</style>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2EN43GPDGS"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}gtag('js',new Date());gtag('config','G-2EN43GPDGS');</script>
<script type="application/ld+json">{ld}</script>
</head>
<body>
<div class="gp-topbar"><div class="gp-topbar-inner"><a href="https://gaseolpartner.com"><span class="dot"></span>가설파트너 홈페이지 ↗</a><nav><a href="https://gaseolpartner.com/pages/introduction">가설 설계 프로그램</a><a href="https://gaseolpartner.com/pages/precio">가설재 견적 비교</a><a href="https://gaseolpartner.com/pages/structureatuntroduction">구조검토</a><a href="https://gaseolpartner.com/pages/calculators">무료 도구</a><a href="https://gaseolpartner.com/pages/support">고객지원</a></nav></div></div>
<header class="gp-brandbar"><div class="gp-brandbar-inner"><a class="gp-logo" href="index.html" aria-label="가설파트너 이야기"><span class="gp-li"></span><span class="gp-lt"><b>가설파트너</b><small>GASEOL PARTNER</small></span></a><div class="gp-brand-links"><a href="index.html">이야기 목록</a><a class="gp-cta" href="''' + KAKAO + '''" target="_blank" rel="noopener">카카오톡 문의</a></div></div></header>
'''

FOOT = '''<footer class="gp-footer"><div class="gp-footer-inner"><div>회사명 : 가설파트너<span class="gp-sep">|</span>주소 : 서울 강남구 가로수길 5<span class="gp-sep">|</span>이메일 : <a href="mailto:fc112@naver.com">fc112@naver.com</a><span class="gp-sep">|</span>전화 : <a href="tel:01079702108">010-7970-2108</a><span class="gp-sep">|</span>사업자등록번호 : 549-20-01841</div><div class="gp-copyline">ⓒ Gaseolpartner. all right reserved. · <a href="https://gaseolpartner.com" target="_blank" rel="noopener">gaseolpartner.com</a></div></div></footer>
'''

VIDEO_JS = '''<script>
document.querySelectorAll('.st-video').forEach(function(v){v.querySelector('button').addEventListener('click',function(){
var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+v.dataset.id+'?autoplay=1&playsinline=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.title=v.dataset.title;v.innerHTML='';v.appendChild(f);
try{gtag('event','story_play',{story:v.dataset.n})}catch(e){}});});
document.querySelectorAll('a[href^="http"]').forEach(function(a){a.addEventListener('click',function(){try{gtag('event','story_link',{link_url:a.href,link_text:a.textContent.trim().slice(0,40)})}catch(e){}})});
</script>
'''


def page(item, prev, nxt):
    n = item['n']
    t_clean = clean(item['title'])
    title = '%s | 가설파트너 이야기 #%d' % (t_clean, n)
    desc = clean(item['desc'])[:150] or t_clean
    url = BASE + '%02d.html' % n
    image = 'https://i.ytimg.com/vi/%s/hqdefault.jpg' % item['id']
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'Article', 'headline': t_clean[:110],
                     'description': desc, 'image': image, 'mainEntityOfPage': url,
                     'author': {'@type': 'Organization', 'name': '가설파트너'},
                     'publisher': {'@type': 'Organization', 'name': '가설파트너', 'url': HOME}},
                    ensure_ascii=False)
    h = HEAD.format(title=esc(title), desc=esc(desc), url=url, ogtype='article', image=image, ld=ld)
    rel = ''.join('<a href="%s" target="_blank" rel="noopener"><b>%s →</b><small>%s</small></a>' % (u, esc(a), esc(s))
                  for a, u, s in topic_links(item))
    nav = ''
    if prev:
        nav += '<a href="%02d.html"><small>← 이전 이야기 #%d</small>%s</a>' % (prev['n'], prev['n'], esc(clean(prev['title'])))
    if nxt:
        nav += '<a href="%02d.html" style="text-align:right"><small>다음 이야기 #%d →</small>%s</a>' % (nxt['n'], nxt['n'], esc(clean(nxt['title'])))
    tags = ''.join('<span>%s</span>' % esc(g) for g in item['tags'])
    body = paras(item['desc']) or '<p>%s</p>' % esc(t_clean)
    return h + '''<main class="st-wrap">
<p class="st-crumb"><a href="https://gaseolpartner.com">가설파트너</a> › <a href="index.html">가설파트너 이야기</a> › #{n}</p>
<span class="st-no">가설파트너 이야기 #{n}</span>
<h1 class="st-h">{h1}</h1>
<div class="st-video" data-id="{vid}" data-n="{n}" data-title="{h1a}" style="background-image:url('https://i.ytimg.com/vi/{vid}/hqdefault.jpg')"><button type="button" aria-label="영상 재생"><span>▶ 영상 보기</span></button></div>
<article class="st-body">
{body}
<div class="st-tags">{tags}</div>
</article>
<section class="st-rel"><h2>현장에서 바로 쓰는 가설파트너 도구</h2><div class="st-cards">{rel}</div></section>
<div class="st-help"><div><b>이 내용, 우리 현장에도 해당될까요?</b><span>구조검토는 HJ구조기술사사무소가 직접 검토합니다. 평균 2~3일.</span></div><a href="{kakao}" target="_blank" rel="noopener">💬 카톡으로 물어보기</a></div>
<nav class="st-nav">{nav}</nav>
</main>
'''.format(n=n, h1=esc(item['title']), h1a=esc(t_clean), vid=item['id'], body=body, tags=tags, rel=rel, kakao=KAKAO, nav=nav) + FOOT + VIDEO_JS + '</body>\n</html>\n'


def index(items):
    title = '가설파트너 이야기 — 비계·동바리·거푸집, 현장에서 궁금했던 것들'
    desc = '비계 벽이음, 동바리 수평연결재, 거푸집 측압처럼 현장에서 궁금했던 가설재 이야기 %d편. 짧은 영상과 글로 쉽게 정리했습니다.' % len(items)
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': title, 'description': desc, 'url': BASE},
                    ensure_ascii=False)
    h = HEAD.format(title=esc(title), desc=esc(desc), url=BASE, ogtype='website',
                    image='https://gaseolpartner.github.io/gaseol-simulator/icons/og.png', ld=ld)
    cards = ''.join(
        '<a class="st-item" href="%02d.html" data-q="%s"><i style="background-image:url(\'https://i.ytimg.com/vi/%s/mqdefault.jpg\')"></i><div><small>#%d</small><b>%s</b></div></a>'
        % (it['n'], esc((clean(it['title']) + ' '.join(it['tags']) + clean(it['desc'])).lower().replace(' ', '')), it['id'], it['n'], esc(clean(it['title'])))
        for it in sorted(items, key=lambda x: -x['n']))
    return h + '''<section class="gp-hero dark"><div class="gp-hero-inner"><span class="gp-label">무료 · 가설재 이야기</span>
<h1>가설파트너 <em>이야기</em></h1>
<p>비계·동바리·거푸집, 현장에서 "이건 왜 이렇게 하지?" 싶던 것들을 짧은 영상과 글로 풀었어요. 심심할 때 하나씩 보세요.</p>
<div class="gp-hero-btns"><a class="gp-btn" href="#list">이야기 고르기</a><a class="gp-btn-line" href="{pl}" target="_blank" rel="noopener">유튜브 재생목록 →</a></div></div></section>
<main class="st-wrap" id="list" style="max-width:1100px">
<input class="st-search" type="search" placeholder="찾고 싶은 말 (예: 벽이음, 동바리, 바람, 계단)" aria-label="이야기 검색">
<div class="st-grid">{cards}</div>
<p class="st-empty">찾는 이야기가 없어요. 다른 말로 찾아보세요.</p>
</main>
'''.format(pl=PLAYLIST, cards=cards) + FOOT + '''<script>
var q=document.querySelector('.st-search'),items=[].slice.call(document.querySelectorAll('.st-item')),empty=document.querySelector('.st-empty');
q.addEventListener('input',function(){var v=q.value.toLowerCase().replace(/\\s+/g,''),n=0;items.forEach(function(a){var ok=!v||a.dataset.q.indexOf(v)>-1;a.style.display=ok?'':'none';if(ok)n++});empty.style.display=n?'none':'block'});
</script>
</body>
</html>
'''


def main():
    data = json.load(open(os.path.join(HERE, 'data.json'), encoding='utf-8'))
    items = sorted(data['items'], key=lambda x: x['n'])
    for i, it in enumerate(items):
        prev = items[i - 1] if i > 0 else None
        nxt = items[i + 1] if i + 1 < len(items) else None
        open(os.path.join(HERE, '%02d.html' % it['n']), 'w', encoding='utf-8').write(page(it, prev, nxt))
    open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(index(items))
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '<url><loc>%s</loc></url>' % BASE]
    sm += ['<url><loc>%s%02d.html</loc></url>' % (BASE, it['n']) for it in items]
    sm.append('</urlset>')
    open(os.path.join(HERE, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(sm) + '\n')
    print('pages:', len(items) + 1)


if __name__ == '__main__':
    main()
