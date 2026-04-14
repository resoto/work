export const ROWS = 30;
export const SEATS_PER_ROW = 6;
export const SEAT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export class SimulationEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.passengers = [];
    this.aisle = new Array(ROWS).fill(null); // 通路の状態 (乗客オブジェクトへの参照)
    this.seats = {}; // '0-A' や '29-F' などのキーに座席の状態
    this.seatedCount = 0;
    this.isComplete = false;
    
    // 座席の初期化
    for (let r = 0; r < ROWS; r++) {
      for (let s of SEAT_LABELS) {
        this.seats[`${r}-${s}`] = null;
      }
    }
  }

  generatePassengers(strategy) {
    let allPassengers = [];
    let idCounter = 1;

    for (let r = 0; r < ROWS; r++) {
      for (let s of SEAT_LABELS) {
        allPassengers.push({
          id: idCounter++,
          targetRow: r,
          targetSeat: s,
          state: 'waiting', // waiting, aisle, stowing, seated
          currentRow: -1, // -1 はまだ機内に入っていない
          stowDelay: Math.floor(Math.random() * 5) + 3, // 荷物収納にかかるフレーム数(3〜7)
          color: this.getPassengerColor(strategy, r, s)
        });
      }
    }

    return this.sortPassengers(allPassengers, strategy);
  }

  getPassengerColor(strategy, row, seat) {
    const defaultColor = '#f59e0b';
    if (strategy === 'backToFront') {
      const g = Math.floor((row / ROWS) * 255);
      return `rgb(255, ${g}, 0)`;
    } else if (strategy === 'wilma') {
      if (seat === 'A' || seat === 'F') return '#3b82f6'; // Window (blue)
      if (seat === 'B' || seat === 'E') return '#10b981'; // Middle (green)
      if (seat === 'C' || seat === 'D') return '#ef4444'; // Aisle (red)
    }
    return defaultColor;
  }

  sortPassengers(passengers, strategy) {
    const shuffled = [...passengers].sort(() => Math.random() - 0.5);

    if (strategy === 'random') {
      return shuffled;
    } 
    else if (strategy === 'backToFront') {
      // 5列ごとのグループに分け、後ろのグループから先に搭乗（グループ内ランダム）
      const groupSize = 5;
      shuffled.forEach(p => {
        p.group = Math.floor(p.targetRow / groupSize);
      });
      return shuffled.sort((a, b) => b.group - a.group); // 降順（後ろの行から）
    }
    else if (strategy === 'wilma') {
      // グループ1: 窓(A,F)、グループ2: 中央(B,E)、グループ3: 通路(C,D)
      shuffled.forEach(p => {
        if (p.targetSeat === 'A' || p.targetSeat === 'F') p.group = 1;
        else if (p.targetSeat === 'B' || p.targetSeat === 'E') p.group = 2;
        else p.group = 3;
      });
      return shuffled.sort((a, b) => a.group - b.group);
    }

    return shuffled;
  }

  startSimulation(strategy) {
    this.reset();
    this.queue = this.generatePassengers(strategy);
  }

  update() {
    if (this.isComplete) return;

    this.tick++;
    let moved = false;

    // 後ろから前へ通路を更新（前の人が動かないと後ろの人が動けないため）
    for (let r = ROWS - 1; r >= 0; r--) {
      const passenger = this.aisle[r];
      if (!passenger) continue;

      if (passenger.state === 'stowing') {
        passenger.stowDelay--;
        if (passenger.stowDelay <= 0) {
          // 収納完了、着席
          passenger.state = 'seated';
          this.seats[`${passenger.targetRow}-${passenger.targetSeat}`] = passenger;
          this.aisle[r] = null;
          this.seatedCount++;
          moved = true;
        }
      } 
      else if (passenger.state === 'aisle') {
        if (passenger.targetRow === r) {
          // 目的の列に到着
          passenger.state = 'stowing';
          moved = true;
        } else if (r + 1 < ROWS && this.aisle[r + 1] === null) {
          // 次の列に進む
          this.aisle[r + 1] = passenger;
          this.aisle[r] = null;
          passenger.currentRow = r + 1;
          moved = true;
        }
      }
    }

    // キューから人を機内に（列0）に入れる
    if (this.queue.length > 0 && this.aisle[0] === null) {
      const nextPassenger = this.queue.shift();
      nextPassenger.state = 'aisle';
      nextPassenger.currentRow = 0;
      this.aisle[0] = nextPassenger;
      this.passengers.push(nextPassenger);
      moved = true;
    }

    if (this.seatedCount === ROWS * SEATS_PER_ROW) {
      this.isComplete = true;
    }
    
    return moved;
  }

  getState() {
    return {
      tick: this.tick,
      passengers: this.passengers,
      aisle: this.aisle,
      seats: this.seats,
      seatedCount: this.seatedCount,
      isComplete: this.isComplete
    };
  }
}
