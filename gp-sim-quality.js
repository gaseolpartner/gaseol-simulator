/* 가설파트너 3D 화질 보정 — three.js 를 불러온 바로 다음에 실행
 * 기존 시뮬레이터 코드는 그대로 두고, three.js 의 기본값만 바꾼다.
 *  1) 고해상도 화면(노트북·휴대폰)에서 선명하게: 픽셀 비율 반영 (최대 2배, 휴대폰은 1.5배)
 *  2) 강관(원기둥) 단면을 8각 → 16각(휴대폰 12각)으로: 둥근 파이프처럼 보이게
 *  3) 그림자 해상도 512 → 2048(휴대폰 1024): 그림자 테두리가 계단처럼 깨지지 않게
 *  4) 안전장치: 컴퓨터가 느려서 화면이 끊기면(초당 25장 미만) 자동으로 선명도를 원래대로(1배) 되돌린다
 * 부재 색·크기·위치·조작 방식은 바꾸지 않는다. 문제가 생기면 이 파일만 빼면 원래대로 돌아간다.
 */
(function () {
  if (!window.THREE || window.__gpSimQuality) return;
  window.__gpSimQuality = true;
  var T = window.THREE;
  var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
  var DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  var SEG = mobile ? 12 : 16;
  var SHADOW = mobile ? 1024 : 2048;

  function wrap(name, after, before) {
    var Orig = T[name];
    if (typeof Orig !== 'function') return;
    try {
      T[name] = new Proxy(Orig, {
        construct: function (target, args, newTarget) {
          if (before) { try { args = before(args) || args; } catch (e) {} }
          var obj = Reflect.construct(target, args, newTarget);
          if (after) { try { after(obj); } catch (e) {} }
          return obj;
        }
      });
    } catch (e) { /* 실패하면 원래대로 */ }
  }

  // 1) 선명도
  var renderers = [];
  wrap('WebGLRenderer', function (r) { if (DPR > 1) { r.setPixelRatio(DPR); renderers.push(r); } });

  // 4) 느린 컴퓨터 보호: 3초 뒤부터 2초 동안 화면 갱신 속도를 재서, 느리면 선명도를 1배로
  if (DPR > 1) {
    setTimeout(function () {
      var n = 0, t0 = performance.now();
      (function tick(now) {
        n++;
        if (now - t0 < 2000) return requestAnimationFrame(tick);
        var fps = n / ((now - t0) / 1000);
        if (fps < 25) renderers.forEach(function (r) {
          try {
            var c = r.domElement, w = c.clientWidth, h = c.clientHeight;
            r.setPixelRatio(1); if (w && h) r.setSize(w, h, false);
          } catch (e) {}
        });
      })(t0);
    }, 3000);
  }

  // 2) 둥근 강관: radialSegments 를 안 주었거나 기본값(8)일 때만 늘림. 6각 볼트처럼 일부러 정한 값은 그대로.
  function roundMore(args) {
    var a = Array.prototype.slice.call(args);
    var seg = a[3];
    if (seg === undefined || seg === 8) a[3] = SEG;
    return a;
  }
  wrap('CylinderGeometry', null, roundMore);
  wrap('CylinderBufferGeometry', null, roundMore);

  // 3) 그림자 해상도 (그림자를 켠 조명에만 의미 있음)
  function sharperShadow(l) { if (l.shadow && l.shadow.mapSize) l.shadow.mapSize.set(SHADOW, SHADOW); }
  wrap('DirectionalLight', sharperShadow);
  wrap('SpotLight', sharperShadow);
})();
