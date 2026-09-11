// ─────────────────────────────────────────────
//  キャラクターの描画
//  自作キャラに差し替えたいときは drawSprite() の中だけ触ればよい。
//  assets/adult.png を置くと自動でそちらが使われる
// ─────────────────────────────────────────────

const cache = new Map();

function loadSprite(key) {
  if (cache.has(key)) return cache.get(key);
  const img = new Image();
  const entry = { img, ok: false };
  img.onload = () => (entry.ok = true);
  img.src = `assets/${key}.png`;
  cache.set(key, entry);
  return entry;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{stage:string, mood:number, hunger:number, t:number}} view
 */
export function drawCharacter(ctx, view) {
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  const sprite = loadSprite(view.stage);
  if (sprite.ok) {
    ctx.drawImage(sprite.img, 0, 0, W, H);
    return;
  }
  drawFallback(ctx, view, W, H);
}

/** 画像を用意する前でも動く、成体の手描きプレースホルダ */
function drawFallback(ctx, view, W, H) {
  const r = (W * 0.8) / 2;
  const cx = W / 2;
  const cy = H - r - 16;
  const hue = view.hunger < 20 ? 35 : 95 + view.mood * 0.4;

  // 影
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, H - 12, r * 0.85, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // からだ
  const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  grad.addColorStop(0, `hsl(${hue} 70% 72%)`);
  grad.addColorStop(1, `hsl(${hue} 55% 50%)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 耳
  const ear = r * 0.5;
  ctx.fillStyle = `hsl(${hue} 60% 58%)`;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.45, cy - r * 0.8);
    ctx.lineTo(cx + dir * r * 0.25, cy - r * 0.85 - ear);
    ctx.lineTo(cx + dir * r * 0.7, cy - r * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // まばたき（3.4秒ごとに一瞬つぶる）
  const blink = view.t % 3400 < 140;
  const eyeY = cy - r * 0.12;
  const eyeX = r * 0.34;
  ctx.fillStyle = "#2b2b33";
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    if (blink) {
      ctx.roundRect(cx + dir * eyeX - r * 0.12, eyeY, r * 0.24, r * 0.05, 2);
    } else {
      ctx.arc(cx + dir * eyeX, eyeY, r * 0.12, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // くち
  ctx.strokeStyle = "#2b2b33";
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.beginPath();
  if (view.mood > 55) {
    ctx.arc(cx, cy + r * 0.2, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.arc(cx, cy + r * 0.42, r * 0.18, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();

  // ほお
  ctx.fillStyle = "rgba(255,120,140,0.35)";
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + dir * r * 0.6, cy + r * 0.12, r * 0.13, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
