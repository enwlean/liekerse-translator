// Ключ для localStorage
const STORAGE_KEY = "liekerseDictionary_v1";

// Базовые слова (можешь редактировать прямо здесь)
const defaultPairs = [
  { ru: "привет", lk: "lihek" },
  { ru: "мир", lk: "kaar" },
  { ru: "я", lk: "sa" },
  { ru: "ты", lk: "tu" }
];

let pairs = [];
let ruToLk = {};
let lkToRu = {};

// DOM
const directionSelect = document.getElementById("direction");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");

const ruWordInput = document.getElementById("ruWord");
const lkWordInput = document.getElementById("lkWord");
const addWordBtn = document.getElementById("addWordBtn");

const dictList = document.getElementById("dictList");
const wordCount = document.getElementById("wordCount");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const clearBtn = document.getElementById("clearBtn");
const jsonArea = document.getElementById("jsonArea");

// ---------- Загрузка и сохранение ----------

function loadPairs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        pairs = parsed;
      } else {
        pairs = [...defaultPairs];
      }
    } catch {
      pairs = [...defaultPairs];
    }
  } else {
    pairs = [...defaultPairs];
  }
  rebuildIndex();
  renderDict();
}

function savePairs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
  rebuildIndex();
  renderDict();
}

// Индексы для быстрого перевода
function rebuildIndex() {
  ruToLk = {};
  lkToRu = {};
  for (const { ru, lk } of pairs) {
    if (!ru || !lk) continue;
    ruToLk[ru.toLowerCase()] = lk;
    lkToRu[lk.toLowerCase()] = ru;
  }
}

// ---------- Перевод ----------

function isWord(token) {
  return /[^\s]/.test(token);
}

function isCapitalized(word) {
  if (!word) return false;
  return word[0] === word[0].toUpperCase();
}

function applyCase(original, translated) {
  if (!translated) return original;
  if (original.toUpperCase() === original) {
    return translated.toUpperCase();
  }
  if (isCapitalized(original)) {
    return translated[0].toUpperCase() + translated.slice(1);
  }
  return translated;
}

function translateText() {
  const dir = directionSelect.value;
  const text = inputText.value;
  if (!text.trim()) {
    outputText.value = "";
    return;
  }

  const tokens = text.split(/(\s+|[.,!?;:"'(){}\[\]«»])/u);
  const result = tokens.map((token) => {
    if (!isWord(token)) return token;

    const lower = token.toLowerCase();
    let translated;
    if (dir === "ru-to-lk") {
      translated = ruToLk[lower] ?? token;
    } else {
      translated = lkToRu[lower] ?? token;
    }
    return applyCase(token, translated);
  });

  outputText.value = result.join("");
}

// ---------- Работа со словарём ----------

function renderDict() {
  dictList.innerHTML = "";
  wordCount.textContent = `${pairs.length} слов`;

  if (!pairs.length) {
    dictList.textContent = "Словарь пуст — добавь первые слова.";
    return;
  }

  pairs.forEach((pair, idx) => {
    const row = document.createElement("div");
    row.className = "dict-row";

    const ruSpan = document.createElement("span");
    ruSpan.textContent = pair.ru;

    const lkSpan = document.createElement("span");
    lkSpan.textContent = pair.lk;

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.title = "Удалить";
    delBtn.addEventListener("click", () => {
      pairs.splice(idx, 1);
      savePairs();
    });

    row.appendChild(ruSpan);
    row.appendChild(lkSpan);
    row.appendChild(delBtn);
    dictList.appendChild(row);
  });
}

function addWord() {
  const ru = ruWordInput.value.trim();
  const lk = lkWordInput.value.trim();

  if (!ru || !lk) return;

  // если уже есть такая пара — обновим
  const existing = pairs.find(
    (p) => p.ru.toLowerCase() === ru.toLowerCase()
  );
  if (existing) {
    existing.lk = lk;
  } else {
    pairs.push({ ru, lk });
  }

  ruWordInput.value = "";
  lkWordInput.value = "";
  savePairs();
}

// ---------- Импорт / экспорт ----------

function exportJSON() {
  jsonArea.value = JSON.stringify(pairs, null, 2);
}

function importJSON() {
  const raw = jsonArea.value.trim();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    pairs = parsed
      .filter((p) => p && typeof p.ru === "string" && typeof p.lk === "string")
      .map((p) => ({ ru: p.ru.trim(), lk: p.lk.trim() }));
    savePairs();
  } catch (e) {
    alert("Ошибка JSON при импорте словаря.");
  }
}

function clearDict() {
  if (!confirm("Точно стереть локальный словарь?")) return;
  pairs = [];
  savePairs();
}

// ---------- События ----------

translateBtn.addEventListener("click", translateText);
swapBtn.addEventListener("click", () => {
  const dir = directionSelect.value;
  directionSelect.value = dir === "ru-to-lk" ? "lk-to-ru" : "ru-to-lk";
  const inVal = inputText.value;
  inputText.value = outputText.value;
  outputText.value = inVal;
  translateText();
});

inputText.addEventListener("input", () => {
  // лайв-перевод можно убрать, если не нравится
  translateText();
});

addWordBtn.addEventListener("click", addWord);
ruWordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    lkWordInput.focus();
  }
});
lkWordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addWord();
  }
});

exportBtn.addEventListener("click", exportJSON);
importBtn.addEventListener("click", importJSON);
clearBtn.addEventListener("click", clearDict);

// Старт
loadPairs();
