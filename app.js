// --- DOM Elements ---
const loginScreen = document.getElementById('login-screen');
const playerNameInput = document.getElementById('playerName');
const avatarSelectionContainer = document.getElementById('avatar-selection');
const avatarChoices = document.querySelectorAll('.avatar-choice');
const avatarError = document.getElementById('avatar-error');
const startGameBtn = document.getElementById('startGameBtn');
const loginError = document.getElementById('login-error');

const gameScreen = document.getElementById('game-screen');
const currentPlayerNameDisplay = document.getElementById('current-player-name');
const currentPlayerScoreDisplay = document.getElementById('current-player-score');
const currentStreakDisplay = document.getElementById('current-streak-display');
const timerDisplay = document.getElementById('timer').querySelector('span');

const questionContainer = document.getElementById('question-container');
const questionMetaDisplay = document.getElementById('question-meta');
const qDifficultyDisplay = document.getElementById('q-difficulty');
const qPointsDisplay = document.getElementById('q-points');
const questionText = document.getElementById('question-text');
const answerOptionsContainer = document.getElementById('answer-options');
const shortAnswerInput = document.getElementById('short-answer-input');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const feedbackDisplay = document.getElementById('feedback');

const leaderboardContainer = document.getElementById('leaderboard-container');
const leaderboardList = document.getElementById('leaderboard-list');

const finalScreen = document.getElementById('final-screen');
const finalPlayerNameDisplay = document.getElementById('final-player-name');
const finalScoreDisplay = document.getElementById('final-score');
const finalRankDisplay = document.getElementById('final-rank');
const restartGameBtn = document.getElementById('restartGameBtn');
//const shareScoreWPBtn = document.getElementById('shareScoreWPBtn');
const copyScoreBtn = document.getElementById('copyScoreBtn');

const warningPopup = document.getElementById('warning-popup');

// --- Sound Effects (Optional) ---
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const tickSound = document.getElementById('tick-sound');
const warningSound = document.getElementById('warning-sound');

// --- Firebase Configuration (REPLACE WITH YOUR ACTUAL CONFIG) ---
const firebaseConfig = {
    apiKey: "AIzaSyC0zzm_AGiKqORFTuNcBwxTkonQouTRG7w",
    authDomain: "su-challenge.firebaseapp.com",
    databaseURL: "https://su-challenge-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "su-challenge",
    storageBucket: "su-challenge.firebasestorage.app",
    messagingSenderId: "77986609283",
    appId: "1:77986609283:web:b8f9117935b08f0969c3b6"
 

    
};
// --- END Firebase Configuration ---

// Initialize Firebase
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_")) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();


// --- Game State ---
let currentPlayerName = '';
let currentScore = 0;
let currentQuestionIndex = 0;
let timer;
let timeLeft = 20; // Default timer per question
let gamePaused = false;
let questions = [];
let selectedAvatarId = null;
let currentStreak = 0;
const STREAK_BONUS_THRESHOLD = 3;
const STREAK_BONUS_POINTS = 5; // Extra points for a streak

// --- Questions Data (with difficulty and points) ---
const allQuestions = [
    {
        text: "What is the output of `console.log(typeof null);` in JavaScript?",
        type: "mcq",
        options: ["object", "null", "undefined", "string"],
        answer: "object",
        difficulty: "easy",
        points: 5
    },
    {
        text: "Which keyword is used to declare a variable that cannot be reassigned?",
        type: "mcq",
        options: ["let", "var", "const", "static"],
        answer: "const",
        difficulty: "easy",
        points: 5
    },
    {
        text: "What does `NaN` stand for?",
        type: "short",
        answer: "Not a Number",
        difficulty: "medium",
        points: 10
    },
    {
        text: "What is the result of `2 + '2'` in JavaScript?",
        type: "mcq",
        options: ["4", "'22'", "Error", "NaN"],
        answer: "'22'",
        difficulty: "medium",
        points: 10
    },
    {
        text: "Which HTML tag links an external JS file?",
        type: "short",
        answer: "<script>", // Users might type full tag or just 'script'
        difficulty: "easy",
        points: 5
    },
    {
        text: "In CSS, how do you select an element with id 'header'?",
        type: "short",
        answer: "#header",
        difficulty: "medium",
        points: 10
    },
    {
        text: "Output of `console.log(1 == '1');`?",
        type: "mcq",
        options: ["true", "false", "Error", "undefined"],
        answer: "true",
        difficulty: "medium",
        points: 10
    },
    {
        text: "What is the main purpose of the `alt` attribute in an `<img>` tag?",
        type: "mcq",
        options: ["Image styling", "Image source", "Accessibility & SEO", "Image alignment"],
        answer: "Accessibility & SEO",
        difficulty: "hard",
        points: 15
    },
    {
        text: "Which of these is NOT a JavaScript data type?",
        type: "mcq",
        options: ["String", "Boolean", "Character", "Number"],
        answer: "Character",
        difficulty: "easy",
        points: 5
    }
];

// --- Event Listeners ---
startGameBtn.addEventListener('click', handleLogin);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !startGameBtn.disabled) handleLogin();
});

avatarChoices.forEach(choice => {
    choice.addEventListener('click', () => {
        if (loginScreen.classList.contains('hidden')) return; // Only allow selection on login screen
        avatarChoices.forEach(ac => ac.classList.remove('selected'));
        choice.classList.add('selected');
        selectedAvatarId = choice.dataset.avatarid;
        avatarError.textContent = "";
    });
});

submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
restartGameBtn.addEventListener('click', () => {
    finalScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    leaderboardContainer.classList.add('hidden'); // Hide leaderboard on login
    resetLoginScreen();
});

/*shareScoreBtn.addEventListener('click', () => {
    const gameUrl = window.location.href;
    const rankText = finalRankDisplay.textContent || 'N/A';
    const tweetText = `I scored ${currentScore} points in CodePlay Challenge (Rank #${rankText})! Can you beat me?`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(gameUrl)}`;
    window.open(twitterUrl, '_blank');
}); */

copyScoreBtn.addEventListener('click', () => {
    const gameUrl = window.location.href;
    const rankText = finalRankDisplay.textContent || 'N/A';
    const textToCopy = `I scored ${currentScore} points in CodePlay Challenge (Rank #${rankText})! Play here: ${gameUrl}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Score and link copied to clipboard!");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert("Failed to copy. Please copy manually.");
    });
});

document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('beforeunload', handleBeforeUnload);

// --- Functions ---

function checkFirebaseConfig() {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_") ||
        !firebaseConfig.databaseURL || firebaseConfig.databaseURL.includes("YOUR_")) {
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #FF0000; font-size: 1.5em;">
                <h1>Configuration Error</h1>
                <p>Firebase is not configured correctly. Please update <code>firebaseConfig</code> in <code>app.js</code> with your Firebase project details, especially the API Key and Database URL.</p>
            </div>`;
        return false;
    }
    return true;
}


function resetLoginScreen() {
    playerNameInput.value = "";
    avatarChoices.forEach(ac => ac.classList.remove('selected'));
    selectedAvatarId = null;
    loginError.textContent = "";
    avatarError.textContent = "";
    startGameBtn.disabled = false;
}

function handleLogin() {
    if (!checkFirebaseConfig()) return;
    startGameBtn.disabled = true; // Prevent multiple clicks

    const name = playerNameInput.value.trim();
    if (name === "") {
        loginError.textContent = "Hacker name cannot be empty!";
        startGameBtn.disabled = false;
        return;
    }
    loginError.textContent = "";

    if (!selectedAvatarId) {
        avatarError.textContent = "Please select an avatar!";
        startGameBtn.disabled = false;
        return;
    }
    avatarError.textContent = "";

    currentPlayerName = name;
    currentPlayerNameDisplay.textContent = currentPlayerName;

    database.ref('players/' + currentPlayerName).set({
        name: currentPlayerName,
        score: 0,
        avatarId: selectedAvatarId
    }).then(() => {
        loginScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        leaderboardContainer.classList.remove('hidden');
        startGame();
    }).catch(error => {
        console.error("Firebase write error during login:", error);
        loginError.textContent = "Error connecting. Try again.";
        startGameBtn.disabled = false;
    });
}

function startGame() {
    currentScore = 0;
    currentQuestionIndex = 0;
    currentStreak = 0;
    currentPlayerScoreDisplay.textContent = currentScore;
    if (currentStreakDisplay) currentStreakDisplay.textContent = currentStreak;
    feedbackDisplay.textContent = "";
    questions = shuffleArray([...allQuestions]);

    if (questions.length === 0) {
        questionText.textContent = "No questions loaded!";
        questionMetaDisplay.classList.add('hidden');
        return;
    }
    displayQuestion();
    updateLeaderboard(); // Start listening for leaderboard updates
}

function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endGame();
        return;
    }

    gamePaused = false;
    const question = questions[currentQuestionIndex];
    questionText.textContent = `Q${currentQuestionIndex + 1}: ${question.text}`;

    if (questionMetaDisplay && qDifficultyDisplay && qPointsDisplay) {
        qDifficultyDisplay.textContent = question.difficulty ? question.difficulty.toUpperCase() : 'N/A';
        qPointsDisplay.textContent = question.points !== undefined ? question.points : 'N/A';
        questionMetaDisplay.classList.remove('hidden');
    } else {
        if (questionMetaDisplay) questionMetaDisplay.classList.add('hidden');
    }

    answerOptionsContainer.innerHTML = "";
    shortAnswerInput.value = "";

    if (question.type === "mcq") {
        shortAnswerInput.classList.add('hidden');
        submitAnswerBtn.classList.add('hidden');
        question.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', () => handleAnswerSelection(option));
            answerOptionsContainer.appendChild(button);
        });
    } else if (question.type === "short") {
        answerOptionsContainer.innerHTML = ""; // Clear any MCQ buttons
        shortAnswerInput.classList.remove('hidden');
        submitAnswerBtn.classList.remove('hidden');
        shortAnswerInput.focus();
    }

    timeLeft = 20; // Reset timer for each question
    timerDisplay.textContent = timeLeft;
    startTimer();
}

function startTimer() {
    if (tickSound) {
        tickSound.currentTime = 0;
        tickSound.play().catch(e => console.warn("Tick sound play error:", e));
    }
    clearInterval(timer);
    timer = setInterval(() => {
        if (gamePaused) return;

        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (tickSound) tickSound.pause();
            handleAnswer(null, true); // Timeout
        }
    }, 1000);
}

function handleAnswerSelection(selectedOption) {
    handleAnswer(selectedOption);
}

function handleSubmitAnswer() {
    const shortAnswer = shortAnswerInput.value.trim();
    // Allow empty submission for short answer to signify giving up or moving on if time is running out
    // Or add validation: if (shortAnswer === "" && timeLeft > 0) { feedback... return; }
    handleAnswer(shortAnswer);
}

function handleAnswer(answer, timeout = false) {
    clearInterval(timer);
    if (tickSound) {
        tickSound.pause();
    }

    // Disable inputs immediately
    answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
    shortAnswerInput.disabled = true;
    submitAnswerBtn.disabled = true;


    const question = questions[currentQuestionIndex];
    let correct = false;
    let pointsEarnedThisTurn = 0;

    if (timeout) {
        feedbackDisplay.textContent = "Time's up!";
        feedbackDisplay.className = 'feedback-message';
        if (wrongSound) wrongSound.play().catch(e => console.warn("Sound play error:", e));
        currentStreak = 0;
    } else {
        if (question.type === "mcq") {
            correct = (answer === question.answer);
        } else if (question.type === "short") {
            // For short answers, be flexible with case and extra spaces
            correct = (answer.toLowerCase().trim() === question.answer.toLowerCase().trim());
        }

        if (correct) {
            currentStreak++;
            pointsEarnedThisTurn = question.points || 10; // Default to 10 if points not defined
            let basePointsForMessage = pointsEarnedThisTurn;
            let bonusMessage = "";

            if (currentStreak >= STREAK_BONUS_THRESHOLD) {
                pointsEarnedThisTurn += STREAK_BONUS_POINTS;
                bonusMessage = ` +${STREAK_BONUS_POINTS} Streak! (${currentStreak} in a row!)`;
            }

            feedbackDisplay.textContent = `Correct! +${basePointsForMessage} pts${bonusMessage}`;
            feedbackDisplay.className = 'feedback-message correct';
            currentScore += pointsEarnedThisTurn;
            if (correctSound) correctSound.play().catch(e => console.warn("Sound play error:", e));

            if (currentPlayerName && database) { // Ensure player name is set
                database.ref('players/' + currentPlayerName).update({
                    score: currentScore
                }).catch(error => console.error("Firebase score update error:", error));
            }
        } else {
            feedbackDisplay.textContent = `Wrong! The answer was: ${question.answer}`;
            feedbackDisplay.className = 'feedback-message';
            if (wrongSound) wrongSound.play().catch(e => console.warn("Sound play error:", e));
            currentStreak = 0;
        }
    }

    currentPlayerScoreDisplay.textContent = currentScore;
    if (currentStreakDisplay) currentStreakDisplay.textContent = currentStreak;

    setTimeout(() => {
        currentQuestionIndex++;
        // Re-enable inputs for next question
        answerOptionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
        shortAnswerInput.disabled = false;
        submitAnswerBtn.disabled = false;
        feedbackDisplay.textContent = "";
        displayQuestion();
    }, 2500); // Slightly shorter feedback display time
}

function updateLeaderboard() {
    if (!database) return; // Don't run if Firebase isn't initialized

    const playersRef = database.ref('players');
    playersRef.orderByChild('score').on('value', (snapshot) => {
        leaderboardList.innerHTML = "";
        const players = [];
        snapshot.forEach((childSnapshot) => {
            players.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        players.sort((a, b) => b.score - a.score); // Sort descending by score

        if (players.length === 0) {
            const li = document.createElement('li');
            li.textContent = "No players yet...";
            leaderboardList.appendChild(li);
        } else {
            players.forEach((player) => {
                const li = document.createElement('li');
                let avatarElement = '';

                if (player.avatarId && player.avatarId !== "null" && player.avatarId !== "undefined") {
                    avatarElement = `<img src="avatars/${player.avatarId}" alt="${player.name ? player.name.charAt(0) : 'P'}" class="player-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">`;
                    const avatarInitial = player.name ? player.name.charAt(0).toUpperCase() : '?';
                    avatarElement += `<span class="player-avatar-initial" style="display:none;">${avatarInitial}</span>`;
                } else {
                    const avatarInitial = player.name ? player.name.charAt(0).toUpperCase() : '?';
                    avatarElement = `<span class="player-avatar-initial">${avatarInitial}</span>`;
                }

                li.innerHTML = `
                    <span class="player-name">${avatarElement}${player.name || 'Anonymous'}</span>
                    <span class="player-score">${player.score !== undefined ? player.score : 0} pts</span>
                `;
                if (player.name === currentPlayerName) {
                    li.style.fontWeight = 'bold';
                    li.style.color = '#FFFF00'; // Highlight current player
                }
                leaderboardList.appendChild(li);
            });
        }
        window.sortedPlayers = players; // Store for rank calculation
    }, (error) => {
        console.error("Firebase leaderboard read error:", error);
        leaderboardList.innerHTML = "<li>Error loading leaderboard.</li>";
    });
}

function endGame() {
    gameScreen.classList.add('hidden');
    finalScreen.classList.remove('hidden');
    leaderboardContainer.classList.add('hidden'); // Hide live leaderboard
    if (questionMetaDisplay) questionMetaDisplay.classList.add('hidden');

    finalPlayerNameDisplay.textContent = currentPlayerName;
    finalScoreDisplay.textContent = currentScore;

    let rank = "N/A";
    if (window.sortedPlayers && window.sortedPlayers.length > 0) {
        const playerRankIndex = window.sortedPlayers.findIndex(p => p.name === currentPlayerName);
        if (playerRankIndex !== -1) {
            rank = playerRankIndex + 1;
        }
    }
    finalRankDisplay.textContent = rank;

    if (tickSound) {
        tickSound.pause();
        tickSound.currentTime = 0;
    }
}

function handleVisibilityChange() {
    if (loginScreen.classList.contains('hidden') && finalScreen.classList.contains('hidden') && currentQuestionIndex < questions.length) {
        if (document.hidden) {
            gamePaused = true;
            clearInterval(timer);
            if (tickSound) tickSound.pause();
            warningPopup.classList.remove('hidden');
            if (warningSound) warningSound.play().catch(e => console.warn("Sound play error:", e));
        } else {
            if (gamePaused) { // Only resume if it was paused by this mechanism
                gamePaused = false;
                warningPopup.classList.add('hidden');
                if (warningSound) {
                    warningSound.pause();
                    warningSound.currentTime = 0;
                }
                if (timeLeft > 0) { // Only restart timer if time is left
                    startTimer();
                }
            }
        }
    }
}

function handleBeforeUnload(event) {
    if (!loginScreen.classList.contains('hidden') &&
        !finalScreen.classList.contains('hidden') &&
        currentQuestionIndex < questions.length) {
        const confirmationMessage = "Are you sure you want to leave? Your progress might be lost or your game might end.";
        event.preventDefault();
        event.returnValue = confirmationMessage;
        return confirmationMessage;
    }
}

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Initial call to check Firebase config when script loads
checkFirebaseConfig();