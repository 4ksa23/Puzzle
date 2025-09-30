document.addEventListener("DOMContentLoaded", () => {
    const sizeSelect = document.getElementById("sizeSelect");
    const imgUpload = document.getElementById("imgUpload");
    const shuffleBtn = document.getElementById("shuffleBtn");
    const resetBtn = document.getElementById("resetBtn");
    const showSolBtn = document.getElementById("showSolBtn");
    const boardContainer = document.getElementById("boardContainer");
    const movesEl = document.getElementById("moves");
    const timerEl = document.getElementById("timer");
    const message = document.getElementById("message");

    let N = parseInt(sizeSelect.value, 10); // board size
    let board = []; // array of numbers: 1..N*N-1 and 0 for empty
    let emptyIndex = -1;
    let moves = 0;
    let timer = null;
    let seconds = 0;
    let imageURL = ""; // if user uploaded image
    let useImage = false;

    function formatTime(s) {
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    function startTimer() {
        stopTimer();
        seconds = 0;
        timerEl.textContent = formatTime(seconds);
        timer = setInterval(() => {
            seconds++;
            timerEl.textContent = formatTime(seconds);
        }, 1000);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function initBoard(n) {
        N = n;
        const total = N * N;
        board = [];
        for (let i = 1; i < total; i++) board.push(i);
        board.push(0); // empty tile
        emptyIndex = board.indexOf(0);
        moves = 0;
        movesEl.textContent = 0;
        timerEl.textContent = "00:00";
        message.textContent = "";
        renderBoard();
    }

    function renderBoard() {
        boardContainer.innerHTML = "";
        const boardEl = document.createElement("div");
        boardEl.className = "board";
        boardEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
        boardEl.style.width = Math.min(520, N * 120) + "px";
        boardEl.style.height = Math.min(520, N * 120) + "px";

        // For image slicing, set CSS var --n for tiles
        boardEl.style.setProperty("--n", N);

        board.forEach((val, idx) => {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.dataset.index = idx;
            tile.dataset.value = val;
            tile.style.fontSize = `${Math.max(14, 28 - N * 2)}px`;

            if (val === 0) {
                tile.classList.add("empty");
                tile.textContent = "";
            } else {
                if (useImage && imageURL) {
                    tile.dataset.bg = "y";
                    const pos = calcBgPos(val - 1);
                    tile.style.backgroundImage = `url("${imageURL}")`;
                    tile.style.backgroundPosition = `${pos.x}% ${pos.y}%`;
                } else {
                    tile.textContent = val;
                }
            }
            tile.addEventListener("click", onTileClick);
            boardEl.appendChild(tile);
        });

        boardContainer.appendChild(boardEl);
    }

    function calcBgPos(idx) {
        const row = Math.floor(idx / N);
        const col = idx % N;
        const x = (col / (N - 1)) * 100;
        const y = (row / (N - 1)) * 100;
        return { x, y };
    }

    function onTileClick(e) {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (canMove(idx)) {
            moveTile(idx);
            renderBoard();
            moves++;
            movesEl.textContent = moves;
            if (moves === 1 && !timer) startTimer();
            if (isSolved()) {
                stopTimer();
                message.textContent = `Selamat! Puzzle terselesaikan dalam ${moves} langkah, waktu ${formatTime(seconds)}.`;
            }
        }
    }

    function canMove(idx) {
        // allowed if idx is adjacent to empty (up/down/left/right)
        const r1 = Math.floor(idx / N);
        const c1 = idx % N;
        const r2 = Math.floor(emptyIndex / N);
        const c2 = emptyIndex % N;
        return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
    }

    function moveTile(idx) {
        const temp = board[idx];
        board[idx] = board[emptyIndex];
        board[emptyIndex] = temp;
        emptyIndex = idx;
    }
    
    function isSolvable(arr, n) {
        // classic inversion count method
        const list = arr.filter(x => x !== 0);
        let inv = 0;
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                if (list[i] > list[j]) inv++;
            }
        }
        if (n % 2 === 1) {
            return inv % 2 === 0;
        } else {
            // blank row from bottom (1-indexed)
            const blankRowFromBottom = n - Math.floor(arr.indexOf(0) / n);
            if (blankRowFromBottom % 2 === 0) return inv % 2 === 1;
            else return inv % 2 === 0;
        }
    }

    function shuffleBoard() {
        const total = N * N;
        let arr = [];
        do {
            arr = [];
            for (let i = 1; i < total; i++) arr.push(i);
            // Fisher-Yates shuffle
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            arr.push(0);
        } while (!isSolvable(arr, N) || isArraySolved(arr));

        board = arr;
        emptyIndex = board.indexOf(0);
        moves = 0;
        movesEl.textContent = moves;
        stopTimer();
        timerEl.textContent = "00:00";
        message.textContent = "";
        renderBoard();
    }

    function isSolved() {
        for (let i = 0; i < board.length - 1; i++) {
            if (board[i] !== i + 1) return false;
        }
        return board[board.length - 1] === 0;
    }

    function isArraySolved(arr) {
        for (let i = 0; i < arr.length - 1; i++) if (arr[i] !== i + 1) return false;
        return arr[arr.length - 1] === 0;
    }

    // Handlers
    sizeSelect.addEventListener("change", (e) => {
        initBoard(parseInt(e.target.value, 10));
    });

    shuffleBtn.addEventListener("click", async () => {
        if (imgUpload.files.length > 0) useImage = true;
        shuffleBoard();
    });
    
    resetBtn.addEventListener("click", () => {
        initBoard(N);
    });

    showSolBtn.addEventListener("click", () => {
        const original = board.slice();
        const solvedBoard = [];
        for (let i = 1; i < N * N; i++) solvedBoard.push(i);
        solvedBoard.push(0);
        board = solvedBoard;
        renderBoard();
        setTimeout(() => {
            board = original;
            renderBoard();
        }, 1200);
    });

    imgUpload.addEventListener("change", (e) => {
        const f = e.target.files[0];
        if (f) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                imageURL = ev.target.result;
                useImage = true;
                renderBoard(); // to apply background if needed
            };
            reader.readAsDataURL(f);
        }
    });

    // Initialize
    initBoard(N);
});