// Ключ для localStorage
const STORAGE_KEY = "liekerseDictionary_v2";

// Базовые слова
const defaultPairs = [
  { ru: "привет", lk: "lihek" },
  { ru: "мир", lk: "kaar" },
  { ru: "я", lk: "sa" },
  { ru: "ты", lk: "tu" },
  { ru: "моя", lk: "doi" },
  { ru: "мой", lk: "doi" },
  { ru: "моё", lk: "doi" },
  { ru: "мои", lk: "doi" }
];

let pairs = [];
let ruToLk = {};
let lkToRu = {};

// DOM элементы (безопасная инициализация)
const directionSelect = document.getElementById("direction");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");
const copyBtn = document.getElementById("copyBtn");

const ruWordInput = document.getElementById("ruWord");
const lkWordInput = document.getElementById("lkWord");
const addWordBtn = document.getElementById("addWordBtn");

const dictList = document.getElementById("dictList");
const wordCount = document.getElementById("wordCount");
const searchDict = document.getElementById("searchDict");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const clearBtn = document.getElementById("clearBtn");
const jsonArea = document.getElementById("jsonArea");

const inputCount = document.getElementById("inputCount");
const outputCount = document.getElementById("outputCount");
const dictSize = document.getElementById("dictSize");
const translatedWords = document.getElementById("translatedWords");
const coverage = document.getElementById("coverage");

// Правила для лемматизации (упрощённые)
const ruStems = {
  // Местоимения
  "моя": "мой", "моё": "мой", "мои": "мой", "моего": "мой", "моему": "мой", "моим": "мой", "моём": "мой",
  "твоя": "твой", "твоё": "твой", "твои": "твой", "твоего": "твой", "твоему": "твой",
  "наша": "наш", "наше": "наш", "наши": "наш", "нашего": "наш", "нашему": "наш",
  "ваша": "ваш", "ваше": "ваш", "ваши": "ваш", "вашего": "ваш", "вашему": "ваш",
};

// ---------- Загрузка и сохранение ----------

function loadPairs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
  updateStats();
}

function savePairs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
  rebuildIndex();
  renderDict();
  updateStats();
}

// Индексы для быстрого перевода
function rebuildIndex() {
  ruToLk = {};
  lkToRu = {};
  
  for (const { ru, lk } of pairs) {
    if (!ru || !lk) continue;
    const ruLower = ru.toLowerCase();
    const lkLower = lk.toLowerCase();
    
    ruToLk[ruLower] = lk;
    lkToRu[lkLower] = ru;
    
    // Добавляем стемминг
    const stem = ruStems[ruLower];
    if (stem && !ruToLk[stem]) {
      ruToLk[stem] = lk;
    }
  }
}

// ---------- Умный перевод ----------

function normalizeWord(word) {
  const lower = word.toLowerCase();
  return ruStems[lower] || lower;
}

function isWord(token) {
  return /[а-яёa-z]/i.test(token);
}

function isCapitalized(word) {
  if (!word) return false;
  return word[0] === word[0].toUpperCase();
}

function isAllCaps(word) {
  return word === word.toUpperCase() && word !== word.toLowerCase();
}

function applyCase(original, translated) {
  if (!translated) return original;
  if (isAllCaps(original)) {
    return translated.toUpperCase();
  }
  if (isCapitalized(original)) {
    return translated[0].toUpperCase() + translated.slice(1);
  }
  return translated;
}

function translateText() {
  if (!inputText || !outputText || !directionSelect) return;
  
  const dir = directionSelect.value;
  const text = inputText.value;
  
  if (!text.trim()) {
    outputText.value = "";
    updateCharCounts();
    return;
  }

  const tokens = text.split(/(\s+|[.,!?;:"'(){}\[\]«»—–-])/u);
  let wordsTranslated = 0;
  let totalWords = 0;
  
  const result = tokens.map((token) => {
    if (!isWord(token)) return token;
    
    totalWords++;
    const normalized = normalizeWord(token);
    const lower = normalized.toLowerCase();
    
    let translated;
    if (dir === "ru-to-lk") {
      translated = ruToLk[lower];
    } else {
      translated = lkToRu[lower];
    }
    
    if (translated) {
      wordsTranslated++;
      return applyCase(token, translated);
    }
    
    return token;
  });

  outputText.value = result.join("");
  updateCharCounts();
  
  if (translatedWords && coverage) {
    translatedWords.textContent = wordsTranslated;
    coverage.textContent = totalWords > 0 ? Math.round((wordsTranslated / totalWords) * 100) + "%" : "0%";
  }
}

function updateCharCounts() {
  if (inputCount && inputText) {
    inputCount.textContent = `${inputText.value.length} символов`;
  }
  if (outputCount && outputText) {
    outputCount.textContent = `${outputText.value.length} символов`;
  }
}

function updateStats() {
  if (dictSize) {
    dictSize.textContent = pairs.length;
  }
}

// ---------- Работа со словарём ----------

function renderDict(filter = "") {
  if (!dictList) return;
  
  dictList.innerHTML = "";
  
  if (wordCount) {
    wordCount.textContent = `${pairs.length} слов`;
  }

  if (!pairs.length) {
    return;
  }

  const filtered = filter 
    ? pairs.filter(p => 
        p.ru.toLowerCase().includes(filter.toLowerCase()) || 
        p.lk.toLowerCase().includes(filter.toLowerCase())
      )
    : pairs;

  filtered.forEach((pair, idx) => {
    const row = document.createElement("div");
    row.className = "dict-row";

    const ruSpan = document.createElement("span");
    ruSpan.textContent = pair.ru;

    const lkSpan = document.createElement("span");
    lkSpan.textContent = pair.lk;

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className = "btn-danger";
    delBtn.title = "Удалить";
    delBtn.addEventListener("click", () => {
      const realIdx = pairs.indexOf(pair);
      if (realIdx > -1) {
        pairs.splice(realIdx, 1);
        savePairs();
      }
    });

    row.appendChild(ruSpan);
    row.appendChild(lkSpan);
    row.appendChild(delBtn);
    dictList.appendChild(row);
  });
}

function addWord() {
  if (!ruWordInput || !lkWordInput) return;
  
  const ru = ruWordInput.value.trim();
  const lk = lkWordInput.value.trim();

  if (!ru || !lk) {
    alert("Заполни оба поля!");
    return;
  }

  // Проверяем, есть ли уже такое слово
  const existing = pairs.find(p => p.ru.toLowerCase() === ru.toLowerCase());
  
  if (existing) {
    existing.lk = lk;
  } else {
    pairs.push({ ru, lk });
  }

  ruWordInput.value = "";
  lkWordInput.value = "";
  savePairs();
  
  // Фокус обратно на первое поле
  ruWordInput.focus();
}

// ---------- Импорт / экспорт ----------

function exportJSON() {
  if (!jsonArea) return;
  jsonArea.value = JSON.stringify(pairs, null, 2);
}

function importJSON() {
  if (!jsonArea) return;
  
  const raw = jsonArea.value.trim();
  if (!raw) {
    alert("JSON пустой!");
    return;
  }
  
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      alert("JSON должен быть массивом!");
      return;
    }
    
    pairs = parsed.filter(p => p && typeof p.ru === "string" && typeof p.lk === "string")
                   .map(p => ({ ru: p.ru.trim(), lk: p.lk.trim() }));
    savePairs();
    alert(`Импортировано ${pairs.length} слов!`);
  } catch (e) {
    alert("Ошибка JSON: " + e.message);
  }
}

function clearDict() {
  if (!confirm("Точно удалить весь словарь?")) return;
  pairs = [];
  savePairs();
}

// ---------- События ----------

if (translateBtn) {
  translateBtn.addEventListener("click", translateText);
}

if (swapBtn) {
  swapBtn.addEventListener("click", () => {
    if (!directionSelect || !inputText || !outputText) return;
    
    const dir = directionSelect.value;
    directionSelect.value = dir === "ru-to-lk" ? "lk-to-ru" : "ru-to-lk";
    
    const temp = inputText.value;
    inputText.value = outputText.value;
    outputText.value = temp;
    
    translateText();
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    if (!outputText) return;
    outputText.select();
    document.execCommand("copy");
    copyBtn.textContent = "✓ Скопировано";
    setTimeout(() => {
      copyBtn.innerHTML = "<span>📋</span> Копировать";
    }, 2000);
  });
}

if (inputText) {
  inputText.addEventListener("input", () => {
    translateText();
  });
}

if (addWordBtn) {
  addWordBtn.addEventListener("click", addWord);
}

if (ruWordInput) {
  ruWordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (lkWordInput) lkWordInput.focus();
    }
  });
}

if (lkWordInput) {
  lkWordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWord();
    }
  });
}

if (searchDict) {
  searchDict.addEventListener("input", (e) => {
    renderDict(e.target.value);
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", exportJSON);
}

if (importBtn) {
  importBtn.addEventListener("click", importJSON);
}

if (clearBtn) {
  clearBtn.addEventListener("click", clearDict);
}

// Старт
loadPairs();
