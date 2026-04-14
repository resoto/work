document.addEventListener('DOMContentLoaded', () => {
    // State management
    let state = {
        originalServings: 2,
        targetServings: 4,
        ingredients: [
            { id: Date.now(), name: '鶏もも肉', amount: 300, unit: 'g' },
            { id: Date.now() + 1, name: '玉ねぎ', amount: 0.5, unit: '個' },
            { id: Date.now() + 2, name: '醤油', amount: 2, unit: '大さじ' }
        ]
    };

    // Elements
    const originalInput = document.getElementById('original-servings');
    const targetInput = document.getElementById('target-servings');
    const container = document.getElementById('ingredients-container');
    const addBtn = document.getElementById('add-ingredient-btn');
    const scaleBadge = document.getElementById('scale-badge');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    // Initialize Lucide
    const initIcons = () => lucide.createIcons();

    // Render functions
    const render = () => {
        const scale = state.targetServings / state.originalServings;
        scaleBadge.textContent = `${scale.toFixed(1)}倍`;

        container.innerHTML = '';
        state.ingredients.forEach(ing => {
            const row = document.createElement('div');
            row.className = 'ingredient-row';
            row.dataset.id = ing.id;

            const scaledAmount = ing.amount * scale;
            const formattedAmount = Number.isInteger(scaledAmount) 
                ? scaledAmount 
                : scaledAmount.toFixed(1).replace(/\.0$/, '');

            row.innerHTML = `
                <input type="text" class="name-input" value="${ing.name}" placeholder="材料名">
                <input type="number" class="amount-input" value="${ing.amount}" step="any" placeholder="量">
                <input type="text" class="unit-input" value="${ing.unit}" placeholder="単位">
                <div class="col-result">${formattedAmount}${ing.unit}</div>
                <button class="btn-remove" title="削除">
                    <i data-lucide="x"></i>
                </button>
            `;

            // Row events
            row.querySelector('.name-input').oninput = (e) => {
                const item = state.ingredients.find(i => i.id === ing.id);
                item.name = e.target.value;
            };

            row.querySelector('.amount-input').oninput = (e) => {
                const item = state.ingredients.find(i => i.id === ing.id);
                item.amount = parseFloat(e.target.value) || 0;
                render(); // Re-render to update result
            };

            row.querySelector('.unit-input').oninput = (e) => {
                const item = state.ingredients.find(i => i.id === ing.id);
                item.unit = e.target.value;
                render();
            };

            row.querySelector('.btn-remove').onclick = () => {
                state.ingredients = state.ingredients.filter(i => i.id !== ing.id);
                render();
            };

            container.appendChild(row);
        });

        initIcons();
    };

    // Event Listeners
    originalInput.oninput = (e) => {
        state.originalServings = parseFloat(e.target.value) || 1;
        render();
    };

    targetInput.oninput = (e) => {
        state.targetServings = parseFloat(e.target.value) || 1;
        render();
    };

    addBtn.onclick = () => {
        state.ingredients.push({
            id: Date.now(),
            name: '',
            amount: 0,
            unit: ''
        });
        render();
        // Focus the newly added name input
        const rows = container.querySelectorAll('.ingredient-row');
        const lastRow = rows[rows.length - 1];
        if (lastRow) lastRow.querySelector('.name-input').focus();
    };

    copyBtn.onclick = () => {
        const scale = state.targetServings / state.originalServings;
        let text = `【分量計算結果: ${state.targetServings}人分 (${scale.toFixed(1)}倍)】\n\n`;
        
        state.ingredients.forEach(ing => {
            const scaled = (ing.amount * scale).toFixed(1).replace(/\.0$/, '');
            text += `・${ing.name || '材料'}: ${scaled}${ing.unit}\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        });
    };

    // Initial render
    render();
});
