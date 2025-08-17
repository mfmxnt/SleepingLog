document.addEventListener('DOMContentLoaded', () => {
    const awakeTimeEl = document.getElementById('awake-time');
    const lastSleepEl = document.getElementById('last-sleep');
    const historyTable = document.querySelector('#sleep-history tbody');
  
    // Load data immediately
    updateDisplay();
    
    // Update awake time every minute
    setInterval(updateAwakeTime, 60000);
  
    async function updateDisplay() {
      try {
        const [latest, history] = await Promise.all([
          fetch('/sleep/latest').then(res => res.json()),
          fetch('/sleep').then(res => res.json())
        ]);
        
        updateAwakeTime(latest?.wake_up);
        updateLastSleep(latest);
        updateHistoryTable(history);
      } catch (error) {
        console.error('Error updating display:', error);
        lastSleepEl.textContent = "Error loading data";
        awakeTimeEl.textContent = "Error loading data";
      }
    }
  
    function updateAwakeTime(lastWakeUp) {
      if (!lastWakeUp) {
        awakeTimeEl.textContent = "No sleep records";
        return;
      }
      
      const now = new Date();
      const lastWake = new Date(lastWakeUp);
      const awakeMs = now - lastWake;
      
      const hours = Math.floor(awakeMs / (1000 * 60 * 60));
      const minutes = Math.floor((awakeMs % (1000 * 60 * 60)) / (1000 * 60));
      
      awakeTimeEl.textContent = `${hours}h ${minutes}m`;
      awakeTimeEl.className = hours >= 16 ? 'status-value alert' : 'status-value';
    }
  
    function updateLastSleep(sleepRecord) {
      if (!sleepRecord) {
        lastSleepEl.textContent = "No sleep records";
        return;
      }
      
      const hours = Math.floor(sleepRecord.duration);
      const minutes = Math.floor((sleepRecord.duration % 1) * 60);
      lastSleepEl.textContent = `${hours}h ${minutes}m`;
    }
  
    function updateHistoryTable(history) {
      historyTable.innerHTML = '';
      
      history.forEach(record => {
        const row = document.createElement('tr');
        
        const start = new Date(record.sleep_start);
        const end = new Date(record.wake_up);
        
        row.innerHTML = `
          <td>${start.toLocaleString()}</td>
          <td>${end.toLocaleString()}</td>
          <td class="duration-cell">${parseFloat(record.duration).toFixed(2)}</td>
        `;
        
        historyTable.appendChild(row);
      });
    }
  });