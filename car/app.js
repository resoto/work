import { SimulationEngine, ROWS, SEAT_LABELS } from './engine.js';

document.addEventListener('DOMContentLoaded', () => {
  const engine = new SimulationEngine();
  const airplaneEl = document.getElementById('airplane');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const strategySelect = document.getElementById('strategy');
  const speedInput = document.getElementById('speed');
  const timeStat = document.getElementById('timeStat');
  const seatedStat = document.getElementById('seatedStat');

  let animationId = null;
  let isPlaying = false;
  let lastFrameTime = 0;

  // 初期レンダリング
  function renderAirplane() {
    airplaneEl.innerHTML = '';
    
    for (let r = 0; r < ROWS; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'row';
      rowEl.dataset.row = r;

      // 左側の座席 (A, B, C)
      for (let i = 0; i < 3; i++) {
        rowEl.appendChild(createSeatEl(r, SEAT_LABELS[i]));
      }

      // 通路
      const aisleEl = document.createElement('div');
      aisleEl.className = 'aisle';
      aisleEl.id = `aisle-${r}`;
      rowEl.appendChild(aisleEl);

      // 右側の座席 (D, E, F)
      for (let i = 3; i < 6; i++) {
        rowEl.appendChild(createSeatEl(r, SEAT_LABELS[i]));
      }

      airplaneEl.appendChild(rowEl);
    }
  }

  function createSeatEl(row, seatLetter) {
    const seatEl = document.createElement('div');
    seatEl.className = 'seat';
    seatEl.id = `seat-${row}-${seatLetter}`;
    return seatEl;
  }

  function updateVisuals(state) {
    // 統計の更新
    timeStat.textContent = state.tick;
    seatedStat.textContent = `${state.seatedCount} / ${ROWS * 6}`;

    // すべての座席と乗客をクリア (パフォーマンスのため全再描画ではなく差分更新がベストですが、
    // ここではDOMの乗客要素を管理します)
    
    // 既存の乗客要素をクリーンアップ
    document.querySelectorAll('.passenger').forEach(el => el.remove());
    document.querySelectorAll('.seat.occupied').forEach(el => el.classList.remove('occupied'));

    // 着席者の描画
    for (const [key, passenger] of Object.entries(state.seats)) {
      if (passenger) {
        const seatEl = document.getElementById(`seat-${key}`);
        if (seatEl) {
          seatEl.classList.add('occupied');
          seatEl.style.backgroundColor = passenger.color || 'var(--seat-occupied)';
          
          const pEl = document.createElement('div');
          pEl.className = 'passenger seated';
          pEl.style.backgroundColor = passenger.color || 'var(--seat-occupied)';
          seatEl.appendChild(pEl);
        }
      }
    }

    // 通路の乗客の描画
    state.aisle.forEach((passenger, r) => {
      if (passenger) {
        const aisleEl = document.getElementById(`aisle-${r}`);
        if (aisleEl) {
          const pEl = document.createElement('div');
          pEl.className = 'passenger';
          if (passenger.state === 'stowing') {
            pEl.classList.add('stowing');
          }
          pEl.style.backgroundColor = passenger.color;
          aisleEl.appendChild(pEl);
        }
      }
    });

    if (state.isComplete && isPlaying) {
      pauseSimulation();
      startBtn.textContent = '完了';
      startBtn.disabled = true;
    }
  }

  function simulationStep(timestamp) {
    if (!isPlaying) return;

    // 速度調整 (1〜10 -> delay: 500ms 〜 50ms)
    const speedVal = parseInt(speedInput.value);
    const msPerTick = 600 - (speedVal * 55);

    if (timestamp - lastFrameTime >= msPerTick) {
      engine.update();
      updateVisuals(engine.getState());
      lastFrameTime = timestamp;
    }

    animationId = requestAnimationFrame(simulationStep);
  }

  function startSimulation() {
    if (engine.getState().tick === 0) {
      engine.startSimulation(strategySelect.value);
    }
    
    isPlaying = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    strategySelect.disabled = true;
    
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(simulationStep);
  }

  function pauseSimulation() {
    isPlaying = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = '再開';
    
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function resetSimulation() {
    pauseSimulation();
    engine.reset();
    renderAirplane();
    updateVisuals(engine.getState());
    
    startBtn.disabled = false;
    startBtn.textContent = '開始';
    pauseBtn.disabled = true;
    strategySelect.disabled = false;
  }

  // イベントリスナー
  startBtn.addEventListener('click', startSimulation);
  pauseBtn.addEventListener('click', pauseSimulation);
  resetBtn.addEventListener('click', resetSimulation);
  strategySelect.addEventListener('change', resetSimulation);

  // 初期化実行
  renderAirplane();
  updateVisuals(engine.getState());
});
