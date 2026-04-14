// App configuration and state
const APP_STATE = {
    indices: [
        { id: 'nikkei', name: '日経225', price: 39500.20, change: 0, decimals: 2 },
        { id: 'topix', name: 'TOPIX', price: 2750.15, change: 0, decimals: 2 },
        { id: 'dow', name: 'NYダウ', price: 39100.50, change: 0, decimals: 2 },
        { id: 'nasdaq', name: 'NASDAQ', price: 16200.75, change: 0, decimals: 2 },
        { id: 'sp500', name: 'S&P 500', price: 5100.30, change: 0, decimals: 2 },
        { id: 'ftse', name: '英国FTSE', price: 7900.40, change: 0, decimals: 2 }
    ],
    forex: [
        { id: 'usdjpy', name: 'USD/JPY (ドル円)', price: 151.45, change: 0, decimals: 3 },
        { id: 'eurjpy', name: 'EUR/JPY (ユーロ円)', price: 164.80, change: 0, decimals: 3 },
        { id: 'eurusd', name: 'EUR/USD', price: 1.085, change: 0, decimals: 4 },
        { id: 'gbpjpy', name: 'GBP/JPY (ポンド円)', price: 191.60, change: 0, decimals: 3 }
    ],
    commodities: [
        { id: 'gold', name: '金先物 (Gold)', price: 2180.50, change: 0, decimals: 2 },
        { id: 'wti', name: 'WTI原油', price: 82.35, change: 0, decimals: 2 },
        { id: 'btc', name: 'Bitcoin (BTC)', price: 70150.00, change: 0, decimals: 0 },
        { id: 'eth', name: 'Ethereum (ETH)', price: 3500.20, change: 0, decimals: 2 }
    ]
};

// Historical data for sparklines (array of 20 points)
const historyData = {};

/**
 * Initialize History Data with some random walk
 */
function initHistory(items) {
    items.forEach(item => {
        let current = item.price * 0.99; // start a bit lower
        const data = [];
        for (let i = 0; i < 20; i++) {
            current += (Math.random() - 0.5) * (item.price * 0.002);
            data.push(current);
        }
        data.push(item.price); // add current price as last point
        historyData[item.id] = data;
    });
}

/**
 * Format numbers with commas and fixed decimals
 */
function formatNumber(num, decimals) {
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function getPrefix(num) {
    return num > 0 ? '+' : '';
}

/**
 * Draw a minimalist SVG sparkline
 */
function createSparkline(data) {
    const width = 100;
    const height = 40;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; 

    // Create points
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' L ');

    return `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            <path class="sparkline-path" d="M ${points}" />
        </svg>
    `;
}

/**
 * Render all cards initially
 */
function renderInitialCards() {
    const template = document.getElementById('ticker-card-template');

    // Helper to render sections
    const renderSection = (items, containerId) => {
        const container = document.getElementById(containerId);
        items.forEach(item => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.ticker-card');
            card.id = `card-${item.id}`;
            
            card.querySelector('.ticker-name').textContent = item.name;
            card.querySelector('.ticker-price').textContent = formatNumber(item.price, item.decimals);
            card.querySelector('.change-abs').textContent = `${getPrefix(0)}0.00`;
            card.querySelector('.change-pct').textContent = '(0.00%)';
            card.querySelector('.ticker-chart').innerHTML = createSparkline(historyData[item.id]);

            container.appendChild(clone);
        });
    };

    renderSection(APP_STATE.indices, 'grid-indices');
    renderSection(APP_STATE.forex, 'grid-forex');
    renderSection(APP_STATE.commodities, 'grid-commodities');
}

/**
 * Simulate random price ticks
 */
function simulateMarketTicks() {
    const allGroups = [APP_STATE.indices, APP_STATE.forex, APP_STATE.commodities];
    
    // Pick a random group, then pick random items in that group to update
    const group = allGroups[Math.floor(Math.random() * allGroups.length)];
    const numToUpdate = Math.floor(Math.random() * 3) + 1; // update 1 to 3 items
    
    for(let i = 0; i < numToUpdate; i++) {
        const item = group[Math.floor(Math.random() * group.length)];
        
        // Random change formula: -0.15% to +0.15%
        const pctChange = (Math.random() - 0.5) * 0.003;
        const changeValue = item.price * pctChange;
        
        item.change = changeValue;
        item.price += changeValue;
        
        // Update history
        historyData[item.id].shift();
        historyData[item.id].push(item.price);
        
        updateCardUI(item);
    }
}

/**
 * Update the DOM for a specific card with animation
 */
function updateCardUI(item) {
    const card = document.getElementById(`card-${item.id}`);
    if(!card) return;

    const isUp = item.change >= 0;
    
    // Set Direction Classes
    card.classList.remove('is-up', 'is-down');
    card.classList.add(isUp ? 'is-up' : 'is-down');
    
    // Trigger Flash Animation (using class toggling trick to restart CSS animation)
    card.classList.remove('flash-up-anim', 'flash-down-anim');
    void card.offsetWidth; // trigger reflow
    card.classList.add(isUp ? 'flash-up-anim' : 'flash-down-anim');

    // Update Text
    card.querySelector('.ticker-price').textContent = formatNumber(item.price, item.decimals);
    
    const absChangeText = formatNumber(item.change, item.decimals);
    const pctChangeText = (item.change / (item.price - item.change) * 100).toFixed(2);
    
    card.querySelector('.change-abs').textContent = `${getPrefix(item.change)}${absChangeText}`;
    card.querySelector('.change-pct').textContent = `(${getPrefix(item.change)}${pctChangeText}%)`;
    
    // Update Chart
    card.querySelector('.ticker-chart').innerHTML = createSparkline(historyData[item.id]);
}

/**
 * Update Local Time Header
 */
function updateTime() {
    const now = new Date();
    document.getElementById('local-time').textContent = now.toLocaleTimeString('ja-JP');
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initHistory(APP_STATE.indices);
    initHistory(APP_STATE.forex);
    initHistory(APP_STATE.commodities);
    
    renderInitialCards();
    
    // Start Ticks
    setInterval(simulateMarketTicks, 800); // Fast ticks for better visual feedback
    
    // Start Clock
    setInterval(updateTime, 1000);
    updateTime();
});
