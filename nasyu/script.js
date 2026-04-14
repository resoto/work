document.addEventListener('DOMContentLoaded', () => {
    // Presets
    const presets = {
        prisoners: [
            [-5, -5], /* U, L */
            [0, -10], /* U, R */
            [-10, 0], /* D, L */
            [-1, -1]  /* D, R */
        ],
        chicken: [
            [0, 0],   /* U, L */
            [-1, 1],  /* U, R */
            [1, -1],  /* D, L */
            [-10, -10]/* D, R */
        ],
        stag: [
            [2, 2],   /* U, L */
            [0, 1],   /* U, R */
            [1, 0],   /* D, L */
            [1, 1]    /* D, R */
        ],
        clear: [
            [0, 0], [0, 0],
            [0, 0], [0, 0]
        ]
    };

    const presetBtns = document.querySelectorAll('.preset-btn');
    const calcBtn = document.getElementById('calculate-btn');
    const resultsArea = document.getElementById('results');
    const nashList = document.getElementById('nash-list');

    // Load preset
    presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.getAttribute('data-preset');
            const data = presets[type];
            if(data) {
                document.getElementById('p1-0-0').value = data[0][0];
                document.getElementById('p2-0-0').value = data[0][1];
                
                document.getElementById('p1-0-1').value = data[1][0];
                document.getElementById('p2-0-1').value = data[1][1];
                
                document.getElementById('p1-1-0').value = data[2][0];
                document.getElementById('p2-1-0').value = data[2][1];
                
                document.getElementById('p1-1-1').value = data[3][0];
                document.getElementById('p2-1-1').value = data[3][1];
                
                clearHighlights();
                resultsArea.classList.add('hidden');
            }
        });
    });

    calcBtn.addEventListener('click', calculateNashEquilibrium);

    // Auto clear highlights when input changes
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearHighlights();
            resultsArea.classList.add('hidden');
        });
    });

    function clearHighlights() {
        // Remove best response highlights
        document.querySelectorAll('.p1-best').forEach(el => el.classList.remove('p1-best'));
        document.querySelectorAll('.p2-best').forEach(el => el.classList.remove('p2-best'));
        // Remove Nash highlights
        document.querySelectorAll('.is-nash').forEach(el => el.classList.remove('is-nash'));
    }

    function calculateNashEquilibrium() {
        clearHighlights();
        
        // Read matrix
        const matrix = [
            [
                { p1: parseFloat(document.getElementById('p1-0-0').value) || 0, p2: parseFloat(document.getElementById('p2-0-0').value) || 0 },
                { p1: parseFloat(document.getElementById('p1-0-1').value) || 0, p2: parseFloat(document.getElementById('p2-0-1').value) || 0 }
            ],
            [
                { p1: parseFloat(document.getElementById('p1-1-0').value) || 0, p2: parseFloat(document.getElementById('p2-1-0').value) || 0 },
                { p1: parseFloat(document.getElementById('p1-1-1').value) || 0, p2: parseFloat(document.getElementById('p2-1-1').value) || 0 }
            ]
        ];

        let p1BestResponses = new Set(); // Stores "row,col"
        let p2BestResponses = new Set(); // Stores "row,col"

        // Player 1 (Row Player) Best Responses
        // For each column, find the max p1 payoff across all rows
        for (let col = 0; col < 2; col++) {
            let maxP1 = -Infinity;
            for (let row = 0; row < 2; row++) {
                if (matrix[row][col].p1 > maxP1) {
                    maxP1 = matrix[row][col].p1;
                }
            }
            // Mark all rows that have this max value in this col
            for (let row = 0; row < 2; row++) {
                if (matrix[row][col].p1 === maxP1) {
                    p1BestResponses.add(`${row},${col}`);
                    document.getElementById(`p1-${row}-${col}`).classList.add('p1-best');
                }
            }
        }

        // Player 2 (Col Player) Best Responses
        // For each row, find the max p2 payoff across all columns
        for (let row = 0; row < 2; row++) {
            let maxP2 = -Infinity;
            for (let col = 0; col < 2; col++) {
                if (matrix[row][col].p2 > maxP2) {
                    maxP2 = matrix[row][col].p2;
                }
            }
            // Mark all cols that have this max value in this row
            for (let col = 0; col < 2; col++) {
                if (matrix[row][col].p2 === maxP2) {
                    p2BestResponses.add(`${row},${col}`);
                    document.getElementById(`p2-${row}-${col}`).classList.add('p2-best');
                }
            }
        }

        // Find intersections (Nash Equilibriums)
        let equilibriums = [];
        const strategiesP1 = ["U", "D"];
        const strategiesP2 = ["L", "R"];

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const key = `${row},${col}`;
                if (p1BestResponses.has(key) && p2BestResponses.has(key)) {
                    equilibriums.push(`(${strategiesP1[row]}, ${strategiesP2[col]})`);
                    // Highlight cell
                    document.getElementById(`cell-${row}-${col}`).classList.add('is-nash');
                }
            }
        }

        // Display results
        nashList.innerHTML = '';
        if (equilibriums.length > 0) {
            equilibriums.forEach(eq => {
                const li = document.createElement('li');
                li.innerHTML = `🌟 ${eq}`;
                nashList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No pure strategy Nash Equilibrium found.";
            li.style.color = "var(--text-secondary)";
            nashList.appendChild(li);
        }

        resultsArea.classList.remove('hidden');
        resultsArea.style.display = 'block';
        
        // Micro-animation for results area
        setTimeout(() => {
            resultsArea.style.opacity = 1;
            resultsArea.style.transform = 'translateY(0)';
        }, 10);
    }
});
