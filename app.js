document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const sleepBtn = document.getElementById('sleep-btn');
    const wakeBtn = document.getElementById('wake-btn');
    const napBtn = document.getElementById('nap-btn');
    const awakeTimeEl = document.getElementById('awake-time');
    const lastSleepEl = document.getElementById('last-sleep');
    const avg1WeekEl = document.getElementById('avg-1week');
    const avg2WeekEl = document.getElementById('avg-2week');
    const avg3WeekEl = document.getElementById('avg-3week');
    const historyTable = document.querySelector('#sleep-history tbody');
  
    let currentSleepStart = null;
  
    // Initialize
    updateDisplay();
    setInterval(updateDisplay, 60000);
  
    // Event listeners
    sleepBtn.addEventListener('click', startSleep);
    wakeBtn.addEventListener('click', () => endSleep(false));
    napBtn.addEventListener('click', () => endSleep(true));
  
    async function startSleep() {
      currentSleepStart = new Date().toISOString();
      sleepBtn.disabled = true;
      wakeBtn.disabled = false;
      napBtn.disabled = true;
    }
  
    async function endSleep(isNap) {
      if (!currentSleepStart) return;
      
      const endTime = new Date().toISOString();
      
      try {
        const response = await fetch('/api/sleep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_time: currentSleepStart,
            end_time: endTime,
            is_nap: isNap
          })
        });
        
        if (!response.ok) throw new Error('Failed to save sleep session');
        
        currentSleepStart = null;
        sleepBtn.disabled = false;
        wakeBtn.disabled = true;
        napBtn.disabled = false;
        
        updateDisplay();
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to save sleep data');
      }
    }
  
    async function updateDisplay() {
      try {
        const [sessionsRes, averagesRes] = await Promise.all([
          fetch('/api/sleep'),
          fetch('/api/sleep/averages')
        ]);
        
        if (!sessionsRes.ok || !averagesRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const sessions = await sessionsRes.json();
        const averages = await averagesRes.json();
        
        updateAwakeTime(averages.lastEndTime);
        updateLastSleep(sessions[0]);
        updateAverages(averages);
        updateHistoryTable(sessions);
      } catch (error) {
        console.error('Error updating display:', error);
      }
    }
  
    function updateAwakeTime(lastEndTime) {
      if (!lastEndTime) {
        awakeTimeEl.textContent = 'Awake for: Not enough data';
        return;
      }
      
      const now = new Date();
      const lastEnd = new Date(lastEndTime);
      const awakeMs = now - lastEnd;
      
      const hours = Math.floor(awakeMs / (1000 * 60 * 60));
      const minutes = Math.floor((awakeMs % (1000 * 60 * 60)) / (1000 * 60));
      
      awakeTimeEl.textContent = `Awake for: ${hours}h ${minutes}m`;
      
      if (hours >= 16) {
        awakeTimeEl.style.color = 'red';
      } else {
        awakeTimeEl.style.color = '';
      }
    }
  
    function updateLastSleep(lastSession) {
      if (!lastSession) {
        lastSleepEl.textContent = 'Last sleep: Not recorded yet';
        return;
      }
      
      const hours = Math.floor(lastSession.duration_hours);
      const minutes = Math.floor((lastSession.duration_hours % 1) * 60);
      const type = lastSession.is_nap ? 'Nap' : 'Night sleep';
      const date = new Date(lastSession.end_time).toLocaleDateString();
      
      lastSleepEl.textContent = `Last sleep: ${hours}h ${minutes}m (${type}) on ${date}`;
    }
  
    function updateAverages(averages) {
      avg1WeekEl.textContent = `1-week avg: ${formatHours(averages.week1 || 0)}/night`;
      avg2WeekEl.textContent = `2-week avg: ${formatHours(averages.week2 || 0)}/night`;
      avg3WeekEl.textContent = `3-week avg: ${formatHours(averages.week3 || 0)}/night`;
    }
  
    function updateHistoryTable(sessions) {
      historyTable.innerHTML = '';
      
      sessions.slice(0, 20).forEach(session => {
        const row = document.createElement('tr');
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        
        row.innerHTML = `
          <td>${start.toLocaleDateString()}</td>
          <td>${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
          <td>${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
          <td>${formatHours(session.duration_hours)}</td>
          <td>${session.is_nap ? 'Nap' : 'Night'}</td>
        `;
        
        historyTable.appendChild(row);
      });
    }
  
    function formatHours(hours) {
      const h = Math.floor(hours);
      const m = Math.floor((hours % 1) * 60);
      return `${h}h ${m}m`;
    }
  });