/* 가설파트너 홈페이지(/pages/simulater) '위험 체험' 칸에 쇼츠를 더 붙이는 스크립트 (2026-11)
 * 홈페이지 관리자 footer 칸은 용량 한도(약 64KB)에 거의 찼으므로, 새 영상·링크는 여기서 추가한다.
 * 홈페이지 footer 에는 <script src=".../home-shorts.js" defer></script> 한 줄만 둔다.
 * 영상 추가: 아래 NEW 목록에 한 줄 추가 → GitHub 에 올리면 끝 (홈페이지 관리자 수정 필요 없음)
 * 유튜브에 올린 뒤에는 yt 에 쇼츠 주소를 넣으면 링크가 유튜브로 바뀜
 */
(function () {
  var S = 'https://gaseolpartner.github.io/gaseol-simulator/';
  // [영상 파일, 제목, 길이(초), 같은 조건으로 열 시뮬레이터 주소, 유튜브 쇼츠 주소(올린 뒤)]
  var NEW = [
    ['net', '비계 방음패널', '15', 'wind-simulator.html#net', ''],
    ['rebar', '동바리 자재 적치', '17.5', 'support-collapse-simulator.html#rebar', ''],
    ['tiegap', '폼타이 간격', '15', 'formwork-pressure-simulator.html#tiegap', ''],
    ['fourleg', '줄걸이 4줄 걸이', '14', 'rigging-simulator.html#fourleg', ''],
    ['tiemiss', '벽이음 누락', '15', 'wind-simulator.html#tiemiss', ''],
    ['pipethick', '두꺼운 슬래브 파이프서포트', '15', 'support-collapse-simulator.html#pipethick', ''],
    ['fluid', '고유동 콘크리트', '16.5', 'formwork-pressure-simulator.html#fluid', ''],
    ['brace', '동바리 수평재 누락', '15', 'support-collapse-simulator.html#brace', '']
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
      var link = v[4] ? v[4] : S + v[3], tail = v[4] ? '' : ' · 직접 해 보기';
      return '<figure><video src="' + S + 'videos/' + v[0] + '.mp4" poster="' + S + 'videos/' + v[0] + '.jpg" muted loop playsinline controls preload="none" title="' + esc(v[1]) + '"></video>' +
        '<figcaption><a href="' + esc(link) + '" target="_blank" rel="noopener">▶ ' + esc(v[1]) + ' (' + v[2] + '초)' + tail + '</a></figcaption></figure>';
    }).join('');
    box.insertAdjacentHTML('afterbegin', html);
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
  if (/[?&]m=edit/.test(location.search)) return;   // 디자인 편집 화면에서는 동작 안 함
  var n = 0; (function retry() { if (run() || ++n > 40) return; setTimeout(retry, 250); })();
})();
