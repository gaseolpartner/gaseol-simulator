/* 가설파트너 3D 시뮬레이터 공통 도구 — 기존 화면 위에 '덧붙이기'만 한다
 *  - 시점 버튼: 정면 / 측면 / 위 / 투시
 *  - 부재 정보: 3D 에서 부재를 누르면 이름·크기(모델 기준) 표시 + 노란 테두리
 *  - 부재 개수: 지금 보이는 구성 기준 부재별 개수 표 (참고용)
 *  - 사진 저장: 현재 3D 화면을 PNG 로 저장 (가설파트너 표기 포함)
 * 기존 변수(scene, camera, renderer, controls …)는 읽기만 하고, 기존 부재·조명·버튼은 바꾸지 않는다.
 * 사용: <script src="gp-sim-tools.js"></script><script>GPSim.init({ name:'갱폼 시뮬레이터', groups:{ panelGroup:'거푸집 패널', wallGroup:{label:'콘크리트 벽체', material:false} } })</script>
 */
(function () {
  'use strict';
  var G = function (n) { try { return (0, eval)(n); } catch (e) { return undefined; } };
  var CFG = {}, T, scene, camera, renderer, controls, helper = null, cardEl = null, ready = false;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'style') e.style.cssText = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function fmt(n) { return Math.round(n).toLocaleString('ko-KR'); }
  function mm(v) { return Math.round(v * 1000 / 10) * 10; } // 모델 단위(m) → mm, 10mm 단위
  function visible(o) { while (o) { if (o.visible === false) return false; o = o.parent; } return true; }

  /* ---------- 부재 목록 만들기 ---------- */
  function groupEntries() {
    // [{root, label, material}] — 화면에 보이는 '부재' 단위 (그룹의 바로 아래 자식 하나 = 부재 하나)
    var out = [];
    if (CFG.legend) {
      var parts = G('parts') || [];
      var sys = G('currentSystem');
      var legend = (sys === 'support' ? G('supportLegend') : G('scaffoldLegend')) || [];
      var byColor = {};
      legend.forEach(function (it) { byColor[String(it.color).toLowerCase().replace('#', '')] = it.name; });
      parts.forEach(function (p) {
        if (!p || !visible(p)) return;
        var hex = p.material && p.material.color ? p.material.color.getHexString() : '';
        out.push({ root: p, label: byColor[hex] || '기타 부재', material: !!byColor[hex] });
      });
      return out;
    }
    Object.keys(CFG.groups || {}).forEach(function (name) {
      var info = CFG.groups[name]; if (typeof info === 'string') info = { label: info };
      var g = G(name);
      if (!g || !g.isObject3D || !visible(g)) return;
      g.children.forEach(function (c) { if (visible(c)) out.push({ root: c, label: info.label, material: info.material !== false }); });
    });
    return out;
  }
  function findEntry(obj) {
    var list = groupEntries(), set = new Map();
    list.forEach(function (e) { set.set(e.root, e); });
    var o = obj;
    while (o) { if (set.has(o)) return set.get(o); o = o.parent; }
    return null;
  }
  function sizeOf(root) {
    var b = new T.Box3().setFromObject(root), s = new T.Vector3(); b.getSize(s);
    var d = [s.x, s.y, s.z].sort(function (a, c) { return c - a; });
    return { box: b, L: d[0], W: d[1], H: d[2] };
  }

  /* ---------- 부재 정보 카드 ---------- */
  function clearPick() {
    if (helper) { scene.remove(helper); if (helper.geometry) helper.geometry.dispose(); helper = null; }
    if (cardEl) cardEl.style.display = 'none';
  }
  function showPick(entry) {
    clearPick();
    var sz = sizeOf(entry.root);
    helper = new T.Box3Helper(sz.box, new T.Color(0xF2B705));
    helper.userData.__gpTool = true;
    scene.add(helper);
    var dims = sz.W < 0.06 && sz.H < 0.06
      ? '길이 약 ' + fmt(mm(sz.L)) + 'mm'
      : '크기 약 ' + fmt(mm(sz.L)) + ' × ' + fmt(mm(sz.W)) + (sz.H >= 0.005 ? ' × ' + fmt(mm(sz.H)) : '') + 'mm';
    cardEl.innerHTML = '<button class="gps-x" aria-label="닫기">✕</button><b>' + entry.label + '</b><span>' + dims + '</span><small>3D 모델 기준 크기(참고) · 실제 규격은 제품 사양을 확인하세요</small>';
    cardEl.style.display = 'block';
    cardEl.querySelector('.gps-x').onclick = clearPick;
  }
  function onPick(ev) {
    var rect = renderer.domElement.getBoundingClientRect();
    var p = new T.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    var rc = new T.Raycaster(); rc.setFromCamera(p, camera);
    var roots = groupEntries().map(function (e) { return e.root; });
    var hits = rc.intersectObjects(roots, true).filter(function (h) { return visible(h.object) && !(h.object.userData && h.object.userData.__gpTool); });
    if (!hits.length) { clearPick(); return; }
    var e = findEntry(hits[0].object);
    if (e) showPick(e); else clearPick();
  }

  /* ---------- 시점 ---------- */
  function sceneBox() {
    var b = new T.Box3(), any = false;
    groupEntries().forEach(function (e) { var bb = new T.Box3().setFromObject(e.root); if (!bb.isEmpty()) { b.union(bb); any = true; } });
    return any ? b : null;
  }
  function setView(kind) {
    var target, radius;
    var b = sceneBox();
    if (b) { target = b.getCenter(new T.Vector3()); radius = b.getSize(new T.Vector3()).length() / 2; }
    else { target = new T.Vector3(0, 2, 0); radius = 8; }
    if (CFG.fixedTarget) { var ft = CFG.fixedTarget(); target = new T.Vector3(ft[0], ft[1], ft[2]); }
    var dir = { front: [0, 0.18, 1], side: [1, 0.18, 0], top: [0.0001, 1, 0.0001], iso: [1, 0.75, 1] }[kind];
    var v = new T.Vector3(dir[0], dir[1], dir[2]).normalize();
    var fov = (camera.fov || 60) * Math.PI / 180;
    var dist = Math.max(radius / Math.sin(fov / 2) * 1.08, 3);
    var to = target.clone().add(v.multiplyScalar(dist));
    var from = camera.position.clone(), t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / 450); k = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(from, to, k);
      camera.lookAt(target);
      if (controls && controls.target) { controls.target.copy(target); controls.update(); }
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- 사진 저장 ---------- */
  function savePhoto() {
    clearPick();
    renderer.render(scene, camera);
    var src = renderer.domElement, c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    var x = c.getContext('2d'); x.drawImage(src, 0, 0);
    var s = Math.max(1, c.width / 1400), pad = 16 * s;
    x.font = 'bold ' + Math.round(15 * s) + 'px Pretendard, "Malgun Gothic", sans-serif';
    var label = '가설파트너 · ' + (CFG.name || '3D 시뮬레이터') + ' · gaseolpartner.com';
    var w = x.measureText(label).width;
    x.fillStyle = 'rgba(27,27,27,.78)'; x.fillRect(c.width - w - pad * 3, c.height - 40 * s, w + pad * 2, 28 * s);
    x.fillStyle = '#F2B705'; x.fillRect(c.width - w - pad * 3, c.height - 40 * s, 4 * s, 28 * s);
    x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(label, c.width - w - pad * 2, c.height - 26 * s);
    var d = new Date(), stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
    // 파일 이름은 영문으로 (일부 브라우저에서 한글 이름이 'download' 로 바뀌는 문제 방지)
    var fname = 'gaseolpartner_' + (CFG.slug || '3d') + '_' + stamp + '.png';
    c.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.download = fname; a.href = url;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }, 'image/png');
  }

  /* ---------- 부재 개수 ---------- */
  function showBom() {
    var rows = {}, order = [];
    groupEntries().forEach(function (e) {
      if (!e.material) return;
      var sz = sizeOf(e.root);
      var key = e.label + '|' + mm(sz.L);
      if (!rows[key]) { rows[key] = { label: e.label, L: mm(sz.L), n: 0 }; order.push(key); }
      rows[key].n++;
    });
    order.sort(function (a, b) { var A = rows[a], B = rows[b]; return A.label === B.label ? B.L - A.L : (A.label < B.label ? -1 : 1); });
    var total = 0, body = order.map(function (k) { var r = rows[k]; total += r.n; return '<tr><td>' + r.label + '</td><td class="r">' + fmt(r.L) + '</td><td class="r"><b>' + fmt(r.n) + '</b></td></tr>'; }).join('');
    var ov = el('div', { class: 'gps-ov' });
    var box = el('div', { class: 'gps-modal', role: 'dialog', 'aria-label': '부재 개수' },
      '<div class="gps-mh"><b>부재 개수</b><span>' + (CFG.name || '') + ' · 지금 화면에 보이는 구성</span><button class="gps-x" aria-label="닫기">✕</button></div>' +
      (order.length ? '<div class="gps-tw"><table><thead><tr><th>부재</th><th class="r">모델 길이(mm)</th><th class="r">개수</th></tr></thead><tbody>' + body + '</tbody><tfoot><tr><td>합계</td><td></td><td class="r"><b>' + fmt(total) + '</b></td></tr></tfoot></table></div>'
        : '<p class="gps-empty">아직 표시된 부재가 없어요. 설치를 진행하거나 표시를 켠 뒤 다시 눌러 주세요.</p>') +
      '<p class="gps-note">3D 모델을 그대로 센 참고용 숫자예요. 실제 발주 물량은 <a href="https://gaseolpartner.github.io/calculators/" target="_blank" rel="noopener">물량산출 계산기</a>로 확인하세요.</p>');
    function close() { ov.remove(); box.remove(); }
    ov.onclick = close; box.querySelector('.gps-x').onclick = close;
    document.body.appendChild(ov); document.body.appendChild(box);
  }

  /* ---------- 화면 ---------- */
  function css() {
    var s = el('style', null,
      '.gps-bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:1500;display:flex;gap:4px;align-items:center;background:rgba(17,17,17,.88);border:1px solid #3A3A3A;border-radius:12px;padding:5px;font-family:Pretendard,"Malgun Gothic",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35)}' +
      '.gps-bar button{all:unset;cursor:pointer;color:#e8e8e8;font-size:13px;font-weight:700;padding:7px 10px;border-radius:8px;white-space:nowrap;line-height:1}' +
      '.gps-bar button:hover{background:#2c2c2c;color:#F2B705}.gps-bar button.on{background:#F2B705;color:#1B1B1B}' +
      '.gps-bar .gps-sep{width:1px;height:20px;background:#3A3A3A;margin:0 2px}' +
      '.gps-bar .gps-i{display:none}' +
      '.gps-card{display:none;position:fixed;left:50%;bottom:66px;transform:translateX(-50%);z-index:1500;min-width:240px;max-width:min(420px,calc(100vw - 24px));background:#fff;color:#1B1B1B;border-radius:12px;border-left:5px solid #F2B705;padding:12px 40px 12px 14px;font-family:Pretendard,"Malgun Gothic",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}' +
      '.gps-card b{display:block;font-size:16px;font-weight:800}.gps-card span{display:block;font-size:14px;margin-top:3px}.gps-card small{display:block;color:#888;font-size:11.5px;margin-top:6px}' +
      '.gps-x{all:unset;cursor:pointer;position:absolute;right:10px;top:8px;font-size:16px;color:#888;padding:4px}' +
      '.gps-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:3500}' +
      '.gps-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3501;background:#fff;color:#1B1B1B;border-radius:14px;width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 80px);display:flex;flex-direction:column;font-family:Pretendard,"Malgun Gothic",sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.4)}' +
      '.gps-mh{position:relative;padding:16px 44px 12px 18px;border-bottom:3px solid #F2B705}.gps-mh b{font-size:18px;font-weight:800;margin-right:8px}.gps-mh span{color:#666;font-size:13px}' +
      '.gps-tw{overflow:auto;padding:4px 18px}.gps-modal table{width:100%;border-collapse:collapse;font-size:14px}.gps-modal th{background:#1B1B1B;color:#fff;font-weight:700;padding:8px 10px;text-align:left;position:sticky;top:0}' +
      '.gps-modal td{padding:7px 10px;border-bottom:1px solid #E3E3E3}.gps-modal tfoot td{border-bottom:0;background:#F6F6F4;font-weight:700}.gps-modal .r{text-align:right}' +
      '.gps-note{margin:0;padding:12px 18px 16px;color:#666;font-size:12.5px;line-height:1.6}.gps-note a{color:#7F6000;font-weight:700}.gps-empty{padding:24px 18px;color:#666;margin:0}' +
      '@media(max-width:700px){.gps-bar{left:auto;right:8px;top:50%;bottom:auto;transform:translateY(-50%);flex-direction:column;padding:4px;gap:2px}.gps-bar .gps-t{display:none}.gps-bar .gps-i{display:inline}.gps-bar button{font-size:14px;font-weight:700;padding:8px;min-width:38px}.gps-bar .gps-sep{width:20px;height:1px;margin:2px 0}.gps-card{bottom:12px}}' +
      '@media print{.gps-bar,.gps-card{display:none!important}}');
    document.head.appendChild(s);
  }
  function bar() {
    var b = el('div', { class: 'gps-bar', role: 'toolbar', 'aria-label': '3D 보기 도구' });
    function btn(icon, text, title, fn) {
      var x = el('button', { type: 'button', title: title, 'aria-label': title }, '<span class="gps-i">' + icon + '</span><span class="gps-t">' + text + '</span>');
      x.onclick = fn; b.appendChild(x); return x;
    }
    btn('정', '정면', '정면에서 보기', function () { setView('front'); });
    btn('측', '측면', '옆에서 보기', function () { setView('side'); });
    btn('위', '위', '위에서 보기', function () { setView('top'); });
    btn('3D', '투시', '비스듬히 보기', function () { setView('iso'); });
    b.appendChild(el('span', { class: 'gps-sep' }));
    var info = btn('ℹ️', '부재 정보', '부재를 누르면 이름과 크기 보기', function () { CFG.pick = !CFG.pick; info.classList.toggle('on', CFG.pick); if (!CFG.pick) clearPick(); });
    info.classList.toggle('on', CFG.pick);
    btn('📋', '부재 개수', '지금 보이는 부재 개수 보기', showBom);
    btn('📷', '사진 저장', '현재 화면을 사진으로 저장', savePhoto);
    document.body.appendChild(b);
    cardEl = el('div', { class: 'gps-card', role: 'status' });
    document.body.appendChild(cardEl);
  }
  function hookPick() {
    var d = null;
    renderer.domElement.addEventListener('pointerdown', function (e) { d = { x: e.clientX, y: e.clientY, t: Date.now() }; }, { passive: true });
    renderer.domElement.addEventListener('pointerup', function (e) {
      if (!CFG.pick || !d) return;
      var moved = Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y);
      if (moved < 6 && Date.now() - d.t < 600) { try { onPick(e); } catch (err) { /* 무시 */ } }
      d = null;
    }, { passive: true });
  }

  function start() {
    T = window.THREE; scene = G('scene'); camera = G('camera'); renderer = G('renderer'); controls = G('controls');
    if (!T || !scene || !camera || !renderer || !renderer.domElement) return false;
    css(); bar(); hookPick(); ready = true; return true;
  }

  window.GPSim = {
    init: function (cfg) {
      CFG = cfg || {}; if (CFG.pick === undefined) CFG.pick = true;
      var tries = 0;
      (function wait() { if (ready) return; if (start()) return; if (++tries < 80) setTimeout(wait, 250); })();
    },
    _debug: function () { return { ready: ready, parts: ready ? groupEntries().length : 0 }; }
  };
})();
