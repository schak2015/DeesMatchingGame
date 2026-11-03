const animals = [
  { name: "Cow", picture: "🐮" },
  { name: "Pig", picture: "🐷" },
  { name: "Chicken", picture: "🐥" },
  { name: "Sheep", picture: "🐑" },
  { name: "Horse", picture: "🐴" },
  { name: "Duck", picture: "🦆" }
];

const board = document.querySelector("#game-board");
const pairsCount = document.querySelector("#pairs-count");
const turnCount = document.querySelector("#turn-count");
const message = document.querySelector("#game-message");
const restartButton = document.querySelector("#restart-button");
const musicToggle = document.querySelector("#music-toggle");

let firstCard = null;
let secondCard = null;
let locked = false;
let turns = 0;
let matchedPairs = 0;
let resolveTimer = null;
let audioContext = null;
let musicTimer = null;
let musicNote = 0;

const melody = [392, 440, 523.25, 440, 349.23, 392, 440, 392, 329.63, 392, 440, 523.25];

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}

function makeCard(animal, index) {
  const card = document.createElement("button");
  card.className = "card";
  card.type = "button";
  card.dataset.animal = animal.name;
  card.setAttribute("aria-label", `Card ${index + 1}, face down`);
  card.setAttribute("aria-pressed", "false");

  const back = document.createElement("span");
  back.className = "card-back";
  back.setAttribute("aria-hidden", "true");
  back.textContent = "✿";

  const face = document.createElement("span");
  face.className = "card-face";
  face.setAttribute("aria-hidden", "true");
  const picture = document.createElement("span");
  picture.className = "animal";
  picture.textContent = animal.picture;
  const name = document.createElement("span");
  name.className = "animal-name";
  name.textContent = animal.name;
  face.append(picture, name);

  card.append(back, face);
  card.addEventListener("click", () => flipCard(card, animal));
  return card;
}

function dealCards() {
  board.replaceChildren();
  const cards = shuffle([...animals, ...animals]);
  cards.forEach((animal, index) => board.append(makeCard(animal, index)));
}

function setCardFace(card, animal, isUp) {
  card.classList.toggle("is-face-up", isUp);
  card.setAttribute("aria-pressed", String(isUp));
  card.setAttribute("aria-label", isUp ? animal.name : "Face-down animal card");
}

function flipCard(card, animal) {
  if (locked || card.classList.contains("is-face-up") || card.classList.contains("is-matched")) return;

  setCardFace(card, animal, true);
  playTone(440, 0.08, 0.025);

  if (!firstCard) {
    firstCard = { element: card, animal };
    message.textContent = `You found a ${animal.name}! Find its friend.`;
    return;
  }

  secondCard = { element: card, animal };
  turns += 1;
  turnCount.textContent = String(turns);

  if (firstCard.animal.name === secondCard.animal.name) {
    firstCard.element.classList.add("is-matched");
    secondCard.element.classList.add("is-matched");
    firstCard.element.disabled = true;
    secondCard.element.disabled = true;
    matchedPairs += 1;
    pairsCount.textContent = `${matchedPairs} / ${animals.length}`;
    playAnimalSound(firstCard.animal.name);
    firstCard = null;
    secondCard = null;

    if (matchedPairs === animals.length) {
      message.textContent = `Wonderful! You found every animal in ${turns} turns!`;
      message.classList.add("is-win");
      playWinSong();
    } else {
      message.textContent = "A perfect match! Find another pair.";
    }
    return;
  }

  locked = true;
  message.textContent = "Not a match this time. Try two more!";
  resolveTimer = window.setTimeout(() => {
    setCardFace(firstCard.element, firstCard.animal, false);
    setCardFace(secondCard.element, secondCard.animal, false);
    firstCard = null;
    secondCard = null;
    locked = false;
    resolveTimer = null;
    message.textContent = "Pick two cards to find a matching pair!";
  }, 950);
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  return audioContext;
}

function playTone(frequency, duration, volume) {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playAnimalSound(animalName) {
  const calls = {
    Cow: [{ start: 130, end: 92, duration: 0.42, wave: "sawtooth", filter: 420 }],
    Pig: [
      { start: 190, end: 115, duration: 0.16, wave: "sawtooth", filter: 650 },
      { start: 250, end: 145, duration: 0.2, wave: "sawtooth", filter: 650, delay: 0.2 }
    ],
    Chicken: [
      { start: 620, end: 450, duration: 0.1, wave: "square", filter: 1500 },
      { start: 690, end: 500, duration: 0.1, wave: "square", filter: 1500, delay: 0.13 },
      { start: 560, end: 420, duration: 0.16, wave: "square", filter: 1400, delay: 0.27 }
    ],
    Sheep: [{ start: 220, end: 330, duration: 0.48, wave: "triangle", filter: 900 }],
    Horse: [
      { start: 210, end: 300, duration: 0.13, wave: "sawtooth", filter: 1100 },
      { start: 300, end: 440, duration: 0.15, wave: "sawtooth", filter: 1300, delay: 0.14 },
      { start: 440, end: 350, duration: 0.18, wave: "sawtooth", filter: 1100, delay: 0.3 }
    ],
    Duck: [
      { start: 480, end: 270, duration: 0.18, wave: "square", filter: 950 },
      { start: 430, end: 240, duration: 0.22, wave: "square", filter: 850, delay: 0.2 }
    ]
  };
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();

  for (const call of calls[animalName] || []) {
    const startTime = context.currentTime + (call.delay || 0);
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = call.wave;
    oscillator.frequency.setValueAtTime(call.start, startTime);
    oscillator.frequency.linearRampToValueAtTime(call.end, startTime + call.duration);
    filter.type = "lowpass";
    filter.frequency.value = call.filter;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.035, startTime + 0.025);
    gain.gain.setValueAtTime(0.035, startTime + call.duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + call.duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + call.duration);
  }
}

function playMusicNote() {
  playTone(melody[musicNote % melody.length], 0.5, 0.018);
  musicNote += 1;
}

function startMusic() {
  const context = getAudioContext();
  if (!context) {
    message.textContent = "Music isn't available in this browser, but you can still play!";
    return false;
  }
  if (context.state === "suspended") context.resume();
  playMusicNote();
  musicTimer = window.setInterval(playMusicNote, 540);
  musicToggle.textContent = "♫ Music on";
  musicToggle.setAttribute("aria-pressed", "true");
  return true;
}

function stopMusic() {
  window.clearInterval(musicTimer);
  musicTimer = null;
  musicToggle.textContent = "♫ Music off";
  musicToggle.setAttribute("aria-pressed", "false");
}

function playWinSong() {
  [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
    window.setTimeout(() => playTone(note, 0.3, 0.05), index * 150);
  });
}

function startGame() {
  if (resolveTimer !== null) {
    window.clearTimeout(resolveTimer);
    resolveTimer = null;
  }
  firstCard = null;
  secondCard = null;
  locked = false;
  turns = 0;
  matchedPairs = 0;
  turnCount.textContent = "0";
  pairsCount.textContent = `0 / ${animals.length}`;
  message.classList.remove("is-win");
  message.textContent = "Pick two cards to find a matching pair!";
  dealCards();
}

musicToggle.addEventListener("click", () => {
  if (musicTimer === null) startMusic();
  else stopMusic();
});

restartButton.addEventListener("click", startGame);

startGame();