// Sleep data storage
let sleepSessions = JSON.parse(localStorage.getItem('sleepSessions')) || [];
let isSleeping = false;
let currentSleepStart = null;

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

// Initialize
updateDisplay();
setInterval(updateAwakeTime, 60000); // Update awake time every minute

// Event listeners
sleepBtn.addEventListener('click', startSleep);
wakeBtn.addEventListener('click', endSleep);
napBtn.addEventListener('click', logNap);

function startSleep() {
    isSleeping = true;
    currentSleepStart = new Date();
    sleepBtn.disabled = true;
    wakeBtn.disabled = false;
    napBtn.disabled = true;
}

function endSleep(isNap = false) {
    if (!isSleeping || !currentSleepStart) return;
    
    const endTime = new Date();
    const duration = (endTime - currentSleepStart) / (1000 * 60 * 60); // in hours
    
    sleepSessions.push({
        start: currentSleepStart,
        end: endTime,
        isNap: isNap,
        duration: duration
    });
    
    saveData();
    resetCurrentSleep();
    updateDisplay();
}

function logNap() {
    startSleep();
    // For nap, we'll assume a quick log rather than tracking in real-time
    setTimeout(() => {
        endSleep(true);
    }, 100);
}

function resetCurrentSleep() {
    isSleeping = false;
    currentSleepStart = null;
    sleepBtn.disabled = false;
    wakeBtn.disabled = true;
    napBtn.disabled = false;
}

function updateAwakeTime() {
    if (sleepSessions.length === 0) {
        awakeTimeEl.textContent = 'Awake for: Not enough data';
        return;
    }
    
    const lastSleepEnd = new Date(sleepSessions[sleepSessions.length - 1].end);
    const now = new Date();
    const awakeMs = now - lastSleepEnd;
    
    const hours = Math.floor(awakeMs / (1000 * 60 * 60));
    const minutes = Math.floor((awakeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    awakeTimeEl.textContent = `Awake for: ${hours} hours ${minutes} minutes`;
    
    // Warning if awake for more than 16 hours
    if (hours >= 16) {
        awakeTimeEl.style.color = 'red';
        awakeTimeEl.style.fontWeight = 'bold';
    } else {
        awakeTimeEl.style.color = '';
        awakeTimeEl.style.fontWeight = '';
    }
}

function updateDisplay() {
    updateAwakeTime();
    updateLastSleep();
    updateAverages();
    updateHistoryTable();
}

function updateLastSleep() {
    if (sleepSessions.length === 0) {
        lastSleepEl.textContent = 'Last sleep: Not recorded yet';
        return;
    }
    
    const lastSession = sleepSessions[sleepSessions.length - 1];
    const duration = lastSession.duration;
    const hours = Math.floor(duration);
    const minutes = Math.floor((duration % 1) * 60);
    
    lastSleepEl.textContent = `Last sleep: ${hours}h ${minutes}m (${lastSession.isNap ? 'Nap' : 'Night sleep'})`;
}

function updateAverages() {
    if (sleepSessions.length === 0) return;
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    
    const filterSessions = (startDate) => {
        return sleepSessions.filter(session => 
            new Date(session.end) >= startDate && !session.isNap
        );
    };
    
    const calculateAverage = (sessions) => {
        if (sessions.length === 0) return 0;
        const total = sessions.reduce((sum, session) => sum + session.duration, 0);
        return total / (sessions.length > 7 ? 7 : sessions.length); // Normalize to per night
    };
    
    const avg1Week = calculateAverage(filterSessions(oneWeekAgo));
    const avg2Week = calculateAverage(filterSessions(twoWeeksAgo));
    const avg3Week = calculateAverage(filterSessions(threeWeeksAgo));
    
    avg1WeekEl.textContent = `1-week average: ${formatHours(avg1Week)} per night`;
    avg2WeekEl.textContent = `2-week average: ${formatHours(avg2Week)} per night`;
    avg3WeekEl.textContent = `3-week average: ${formatHours(avg3Week)} per night`;
}

function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours % 1) * 60);
    return `${h}h ${m}m`;
}

function updateHistoryTable() {
    historyTable.innerHTML = '';
    
    // Show most recent 20 entries
    const recentSessions = [...sleepSessions].reverse().slice(0, 20);
    
    recentSessions.forEach(session => {
        const row = document.createElement('tr');
        
        const startDate = new Date(session.start);
        const endDate = new Date(session.end);
        
        row.innerHTML = `
            <td>${startDate.toLocaleDateString()}</td>
            <td>${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${formatHours(session.duration)}</td>
            <td>${session.isNap ? 'Nap' : 'Night'}</td>
        `;
        
        historyTable.appendChild(row);
    });
}

function saveData() {
    localStorage.setItem('sleepSessions', JSON.stringify(sleepSessions));
}
