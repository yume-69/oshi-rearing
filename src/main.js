import { newState, advance, stageOf, levelOf, stageProgress, feed, pat, talk } from "./state.js";
import { drawCharacter } from "./character.js";

// withGlobalTauri: true にしているので、バンドラ無しで API が使える
const invoke = window.__TAURI__?.core?.invoke;

const canvas = document.getElementById("pet");
const ctx = canvas.getContext("2d");
const bubble = document.getElementById("bubble");

let state = newState();

// ── 保存と読み込み（%APPDATA% の pet.json）──
async function load() {
  if (!invoke) return; // ブラウザで開いたときは初期状態のまま
  try {
    const json = await invoke("load_state");
    if (json) state = { ...newState(), ...JSON.parse(json) };
  } catch (e) {
    console.error("load failed", e);
  }
}

async function save() {
  if (!invoke) return;
  try {
    await invoke("save_state", { data: JSON.stringify(state) });
  } catch (e) {
    console.error("save failed", e);
  }
}

// ── 画面更新 ──
function syncUI() {
  const st = stageOf(state);
  document.getElementById("petName").textContent = `${state.name}（${st.label}）`;
  document.getElementById("lv").textContent = `Lv.${levelOf(state)}`;
  document.getElementById("expBar").style.width = `${stageProgress(state) * 100}%`;
  document.getElementById("hungerBar").style.width = `${state.hunger}%`;
}

function say(text, ms = 2200) {
  bubble.textContent = text;
  bubble.classList.add("show");
  clearTimeout(say._t);
  say._t = setTimeout(() => bubble.classList.remove("show"), ms);
}

function react() {
  canvas.classList.remove("happy");
  void canvas.offsetWidth; // アニメーションを再生し直す
  canvas.classList.add("happy");
  setTimeout(() => canvas.classList.remove("happy"), 1000);
}

// ── 毎フレーム描画 ──
function frame(t) {
  drawCharacter(ctx, {
    stage: stageOf(state).key,
    mood: state.mood,
    hunger: state.hunger,
    t,
  });
  requestAnimationFrame(frame);
}

// ── 操作 ──
document.getElementById("feed").addEventListener("click", () => {
  feed(state);
  syncUI();
  react();
  say("もぐもぐ");
  save();
});

document.getElementById("pat").addEventListener("click", () => {
  pat(state);
  syncUI();
  react();
  say(talk(state));
  save();
});

canvas.addEventListener("click", () => {
  pat(state);
  syncUI();
  react();
  say(talk(state));
});

// ── 起動 ──
(async () => {
  await load();
  const away = advance(state); // 前回終了からの経過ぶんを一気に成長させる
  syncUI();
  requestAnimationFrame(frame);
  if (away > 60) say(`${Math.floor(away / 60)}時間ぶり！`);
  else say(talk(state));

  // 1分ごとに時間を進めて保存
  setInterval(() => {
    advance(state);
    syncUI();
    save();
  }, 60_000);

  // 閉じる直前にも保存
  window.addEventListener("beforeunload", save);
})();
