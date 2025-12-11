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

// DOM элементы
const directionSelect = document.getElementById("direction");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");
const copyBtn = document.getElementById("copyBtn");

const ruWordInput = document.getElementById("ruWord");
const lkWordInput = document.getElementById("lkWord");
const addWordBtn = document.getElementById("addWordBtn");

const dictList =
