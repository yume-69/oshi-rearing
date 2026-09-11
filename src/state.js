// ─────────────────────────────────────────────
//  育成ロジック（数値のことだけ。描画は character.js）
// ─────────────────────────────────────────────

/** 成長段階（いまは成体のみ） */
export const STAGES = [{ key: "adult", label: "せいたい", minExp: 0 }];

/** 1分あたりの基準経験値 / 満腹度の減り */
const EXP_PER_MIN = 1;
const HUNGER_PER_MIN = 0.5;
/** 放置ボーナスの上限（12時間ぶんまで進む） */
const MAX_OFFLINE_MIN = 720;

export function newState() {
  const now = Date.now();
  return {
    version: 1,
    name: "うちのこ",
    born: now,
    lastSeen: now,
    exp: 0,
    hunger: 80, // 満腹度 0-100
    mood: 70,   // ごきげん 0-100
    care: 0,    // なでた回数
  };
}

/** 保存データを現在時刻まで進める。返り値は経過分数 */
export function advance(s, now = Date.now()) {
  const minutes = Math.min((now - s.lastSeen) / 60000, MAX_OFFLINE_MIN);
  if (minutes > 0) {
    // お腹が空いているとほとんど育たない
    const rate = s.hunger > 20 ? 1 : 0.2;
    s.exp += minutes * EXP_PER_MIN * rate;
    s.hunger = clamp(s.hunger - minutes * HUNGER_PER_MIN);
    s.mood = clamp(s.mood - minutes * 0.3);
  }
  s.lastSeen = now;
  return minutes;
}

export function stageOf(s) {
  let cur = STAGES[0];
  for (const st of STAGES) if (s.exp >= st.minExp) cur = st;
  return cur;
}

export function levelOf(s) {
  return Math.floor(Math.sqrt(s.exp) / 2) + 1;
}

/** 次の段階までの進捗 0-1 */
export function stageProgress(s) {
  const i = STAGES.indexOf(stageOf(s));
  const cur = STAGES[i].minExp;
  const next = STAGES[i + 1]?.minExp;
  if (next === undefined) return 1;
  return clamp01((s.exp - cur) / (next - cur));
}

export function feed(s) {
  s.hunger = clamp(s.hunger + 30);
  s.exp += 5;
  s.mood = clamp(s.mood + 5);
}

export function pat(s) {
  s.care += 1;
  s.mood = clamp(s.mood + 8);
  s.exp += 1;
}

/** 状態に応じたひとこと */
export function talk(s) {
  if (s.hunger < 20) return "フランソワを呼べ！";
  if (s.mood < 30) return "欲しい！";
  if (s.mood > 85) return "ハッハー！";
  if (s.mood > 60) return "にゃ…";
  return "ふわ…";
}

const clamp = (v) => Math.max(0, Math.min(100, v));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
