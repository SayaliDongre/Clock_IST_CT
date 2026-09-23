document.addEventListener('DOMContentLoaded', () => {
    // --- Tabs Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Clocks Logic ---
    function updateClocks() {
        const now = new Date();
        
        const istOptions = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const istDateOptions = { timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        
        const ctOptions = { timeZone: 'America/Chicago', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const ctDateOptions = { timeZone: 'America/Chicago', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

        document.getElementById('ist-time').textContent = now.toLocaleTimeString('en-US', istOptions);
        document.getElementById('ist-date').textContent = now.toLocaleDateString('en-US', istDateOptions);

        document.getElementById('ct-time').textContent = now.toLocaleTimeString('en-US', ctOptions);
        document.getElementById('ct-date').textContent = now.toLocaleDateString('en-US', ctDateOptions);

        // Compute difference
        const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const ctString = now.toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const istNow = new Date(istString);
        const ctNow = new Date(ctString);
        const diffHours = (istNow - ctNow) / (1000 * 60 * 60);
        
        document.getElementById('time-diff-badge').textContent = `IST -${diffHours}h`;
    }
    
    setInterval(updateClocks, 1000);
    updateClocks();

    // --- Converter Logic ---
    const convertDatetime = document.getElementById('convert-datetime');
    const fromTz = document.getElementById('from-tz');
    const toTz = document.getElementById('to-tz');
    const swapBtn = document.getElementById('swap-tz-btn');
    const resultBox = document.getElementById('conversion-result');

    // Pre-fill datetime-local with current time
    const nowLocal = new Date();
    nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
    convertDatetime.value = nowLocal.toISOString().slice(0,16);

    function doConversion() {
        if (!convertDatetime.value) return;

        const dateVal = new Date(convertDatetime.value);
        if (isNaN(dateVal.getTime())) return;

        // Since datetime-local has no timezone, we treat it as if it's in the 'fromTz' timezone.
        // We construct a formatter that parses it in that specific timezone using Intl API tricks,
        // But an easier way is to format it back and forth.
        
        // Actually, the easiest reliable way in vanilla JS without Moment.js:
        // Use local Date object, but we need to trick it.
        // We will build a string like "April 10, 2024 15:30:00 GMT-0500" for CT, etc.
        // Wait, standard JS doesn't let you easily parse a string as a specific IANA zone.
        // Better approach: convert local date string, interpret as 'fromTz', calculate offset difference to 'toTz'
        // For simplicity, we can just use toLocaleString tricks.
        
        // We want to convert 'dateVal' (which we treat as fromTz time) to toTz time.
        // Instead of complex math, we use a known offset for IST (+5:30) and fetch CT offset.
        // Get offset of CT at that specific date:
        
        // A robust way to do this in JS:
        const d = dateVal; // User input as local Date object (e.g. they typed 10 AM, local Date says 10 AM)
        
        // Let's find out what UTC time corresponds to this local time if it were in fromTz.
        // We don't have a direct inverse function, but we can guess and check.
        let targetUtc = d.getTime(); 
        
        // Iterate to find the exact UTC time that formats to the user's input in the fromTz
        for(let i=0; i<3; i++) { // usually converges in 1-2 steps
            const formatted = new Date(targetUtc).toLocaleString('sv', { timeZone: fromTz.value }); 
            // 'sv' locale gives YYYY-MM-DD hh:mm:ss format natively
            const guessDate = new Date(formatted.replace(' ', 'T'));
            const diff = d.getTime() - guessDate.getTime();
            targetUtc += diff;
        }

        const exactUtcDate = new Date(targetUtc);

        // Now format exactUtcDate to the toTz
        const toOptionsTime = { timeZone: toTz.value, hour12: true, hour: 'numeric', minute: '2-digit' };
        const toOptionsDate = { timeZone: toTz.value, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        
        const resultTimeStr = exactUtcDate.toLocaleTimeString('en-US', toOptionsTime);
        const resultDateStr = exactUtcDate.toLocaleDateString('en-US', toOptionsDate);
        
        let toTzName = toTz.value === 'Asia/Kolkata' ? 'IST' : 'CT';

        resultBox.innerHTML = `
            <div class="result-time">${resultTimeStr}</div>
            <div class="result-date">${resultDateStr}</div>
            <div class="result-diff">Time in ${toTzName}</div>
        `;
    }

    convertDatetime.addEventListener('change', doConversion);
    fromTz.addEventListener('change', () => {
        // Sync toTz
        toTz.value = fromTz.value === 'Asia/Kolkata' ? 'America/Chicago' : 'Asia/Kolkata';
        doConversion();
    });
    
    swapBtn.addEventListener('click', () => {
        fromTz.value = fromTz.value === 'Asia/Kolkata' ? 'America/Chicago' : 'Asia/Kolkata';
        toTz.value = fromTz.value === 'Asia/Kolkata' ? 'America/Chicago' : 'Asia/Kolkata';
        doConversion();
    });

    // Run initial conversion
    doConversion();

    // --- Deadline Tracker Logic ---
    const deadlineForm = document.getElementById('deadline-form');
    const dlTitleInput = document.getElementById('dl-title');
    const dlDatetimeInput = document.getElementById('dl-datetime');
    const deadlinesContainer = document.getElementById('deadlines-container');

    let deadlines = JSON.parse(localStorage.getItem('chrono_deadlines') || '[]');

    function saveDeadlines() {
        localStorage.setItem('chrono_deadlines', JSON.stringify(deadlines));
    }

    function renderDeadlines() {
        deadlinesContainer.innerHTML = '';
        
        if(deadlines.length === 0) {
            deadlinesContainer.innerHTML = '<div class="empty-state">No deadlines tracked. You\'re all caught up!</div>';
            return;
        }

        // Sort by closest first
        deadlines.sort((a, b) => a.exactUtc - b.exactUtc);

        const nowUtc = Date.now();

        deadlines.forEach(dl => {
            const timeDiff = dl.exactUtc - nowUtc;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            let statusClass = 'status-safe';
            let bgClass = '';
            let fillClass = 'fill-safe';
            let progressPercent = 0;
            let timeRemainingText = '';

            if (timeDiff <= 0) {
                statusClass = 'status-danger';
                fillClass = 'fill-danger';
                progressPercent = 100;
                timeRemainingText = 'Past Due';
            } else {
                // Calculate pseudo-progress (e.g., if > 7 days, 0%. If 0 hours, 100%)
                const maxHours = 7 * 24; // 1 week tracking
                progressPercent = Math.max(0, 100 - (hoursDiff / maxHours * 100));
                
                if (hoursDiff <= 24) {
                    statusClass = 'status-danger pulse-danger';
                    bgClass = 'bg-urgent';
                    fillClass = 'fill-danger';
                } else if (hoursDiff <= 72) {
                    statusClass = 'status-warning';
                    bgClass = 'bg-warning-state';
                    fillClass = 'fill-warning';
                }

                const d = Math.floor(hoursDiff / 24);
                const h = Math.floor(hoursDiff % 24);
                if(d > 0) timeRemainingText = `${d}d ${h}h left`;
                else timeRemainingText = `${h}h ${Math.floor((timeDiff % (1000*60*60)) / 60000)}m left`;
            }

            const istDateObj = new Date(dl.exactUtc);
            const istTimeStr = istDateObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
            const istDateStr = istDateObj.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' });

            const ctDateObj = new Date(dl.exactUtc);
            const ctStr = ctDateObj.toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const el = document.createElement('div');
            el.className = `deadline-item ${bgClass}`;
            el.id = `dl-${dl.id}`;
            
            el.innerHTML = `
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill ${fillClass}" style="width: ${progressPercent}%"></div>
                </div>
                <div class="deadline-info">
                    <div class="deadline-title">${dl.title}</div>
                    <div class="deadline-time">IST: ${istDateStr}, ${istTimeStr}</div>
                    <div class="deadline-ct">CT: ${ctStr}</div>
                </div>
                <div class="deadline-status">
                    <div class="countdown ${statusClass}">${timeRemainingText}</div>
                </div>
                <button class="complete-btn" title="Mark Complete" onclick="completeDeadline('${dl.id}')">
                    <i class="fa-solid fa-check"></i>
                </button>
            `;
            
            deadlinesContainer.appendChild(el);
        });
    }

    deadlineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = dlTitleInput.value;
        const ctVal = dlDatetimeInput.value; // It's in CT
        
        // Find UTC for this CT time
        const d = new Date(ctVal);
        let targetUtc = d.getTime(); 
        for(let i=0; i<3; i++) {
            const formatted = new Date(targetUtc).toLocaleString('sv', { timeZone: 'America/Chicago' }); 
            const guessDate = new Date(formatted.replace(' ', 'T'));
            const diff = d.getTime() - guessDate.getTime();
            targetUtc += diff;
        }

        const dlObj = {
            id: Date.now().toString(),
            title: title,
            ctInput: ctVal,
            exactUtc: targetUtc
        };

        deadlines.push(dlObj);
        saveDeadlines();
        renderDeadlines();
        
        dlTitleInput.value = '';
        dlDatetimeInput.value = '';
    });

    window.completeDeadline = function(id) {
        const el = document.getElementById(`dl-${id}`);
        if(el) {
            // First phase: Cross out
            el.classList.add('completed');
            
            // Second phase: Erase and remove
            setTimeout(() => {
                el.classList.add('erasing');
                
                setTimeout(() => {
                    deadlines = deadlines.filter(d => d.id !== id);
                    saveDeadlines();
                    renderDeadlines();
                }, 800); // Wait for erase animation to finish
            }, 1000); // Wait 1 second crossed out before erasing
        }
    };

    // Update countdowns every minute
    setInterval(renderDeadlines, 60000);
    renderDeadlines();

    // --- PWA Registration & Install Prompt ---
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can add to home screen
        installBtn.style.display = 'inline-block';
    });

    installBtn.addEventListener('click', () => {
        // hide our user interface that shows our A2HS button
        installBtn.style.display = 'none';
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW Registered', reg))
                .catch(err => console.error('SW Registration Failed', err));
        });
    }
});
