// Mock data representing realistic JPX Investor Type Trading volume (in billions of JPY, 億円)
const jpxData = {
    "2026-04 第1週": [
        { sector: "海外投資家", label: "Foreign", buy: 18500, sell: 17200, net: 1300 },
        { sector: "個人", label: "Individuals", buy: 6200, sell: 6800, net: -600 },
        { sector: "事業法人", label: "Corporations", buy: 1200, sell: 800, net: 400 },
        { sector: "証券会社", label: "Securities", buy: 2100, sell: 3200, net: -1100 },
        { sector: "投資信託", label: "Trusts", buy: 900, sell: 850, net: 50 },
        { sector: "その他", label: "Others", buy: 300, sell: 350, net: -50 }
    ],
    "2026-03 第4週": [
        { sector: "海外投資家", label: "Foreign", buy: 21000, sell: 23500, net: -2500 },
        { sector: "個人", label: "Individuals", buy: 8900, sell: 7500, net: 1400 },
        { sector: "事業法人", label: "Corporations", buy: 1500, sell: 900, net: 600 },
        { sector: "証券会社", label: "Securities", buy: 3400, sell: 2900, net: 500 },
        { sector: "投資信託", label: "Trusts", buy: 1100, sell: 1200, net: -100 },
        { sector: "その他", label: "Others", buy: 400, sell: 300, net: 100 }
    ]
};

// Global Chart Instance
let netChart = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initSelector();
    const latestWeek = Object.keys(jpxData)[0];
    updateDashboard(latestWeek);
    
    document.getElementById('week-selector').addEventListener('change', (e) => {
        updateDashboard(e.target.value);
    });
});

function initSelector() {
    const selector = document.getElementById('week-selector');
    Object.keys(jpxData).forEach(week => {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = week;
        selector.appendChild(option);
    });
}

function updateDashboard(weekKey) {
    const data = jpxData[weekKey];
    
    updateSummaryCards(data);
    updateTable(data);
    updateChart(data);
}

function updateSummaryCards(data) {
    const formatValue = (val) => new Intl.NumberFormat('ja-JP').format(Math.abs(val));
    const formatTrend = (val) => {
        if (val > 0) return `<span class="trend positive">▲ ${val} 買越</span>`;
        if (val < 0) return `<span class="trend negative">▼ ${Math.abs(val)} 売越</span>`;
        return `<span class="trend neutral">▶ 0 均衡</span>`;
    };

    const foreign = data.find(d => d.label === 'Foreign');
    const indiv = data.find(d => d.label === 'Individuals');
    const corp = data.find(d => d.label === 'Corporations');
    const sec = data.find(d => d.label === 'Securities');

    if (foreign) {
        document.querySelector('#metric-foreign .value').textContent = formatValue(foreign.net);
        document.getElementById('trend-foreign').innerHTML = formatTrend(foreign.net);
    }
    if (indiv) {
        document.querySelector('#metric-individual .value').textContent = formatValue(indiv.net);
        document.getElementById('trend-individual').innerHTML = formatTrend(indiv.net);
    }
    if (corp) {
        document.querySelector('#metric-corp .value').textContent = formatValue(corp.net);
        document.getElementById('trend-corp').innerHTML = formatTrend(corp.net);
    }
    if (sec) {
        document.querySelector('#metric-sec .value').textContent = formatValue(sec.net);
        document.getElementById('trend-sec').innerHTML = formatTrend(sec.net);
    }
}

function updateTable(data) {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        const netClass = row.net > 0 ? 'text-positive' : (row.net < 0 ? 'text-negative' : '');
        const netPrefix = row.net > 0 ? '+' : '';
        
        tr.innerHTML = `
            <td>${row.sector} <span style="color:var(--text-secondary); font-size:0.8em; margin-left:8px;">${row.label}</span></td>
            <td>${new Intl.NumberFormat('ja-JP').format(row.sell)}</td>
            <td>${new Intl.NumberFormat('ja-JP').format(row.buy)}</td>
            <td class="col-net ${netClass}">${netPrefix}${new Intl.NumberFormat('ja-JP').format(row.net)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateChart(data) {
    const ctx = document.getElementById('netTradingChart').getContext('2d');
    
    // Prepare Data
    const labels = data.map(d => d.sector);
    const netValues = data.map(d => d.net);
    
    // Colors
    const bgColors = netValues.map(v => v > 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)');
    const borderColors = netValues.map(v => v > 0 ? '#10b981' : '#ef4444');

    if (netChart) {
        netChart.destroy();
    }

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Noto Sans JP', sans-serif";

    netChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '差引 (Net Trading) 億円',
                data: netValues,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14, family: "'Inter', sans-serif" },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            return (value > 0 ? '+' : '') + new Intl.NumberFormat('ja-JP').format(value) + ' 億円';
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                    },
                    ticks: {
                        font: { family: "'Inter', sans-serif" }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });
}
