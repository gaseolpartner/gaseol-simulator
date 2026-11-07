/* 가설파트너 홈페이지(/pages/simulater) '위험 체험' 칸에 쇼츠를 더 붙이는 스크립트 (2026-11)
 * 홈페이지 관리자 footer 칸은 용량 한도(약 64KB)에 거의 찼으므로, 새 영상·링크는 여기서 추가한다.
 * 홈페이지 footer 에는 <script src=".../home-shorts.js" defer></script> 한 줄만 둔다.
 * 영상 추가: 아래 NEW 목록에 한 줄 추가 → GitHub 에 올리면 끝 (홈페이지 관리자 수정 필요 없음)
 * 유튜브에 올린 뒤에는 5번째 칸에 쇼츠 주소, 6번째 칸에 공개 다음 날(예약 공개면)을 넣으면 그날부터 링크가 유튜브로 바뀜
 */
(function () {
  var S = 'https://gaseolpartner.github.io/gaseol-simulator/';
  // [영상 파일, 제목, 길이(초), 같은 조건으로 열 시뮬레이터 주소, 유튜브 쇼츠 주소, 유튜브 링크로 바꿀 날짜(한국시간 0시부터)]
  // 예약 공개 영상은 공개 다음 날부터 유튜브로 연결 (그 전에는 시뮬레이터로)
  var NEW = [
    ['slabthick', '동바리 슬래브 두께', '15', 'support-collapse-simulator.html#slabthick', '', ''],
    ['height', '비계 설치 높이', '18', 'wind-simulator.html#height', '', ''],
    ['prerelease', '갱폼 고정볼트 선해체', '16', 'gangform-lift-simulator.html#prerelease', '', ''],
    ['cold', '추운 날 거푸집 측압', '15', 'formwork-pressure-simulator.html#cold', '', ''],
    ['gapwide', '동바리 간격', '15', 'support-collapse-simulator.html#gapwide', '', ''],
    ['railgone', '안전난간 미복구', '15', 'guardrail-simulator.html#railgone', '', ''],
    ['toeboard', '안전난간 발끝막이판', '15', 'guardrail-simulator.html#toeboard', '', ''],
    ['tiewide', '비계 벽이음 간격', '15', 'wind-simulator.html#tiewide', '', ''],
    ['midrail', '안전난간 중간난간대', '15', 'guardrail-simulator.html#midrail', '', ''],
    ['pipebrace', '파이프서포트 수평연결재', '15', 'support-collapse-simulator.html#pipebrace', '', ''],
    ['net', '비계 방음패널', '15', 'wind-simulator.html#net', 'https://youtube.com/shorts/E77qaPkVzqo', '2026-11-02'],
    ['rebar', '동바리 자재 적치', '17.5', 'support-collapse-simulator.html#rebar', 'https://youtube.com/shorts/suvS1gqjRRo', '2026-11-02'],
    ['tiegap', '폼타이 간격', '15', 'formwork-pressure-simulator.html#tiegap', 'https://youtube.com/shorts/v7Un9qVjPII', '2026-11-04'],
    ['fourleg', '줄걸이 4줄 걸이', '14', 'rigging-simulator.html#fourleg', 'https://youtube.com/shorts/N3X2cPDauxE', '2026-11-04'],
    ['tiemiss', '벽이음 누락', '15', 'wind-simulator.html#tiemiss', 'https://youtube.com/shorts/DcS5NThGb_A', '2026-11-05'],
    ['pipethick', '두꺼운 슬래브 파이프서포트', '15', 'support-collapse-simulator.html#pipethick', 'https://youtube.com/shorts/cY0By5FCwzQ', '2026-11-05'],
    ['fluid', '고유동 콘크리트', '16.5', 'formwork-pressure-simulator.html#fluid', 'https://youtube.com/shorts/35KlOzyN6M8', '2026-11-06'],
    ['brace', '동바리 수평재 누락', '15', 'support-collapse-simulator.html#brace', 'https://youtube.com/shorts/ZmuO2AH0V7s', '2026-11-06']
  ];
  // 카드 링크를 영상과 같은 조건으로 (없으면 그대로)
  var CARD = { 'formwork-pressure-simulator.html': '#fast', 'rigging-simulator.html': '#angle' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function run() {
    var box = document.querySelector('.gx-risk .gx-shv');
    if (!box) return false;
    if (box.getAttribute('data-gp-more')) return true;
    box.setAttribute('data-gp-more', '1');
    var html = NEW.map(function (v) {
      var yt = v[4] && (!v[5] || Date.now() >= Date.parse(v[5] + 'T00:00:00+09:00'));
      var link = yt ? v[4] : S + v[3], tail = yt ? '' : ' · 직접 해 보기';
      return '<figure><video src="' + S + 'videos/' + v[0] + '.mp4" poster="' + S + 'videos/' + v[0] + '.jpg" muted loop playsinline controls preload="none" title="' + esc(v[1]) + '"></video>' +
        '<figcaption><a href="' + esc(link) + '" target="_blank" rel="noopener">▶ ' + esc(v[1]) + ' (' + v[2] + '초)' + tail + '</a></figcaption></figure>';
    }).join('');
    box.insertAdjacentHTML('afterbegin', html);
    fold(box);
    document.querySelectorAll('.gx-risk a.gx-a').forEach(function (a) {
      Object.keys(CARD).forEach(function (k) { if (a.href === S + k) a.href = S + k + CARD[k]; });
    });
    // 새 영상도 화면에 보일 때만 재생
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target;
        if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }); }, { threshold: 0.35 });
      box.querySelectorAll('figure video').forEach(function (v, i) { if (i < NEW.length) io.observe(v); });
    }
    return true;
  }
  // ---------- 영상 접기 (11-07) ----------
  // 영상이 늘어도 페이지가 길어지지 않게: 분류 버튼 + 처음엔 PC 8개 / 휴대폰 4개만, 나머지는 [영상 더 보기]
  // 분류는 영상이 여는 시뮬레이터 파일로 자동으로 정함 → 새 영상은 NEW 목록에만 넣으면 됨
  var CAT = [['all', '전체'], ['sc', '비계'], ['sp', '동바리'], ['fw', '거푸집·갱폼'], ['etc', '인양·안전시설']];
  var BYSIM = { 'wind-simulator': 'sc', 'scaffold': 'sc', 'support-collapse-simulator': 'sp', 'formwork-pressure-simulator': 'fw', 'gangform-lift-simulator': 'fw', 'rigging-simulator': 'etc', 'guardrail-simulator': 'etc' };
  var BYFILE = { settle: 'sc', dismantle: 'sc', mobile: 'sc', heap: 'sp', formwork: 'fw', rigging: 'etc' }; // 처음부터 있던 6개
  function catOf(f) {
    var v = f.querySelector('video'), m = v && (v.getAttribute('src') || '').match(/videos\/([\w-]+)\.mp4/);
    var sim = null; NEW.forEach(function (x) { if (m && x[0] === m[1]) sim = x[3]; });
    if (!sim) { var a = f.querySelector('a'); sim = a ? a.getAttribute('href') : ''; }
    for (var k in BYSIM) if (sim && sim.indexOf(k) > -1) return BYSIM[k];
    return (m && BYFILE[m[1]]) || 'etc';
  }
  function fold(box) {
    if (box.getAttribute('data-gp-fold')) return;
    var figs = [].slice.call(box.querySelectorAll(':scope > figure'));
    if (figs.length <= 8) return;
    box.setAttribute('data-gp-fold', '1');
    figs.forEach(function (f) { f.setAttribute('data-cat', catOf(f)); });
    var st = document.createElement('style');
    st.textContent = '.gpsf{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 0}.gpsf button{font:inherit;font-size:14.5px;font-weight:700;padding:9px 16px;border-radius:999px;border:1.5px solid #d6d6d2;background:#fff;color:#333;cursor:pointer}.gpsf button em{font-style:normal;color:#999;font-weight:600;margin-left:4px;font-size:13px}.gpsf button.on{background:#1B1B1B;border-color:#1B1B1B;color:#F2B705}.gpsf button.on em{color:#ccc}' +
      '.gx-risk .gx-shv figure.gpsf-x{display:none}.gpsm{display:flex;justify-content:center;margin-top:18px}.gpsm button{font:inherit;font-size:15.5px;font-weight:800;padding:13px 26px;border-radius:12px;border:2px solid #1B1B1B;background:#fff;color:#1B1B1B;cursor:pointer}.gpsm button:hover{background:#FFF6D6}.gpsm[hidden]{display:none}' +
      '@media(max-width:760px){.gpsf{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px}.gpsf button{flex:none;padding:8px 13px;font-size:13.5px}}';
    document.head.appendChild(st);
    var bar = document.createElement('div'); bar.className = 'gpsf'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', '영상 분류');
    CAT.forEach(function (c) {
      var n = c[0] === 'all' ? figs.length : figs.filter(function (f) { return f.getAttribute('data-cat') === c[0]; }).length;
      if (!n) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-c', c[0]); b.innerHTML = c[1] + '<em>' + n + '</em>';
      bar.appendChild(b);
    });
    var more = document.createElement('div'); more.className = 'gpsm'; more.innerHTML = '<button type="button"></button>';
    box.parentNode.insertBefore(bar, box); box.parentNode.insertBefore(more, box.nextSibling);
    var cur = 'all', open = false;
    function cap() { return window.matchMedia('(max-width:760px)').matches ? 4 : 8; }
    function draw() {
      var list = figs.filter(function (f) { return cur === 'all' || f.getAttribute('data-cat') === cur; }), c = cap();
      figs.forEach(function (f) { f.classList.add('gpsf-x'); var v = f.querySelector('video'); if (v) v.pause(); });
      list.forEach(function (f, i) { if (open || i < c) f.classList.remove('gpsf-x'); });
      [].forEach.call(bar.children, function (b) { var on = b.getAttribute('data-c') === cur; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      more.hidden = list.length <= c;
      more.firstChild.textContent = open ? '영상 접기 ↑' : '영상 더 보기 (' + (list.length - c) + '개 더) ↓';
    }
    bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cur = b.getAttribute('data-c'); open = false; draw(); });
    more.firstChild.addEventListener('click', function () { var was = open; open = !open; draw(); if (was) bar.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    window.addEventListener('resize', function () { if (!open) draw(); });
    draw();
  }
  if (/[?&]m=edit/.test(location.search)) return;   // 디자인 편집 화면에서는 동작 안 함
  var n = 0; (function retry() { if (run() || ++n > 40) return; setTimeout(retry, 250); })();
})();
