/* ========================================================
   LOCAL STORAGE SAFE WRAPPER
   Prevents browser crashes in Incognito mode for file:// URIs
   ======================================================== */
const _memoryStorage = {};
const safeStorage = {
    getItem: (key) => {
        try { return window.localStorage.getItem(key); }
        catch (e) { return _memoryStorage[key] || null; }
    },
    setItem: (key, val) => {
        try { window.localStorage.setItem(key, val); }
        catch (e) { _memoryStorage[key] = val; }
    },
    removeItem: (key) => {
        try { window.localStorage.removeItem(key); }
        catch (e) { delete _memoryStorage[key]; }
    }
};

/* ========================================================
   TRADERZEN ACCOUNTS CONFIGURATION
   Add your username, password, and Web App URL here.
   This easily links your credentials to your Cloud backend
   so you do not need to paste the link in Incognito tabs.
   ======================================================== */
const ACCOUNTS = {
    "machu": {
        password: "shrek",
        // Puta your Google Apps Script Web App URL below:
        url: "https://script.google.com/macros/s/AKfycbyQGZYwUUN9eJTM7CG6fTXriyRP3OT2mOF5ctiXMujdwPKxyPJnKlaKw1GJWg1n1lWq/exec"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- LOGIN & URL MAPPING LOGIC ---
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    const isLoggedIn = safeStorage.getItem('traderZenLoggedIn');
    if (!isLoggedIn) {
        if (loginOverlay) loginOverlay.style.display = 'flex';
    } else {
        if (loginOverlay) loginOverlay.style.display = 'none';
        // Auto-refresh the URL from code if they are already logged in
        const user = safeStorage.getItem('traderZenUser');
        if (user && ACCOUNTS[user] && ACCOUNTS[user].url) {
            safeStorage.setItem('traderZenSheetsUrl', ACCOUNTS[user].url);
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('login-username').value.trim().toLowerCase();
            const pass = document.getElementById('login-password').value.trim();

            if (ACCOUNTS[user] && ACCOUNTS[user].password === pass) {
                safeStorage.setItem('traderZenLoggedIn', 'true');
                safeStorage.setItem('traderZenUser', user);
                if (ACCOUNTS[user].url) {
                    safeStorage.setItem('traderZenSheetsUrl', ACCOUNTS[user].url);
                }
                loginError.style.display = 'none';
                loginOverlay.style.display = 'none';

                // Trigger sync immediately now that we have the URL
                if (typeof window.loadSessionsToDashboard === 'function') {
                    window.loadSessionsToDashboard();
                }
            } else {
                loginError.style.display = 'block';
            }
        });
    }

    // Initialize Lucide Icons
    lucide.createIcons();
    // Set Current Date dynamically
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        const today = new Date();
        dateElement.textContent = `Today, ${today.toLocaleDateString('en-US', options)}`;
    }

    // Mood Selector Logic (Pre-Market is multi-select, Setup Quality is single-select)
    const moodSelectors = document.querySelectorAll('.mood-selector');

    moodSelectors.forEach((selector, index) => {
        const btns = selector.querySelectorAll('.mood-btn');
        // The first selector on the page is Pre-Market Mindset
        const isMultiSelect = index === 0;

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (isMultiSelect) {
                    // Multi-select for Pre-Market Mindset
                    btn.classList.toggle('selected');
                } else {
                    // Single-select for Setup Quality
                    btns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                }
            });
        });
    });

    // Setup Type Toggle Logic
    const setupRadios = document.querySelectorAll('input[name="setup-type"]');
    const reversalCheckboxes = document.getElementById('reversal-checkboxes');
    const continuationCheckboxes = document.getElementById('continuation-checkboxes');

    if (setupRadios.length > 0) {
        setupRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'reversal') {
                    reversalCheckboxes.style.display = 'block';
                    continuationCheckboxes.style.display = 'none';
                } else if (e.target.value === 'continuation') {
                    reversalCheckboxes.style.display = 'none';
                    continuationCheckboxes.style.display = 'block';
                }
            });
        });
    }

    // Emotion Tags Logic (Multi-select)
    const emotionTags = document.querySelectorAll('.tag');
    emotionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    });

    // --- AI COACH FEEDBACK LOGIC ---
    function generateAICoachFeedback(d) {
        if (!d) return null;
        const executionAnalysis = [];
        const psychologyAnalysis = [];
        const rulesAnalysis = [];
        const consistencyCheck = [];
        const specificFeedback = [];
        let nextFocus = "";

        // 1. Execution Analysis (Confirmations vs Setup Quality)
        const confCount = (d.confirmations || []).length;
        const rating = (d.setupQuality || 'none').toLowerCase();
        const setupType = d.setupType || 'none';

        if ((rating.includes('a') && confCount < 2) || (rating.includes('b+') && confCount < 1)) {
            executionAnalysis.push(`You graded this setup as ${rating.toUpperCase()}, but you only identified ${confCount} technical confirmation(s). This shows you are being too generous with your grading or ignoring the actual evidence to justify taking a trade.`);
            executionAnalysis.push("When you inflate your ratings, you lose the ability to tell which setups actually make you money. Stick to the data and only give top marks when the market gives you everything you need.");
        } else if (rating.includes('c') && confCount >= 3) {
            executionAnalysis.push(`This setup had ${confCount} strong confirmations, yet you only gave it a ${rating.toUpperCase()} rating. This suggests you are doubting your strategy even when the market is giving you clear signals.`);
            executionAnalysis.push("Consistency comes from trusting your plan, not from your gut feeling. If the criteria are met, be objective about the quality.");
        } else {
            executionAnalysis.push(`The ${setupType} setup rating of ${rating.toUpperCase()} matches the technical evidence you recorded. This shows you are being honest and realistic about the opportunities you are taking.`);
            executionAnalysis.push("Staying objective about setup quality is how you build a reliable database of your performance over time.");
        }

        // 2. Psychology Analysis (Emotions vs Execution)
        const negativeStates = ['Fear', 'Anxiety', 'FOMO', 'Greed', 'Frustration', 'Revenge Trading Urge', 'Impatience', 'Doubt', 'Hesitation'];
        const feltEmotions = d.emotions || [];
        const feltNegatives = feltEmotions.filter(e => negativeStates.includes(e));

        if (feltNegatives.length > 0) {
            psychologyAnalysis.push(`Feeling ${feltNegatives.join(' and ')} during the trade is a sign that your survival instincts are interfering with your plan. These emotions usually make traders rush entries or close trades too early because they are scared of losing or missing out.`);
            psychologyAnalysis.push("When you feel this way, you are reacting to the price flickering on the screen instead of following your business plan. The goal is to notice these feelings and pause before you take action based on them.");
        } else {
            psychologyAnalysis.push("You stayed calm and steady during this trade. This neutral state is what allows your technical edge to actually work over the long run because you aren't fighting your own ego.");
            psychologyAnalysis.push("Maintaining this internal stability is a major win for your discipline.");
        }

        // 3. Rule Discipline (Respected vs Broken)
        const coreRules = ["Respected Stop Loss", "Respected Break Even", "Respected Take Profit", "Waited For Confirmation"];
        const rulesTaken = d.rules || [];
        const respected = rulesTaken.filter(r => coreRules.includes(r));
        const broken = coreRules.filter(r => !rulesTaken.includes(r));

        if (respected.length > 0) {
            rulesAnalysis.push(`Rules Respected: ${respected.join(', ')}. By sticking to these, you protected your capital and acted like a professional trader.`);
        }
        if (broken.length > 0) {
            rulesAnalysis.push(`Rules Broken: ${broken.join(', ')}. Breaking your rules turns your strategy into a guessing game, which makes it impossible to build a consistent career.`);
            rulesAnalysis.push("Every time you break a rule, you train yourself to ignore your plan, which damages your self-trust.");
        } else if (broken.length === 0) {
            rulesAnalysis.push("You followed every single one of your core rules perfectly this session. This level of discipline is more important than whether the trade made money or not.");
        }

        // 4. Consistency Check (Mindset, Emotions, Rating, Rules)
        const moodArr = d.preMarketMoods || [];
        if (moodArr.includes('focused') && (feltEmotions.includes('FOMO') || feltEmotions.includes('Impatience'))) {
            consistencyCheck.push("You started the session feeling focused, but your actions were driven by FOMO and impatience. This means your 'focus' disappeared the moment the chart started moving.");
        }
        if (rating.includes('a') && broken.includes('Waited For Confirmation')) {
            consistencyCheck.push("You called this an A-tier setup but didn't even wait for confirmation. This is a contradiction; a setup isn't high quality if you skip the requirements to enter it.");
        }
        if (consistencyCheck.length === 0) {
            consistencyCheck.push("Your mindset before the trade, your emotions during it, and your final actions all aligned. This consistency is exactly what you need to build a professional process.");
        }

        // 5. Specific Feedback From This Session
        if (broken.includes('Waited For Confirmation')) {
            specificFeedback.push("The biggest issue today was rushing into the trade. Rushing is usually caused by a fear that the market will leave without you, but the market always provides more opportunities.");
            specificFeedback.push("Next time, force yourself to wait for one extra signal or candle close before you click the button.");
        } else if (feltNegatives.includes('FOMO') || feltNegatives.includes('Impatience')) {
            specificFeedback.push("Your struggle this session was chasing the market. This impatience shows you were looking for quick action rather than following a calm business process.");
            specificFeedback.push("Notice the urge to chase next time and use it as a signal to step away for a moment.");
        } else if (broken.length > 0) {
            specificFeedback.push(`You broken your protocol regarding ${broken[0]}. This behavior removes the structure that keeps you safe from large losses.`);
            specificFeedback.push("Consistency only comes from doing the same thing every time, regardless of what the market is doing.");
        } else {
            specificFeedback.push("Your greatest strength was your ability to stay disciplined. You treated this trade like a serious business transaction.");
            specificFeedback.push("Keep focusing on this level of professional execution.");
        }

        // 6. Next Focus (Clear Behavioral Instruction)
        if (broken.includes('Waited For Confirmation')) {
            nextFocus = "Your only mission is to wait for the candle to close and all confirmations to hit. Do not click until the criteria are 100% met. Discipline > Profit.";
        } else if (broken.length > 0) {
            nextFocus = `You broke your ${broken[0]} rule. Your next session is a success ONLY if you respect that specific rule, regardless of the PnL.`;
        } else if (feltNegatives.includes('FOMO') || feltNegatives.includes('Impatience') || feltNegatives.includes('Revenge Trading Urge')) {
            const primaryEmotion = feltNegatives.find(e => ['FOMO', 'Impatience', 'Revenge Trading Urge'].includes(e));
            nextFocus = `You let ${primaryEmotion} dictate your actions today. Prove you are the master of your hands. Sit out the first 15 minutes of tomorrow's session to regain control.`;
        } else if (d.mistake && d.mistake.length > 5) {
            nextFocus = `Focus on correcting the error you identified: "${d.mistake.substring(0, 40)}${d.mistake.length > 40 ? '...' : ''}". Process over outcome.`;
        } else {
            nextFocus = "You executed with perfect discipline today. Your goal for tomorrow is to be 'bored'—repeat this exact mechanical process without adding any ego.";
        }

        return {
            execution: executionAnalysis.join(' '),
            psychology: psychologyAnalysis.join(' '),
            rules: rulesAnalysis.join(' '),
            consistency: consistencyCheck.join(' '),
            specific: specificFeedback.join(' '),
            focus: nextFocus
        };
    }

    // Form Submission Logic
    const form = document.getElementById('session-form');
    const coachSection = document.getElementById('coach-analysis-section');
    const coachLoader = document.getElementById('coach-loading-spinner');
    const coachContent = document.getElementById('coach-content-body');
    const newSessionBtn = document.getElementById('new-session-btn');
    const formActions = document.getElementById('form-actions-container');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // --- GATHER FORM DATA ---
            const moodSelectors = document.querySelectorAll('.mood-selector');
            const preMarketMoods = Array.from(moodSelectors[0]?.querySelectorAll('.mood-btn.selected') || []).map(b => b.dataset.mood);

            const numInputs = document.querySelectorAll('input[type="number"]');
            const energy = parseInt(numInputs[0]?.value) || 5;
            const stress = parseInt(numInputs[1]?.value) || 5;

            const setupType = document.querySelector('input[name="setup-type"]:checked')?.value || 'none';
            const setupQuality = Array.from(moodSelectors[1]?.querySelectorAll('.mood-btn.selected') || []).map(b => b.dataset.mood)[0] || 'none';

            const emotions = Array.from(document.querySelectorAll('.emotion-tags .tag.selected')).map(t => t.textContent.trim());

            const confirmations = Array.from(document.querySelectorAll('input[name="confirmations"]:checked')).map(cb => cb.value);
            const rules = Array.from(document.querySelectorAll('input[name="rules"]:checked')).map(cb => cb.value);

            const textareas = document.querySelectorAll('textarea');
            const didWell = textareas[0]?.value.trim() || "";
            const mistake = textareas[1]?.value.trim() || "";
            const emotionActions = textareas[2]?.value.trim() || "";

            const goodTrade = document.querySelector('input[name="good-trade"]:checked')?.value || 'none';
            const outcome = document.querySelector('input[name="trade-outcome"]:checked')?.value || 'unspecified';

            const data = { preMarketMoods, energy, stress, setupType, setupQuality, emotions, confirmations, rules, didWell, mistake, emotionActions, goodTrade, outcome };
            const feedback = generateAICoachFeedback(data);

            // --- SAVE/UPDATE IN LOCALSTORAGE ---
            const editingId = form.dataset.editingId;
            let currentSessionId = editingId;
            let savedSessions = [];
            try {
                savedSessions = JSON.parse(safeStorage.getItem('traderZenSessions') || '[]');
            } catch (e) { console.error(e); }

            if (editingId) {
                // Update existing
                const index = savedSessions.findIndex(s => s.id === editingId);
                if (index !== -1) {
                    savedSessions[index].formInputs = data;
                    savedSessions[index].aiFeedback = feedback;
                }
                delete form.dataset.editingId;
            } else {
                // Create new
                currentSessionId = Date.now().toString();
                const sessionData = {
                    id: currentSessionId,
                    date: new Date().toISOString(),
                    formInputs: data,
                    aiFeedback: feedback
                };
                savedSessions.unshift(sessionData);
            }

            try {
                safeStorage.setItem('traderZenSessions', JSON.stringify(savedSessions));
            } catch (err) {
                console.error("Storage error:", err);
            }

            // --- UI FEEDBACK ---
            const submitBtn = document.getElementById('save-session-btn');
            submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
            lucide.createIcons();

            setTimeout(() => {
                submitBtn.innerHTML = '<i data-lucide="check-circle"></i> Saved & Synced';
                submitBtn.style.backgroundColor = '#4ade80';
                submitBtn.style.color = '#fff';
                lucide.createIcons();

                setTimeout(() => {
                    formActions.style.display = 'none';
                    form.querySelectorAll('input, textarea, button[type="button"].mood-btn').forEach(input => input.disabled = true);
                    document.querySelectorAll('.emotion-tags .tag').forEach(tag => tag.style.pointerEvents = 'none');

                    coachSection.style.display = 'block';
                    coachSection.scrollIntoView({ behavior: 'smooth', block: 'end' });

                    document.getElementById('coach-execution').textContent = feedback.execution;
                    document.getElementById('coach-psychology').textContent = feedback.psychology;
                    document.getElementById('coach-rules').textContent = feedback.rules;
                    document.getElementById('coach-consistency').textContent = feedback.consistency;
                    document.getElementById('coach-specific').textContent = feedback.specific;
                    document.getElementById('coach-focus').textContent = feedback.focus;

                    // --- GOOGLE SHEETS SYNC ---
                    syncToGoogleSheets(currentSessionId, feedback);

                    setTimeout(() => {
                        coachLoader.style.display = 'none';
                        coachContent.style.display = 'block';
                        lucide.createIcons();
                        if (typeof window.loadSessionsToDashboard === 'function') window.loadSessionsToDashboard();
                    }, 1500);
                }, 800);
            }, 800);
        });
    }

    if (newSessionBtn) {
        newSessionBtn.addEventListener('click', () => {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            const today = new Date();
            document.getElementById('current-date').textContent = `Today, ${today.toLocaleDateString('en-US', options)}`;
            document.querySelector('.page-title').textContent = "New Trading Session";

            // Reset everything for a new session
            form.reset();
            delete form.dataset.editingId;

            // Enable inputs
            const allInputs = form.querySelectorAll('input, textarea, button[type="button"].mood-btn');
            allInputs.forEach(input => input.disabled = false);
            emotionTags.forEach(tag => tag.style.pointerEvents = 'auto');

            // Remove selected classes
            moodSelectors.forEach(selector => {
                const btns = selector.querySelectorAll('.mood-btn');
                btns.forEach(b => b.classList.remove('selected'));
            });
            emotionTags.forEach(t => t.classList.remove('selected'));

            // Hide AI section
            coachSection.style.display = 'none';
            coachLoader.style.display = 'flex';
            coachContent.style.display = 'none';

            // Show and reset save button
            formActions.style.display = 'flex';
            const submitBtn = document.getElementById('save-session-btn');
            submitBtn.innerHTML = '<i data-lucide="check"></i> Save Session';
            submitBtn.style.backgroundColor = '';
            submitBtn.style.color = '';
            lucide.createIcons();

            // Scroll to top
            document.querySelector('.scroll-area').scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- VIEW ROUTING & DASHBOARD LOGIC ---
    const viewDashboard = document.getElementById('view-dashboard');
    const viewJournalForm = document.getElementById('view-journal-form');
    const viewWeeklyReview = document.getElementById('view-weekly-review');
    const navDashboard = document.getElementById('nav-dashboard');
    const navNewSession = document.getElementById('nav-new-session');
    const navWeeklyReview = document.getElementById('nav-weekly-review');
    const navSettings = document.getElementById('nav-settings');
    const dashNewSessionBtn = document.getElementById('dashboard-new-session-btn');
    const sessionListContainer = document.getElementById('session-list');
    const weeklyReviewContent = document.getElementById('weekly-review-content');
    const viewSettings = document.getElementById('view-settings');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const testConnectionBtn = document.getElementById('test-connection-btn');
    const sheetsUrlInput = document.getElementById('sheets-url-input');
    const settingsStatus = document.getElementById('settings-status');

    function switchView(viewName) {
        console.log("Switching view to:", viewName);
        // Reset Nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

        if (viewDashboard) viewDashboard.style.display = 'none';
        if (viewJournalForm) viewJournalForm.style.display = 'none';
        if (viewWeeklyReview) viewWeeklyReview.style.display = 'none';
        if (viewSettings) viewSettings.style.display = 'none';

        if (viewName === 'dashboard') {
            if (viewDashboard) viewDashboard.style.display = 'flex';
            if (navDashboard) navDashboard.classList.add('active');
            if (typeof window.loadSessionsToDashboard === 'function') {
                window.loadSessionsToDashboard();
            }
        } else if (viewName === 'new-session') {
            if (viewJournalForm) viewJournalForm.style.display = 'flex';
            if (navNewSession) navNewSession.classList.add('active');

            // Optional: Call new session reset logic if navigating from a completed state
            if (newSessionBtn) newSessionBtn.click();
        } else if (viewName === 'weekly-review') {
            if (viewWeeklyReview) viewWeeklyReview.style.display = 'flex';
            if (navWeeklyReview) navWeeklyReview.classList.add('active');

            if (typeof window.loadWeeklyReview === 'function') {
                window.loadWeeklyReview();
            }
        } else if (viewName === 'settings') {
            if (viewSettings) viewSettings.style.display = 'flex';
            if (navSettings) navSettings.classList.add('active');

            // Load current settings
            if (sheetsUrlInput) {
                sheetsUrlInput.value = safeStorage.getItem('traderZenSheetsUrl') || '';
            }
        }
    }

    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('dashboard');
        });
    }

    if (navNewSession) {
        navNewSession.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('new-session');
        });
    }

    if (dashNewSessionBtn) {
        dashNewSessionBtn.addEventListener('click', () => {
            switchView('new-session');
        });
    }

    if (navWeeklyReview) {
        navWeeklyReview.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('weekly-review');
        });
    }

    if (navSettings) {
        navSettings.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('settings');
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const url = sheetsUrlInput.value.trim();
            safeStorage.setItem('traderZenSheetsUrl', url);

            settingsStatus.textContent = "Settings saved successfully.";
            settingsStatus.style.color = "#10b981";
            settingsStatus.style.display = "block";

            setTimeout(() => {
                settingsStatus.style.display = "none";
            }, 3000);
        });
    }

    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', async () => {
            const url = sheetsUrlInput.value.trim();
            if (!url) {
                alert("Please paste a Web App URL first.");
                return;
            }

            testConnectionBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Testing...';
            lucide.createIcons();

            try {
                // Using a GET request first to securely verify the deployment status. 
                // The updated Apps Script includes a doGet that returns a JSON success status.
                const response = await fetch(url);
                const data = await response.json();

                if (data.status === 'success') {
                    settingsStatus.textContent = "Connection successful! Script is ready.";
                    settingsStatus.style.color = "#10b981";
                } else {
                    settingsStatus.textContent = "Apps Script Error: " + (data.message || "Unknown error");
                    settingsStatus.style.color = "#ef4444";
                }
                settingsStatus.style.display = "block";

                // Fire off the test data payload silently in the background
                const testPayload = {
                    date: new Date().toLocaleString(),
                    preMarketMoods: ["Test Connection - TraderZen"],
                    setupType: "N/A",
                    confirmations: [],
                    setupQuality: "N/A",
                    emotions: [],
                    rules: [],
                    reflection: "Tested connection from TraderZen app.",
                    aiFeedbackSummary: "Verify this row appeared in Google Sheets."
                };
                fetch(url, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(testPayload)
                }).catch(e => console.error("Test POST error", e));

            } catch (err) {
                console.error("Connection Error:", err);
                settingsStatus.textContent = "Connection failed. Please verify the URL and ensure you deployed as 'Anyone'.";
                settingsStatus.style.color = "#ef4444";
                settingsStatus.style.display = "block";
            } finally {
                testConnectionBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Test Connection';
                lucide.createIcons();
            }
        });
    }

    async function syncToGoogleSheets(sessionId, feedback) {
        const url = safeStorage.getItem('traderZenSheetsUrl');
        if (!url) {
            console.log("No Google Sheets URL configured. Skipping sync.");
            return;
        }

        let sessions = JSON.parse(safeStorage.getItem('traderZenSessions') || '[]');
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const d = session.formInputs;
        const payload = {
            date: new Date(session.date).toLocaleString(),
            preMarketMoods: d.preMarketMoods || [],
            setupType: d.setupType || 'none',
            confirmations: d.confirmations || [],
            setupQuality: d.setupQuality || 'none',
            emotions: d.emotions || [],
            rules: d.rules || [],
            reflection: `Well: ${d.didWell}\nMistake: ${d.mistake}\nEmotions: ${d.emotionActions}`,
            aiFeedbackSummary: feedback.focus
        };

        try {
            // Using text/plain and no-cors to avoid OPTIONS preflight issues with Apps Script
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(payload)
            });
            console.log("Sync request sent to Google Sheets.");
        } catch (err) {
            console.error("Failed to sync to Google Sheets:", err);
        }
    }

    window.syncFromGoogleSheets = async function () {
        const url = safeStorage.getItem('traderZenSheetsUrl');
        if (!url) return false;

        console.log("Fetching sessions from Google Sheets...");
        try {
            const response = await fetch(url + '?action=fetch');
            const result = await response.json();

            if (result.status === 'success' && result.data && result.data.length > 1) {
                // The first row is headers, skip it
                const rows = result.data.slice(1);

                let savedSessions = [];
                try {
                    savedSessions = JSON.parse(safeStorage.getItem('traderZenSessions') || '[]');
                } catch (e) { }

                // Map rows to session objects
                const fetchedSessions = rows.map(row => {
                    // Date, Mindset, Setup Type, Confirmations, Setup Quality, Emotions, Rules, Reflection, AI Focus
                    if (!row[0]) return null;

                    const dateStr = row[0];
                    // Generate deterministic ID from Date string to deduplicate
                    const id = new Date(dateStr).getTime().toString();

                    if (savedSessions.find(s => s.id === id)) {
                        // Already exists locally, keep local version
                        return savedSessions.find(s => s.id === id);
                    }

                    const preMarketMoods = row[1] ? row[1].toString().split(', ') : [];
                    const setupType = row[2] || 'none';
                    const confirmations = row[3] ? row[3].toString().split(', ') : [];
                    const setupQuality = row[4] || 'none';
                    const emotions = row[5] ? row[5].toString().split(', ') : [];
                    const rules = row[6] ? row[6].toString().split(', ') : [];

                    const reflection = row[7] || "";
                    let didWell = "", mistake = "", emotionActions = "";
                    const parts = reflection.toString().split('\n');
                    parts.forEach(p => {
                        if (p.startsWith('Well:')) didWell = p.replace('Well:', '').trim();
                        if (p.startsWith('Mistake:')) mistake = p.replace('Mistake:', '').trim();
                        if (p.startsWith('Emotions:')) emotionActions = p.replace('Emotions:', '').trim();
                    });

                    const outcome = "unspecified";

                    const formInputs = {
                        preMarketMoods, energy: 5, stress: 5, setupType, setupQuality, emotions, confirmations, rules, didWell, mistake, emotionActions, outcome
                    };

                    return {
                        id,
                        date: new Date(dateStr).toISOString(),
                        formInputs,
                        aiFeedback: row[8] ? { focus: row[8] } : null
                    };
                }).filter(Boolean);

                // Sort by newest first
                fetchedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));

                safeStorage.setItem('traderZenSessions', JSON.stringify(fetchedSessions));
                console.log("Synced", fetchedSessions.length, "sessions from Google Sheets.");
                return true;
            }
        } catch (err) {
            console.error("Failed to fetch sessions from Google Sheets:", err);
        }
        return false;
    };

    // Make load function available globally for the submit handler
    window.loadSessionsToDashboard = async function () {
        console.log("Running loadSessionsToDashboard...");
        if (!sessionListContainer) {
            console.error("Error: sessionListContainer (#session-list) not found.");
            return;
        }

        const url = safeStorage.getItem('traderZenSheetsUrl');
        if (url && !sessionListContainer.dataset.syncing) {
            sessionListContainer.dataset.syncing = "true";
            sessionListContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i data-lucide="loader-2" class="spin" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 1rem;"></i>
                    <h3>Syncing from Google Sheets...</h3>
                </div>
            `;
            lucide.createIcons();

            await window.syncFromGoogleSheets();
            delete sessionListContainer.dataset.syncing;
        }

        let savedSessions = [];
        try {
            const raw = safeStorage.getItem('traderZenSessions');
            savedSessions = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Critical: Failed to load sessions from storage", e);
            savedSessions = [];
        }

        console.log("Found sessions:", savedSessions.length);

        if (savedSessions.length === 0) {
            sessionListContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 1rem;"></i>
                    <h3>No Sessions Yet</h3>
                    <p>Start a new session to log your first trade and get AI feedback.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        sessionListContainer.innerHTML = savedSessions.map((session, index) => {
            const dateStr = new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            const outcome = session.formInputs?.outcome || 'unspecified';
            let outcomeClass = '';
            if (outcome === 'win' || outcome === 'partial-win') outcomeClass = 'win';
            else if (outcome === 'loss' || outcome === 'partial-loss') outcomeClass = 'loss';
            else if (outcome === 'break-even') outcomeClass = 'breakeven';

            const rating = (session.formInputs?.setupQuality && session.formInputs.setupQuality !== 'none') ? session.formInputs.setupQuality.toUpperCase() : '';

            return `
                <div class="session-card fade-in" tabindex="0" onclick="viewPastSession('${session.id}')" style="animation-delay: ${index * 0.05}s;">
                    <div class="session-card-header">
                        <span class="session-card-date">${dateStr}</span>
                        <div class="session-card-badges">
                            ${outcome !== 'unspecified' ? `<span class="badge ${outcomeClass}">${outcome.replace('-', ' ')}</span>` : ''}
                            ${rating ? `<span class="badge rating">${rating}</span>` : ''}
                            ${session.formInputs?.setupType && session.formInputs.setupType !== 'none' ? `<span class="badge">${session.formInputs.setupType}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="session-card-preview">
                        ${(() => {
                    try {
                        const f = session.aiFeedback || (session.formInputs ? generateAICoachFeedback(session.formInputs) : null);
                        if (!f) return "No analysis available.";

                        // Synthesize Analysis: Combine what went right and what went wrong from AI categories
                        const primaryIssue = (f.specific && f.specific.includes('.')) ? f.specific.split('.')[0] + '.' : (f.specific || "");
                        const disciplineState = (f.rules && f.rules.includes('.')) ? f.rules.split('.')[0] + '.' : (f.rules || "");
                        const psychologyState = (f.psychology && f.psychology.includes('.')) ? f.psychology.split('.')[0] + '.' : (f.psychology || "");

                        return `
                                    <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; margin-bottom: 12px;">
                                        ${primaryIssue} ${disciplineState} ${psychologyState}
                                    </div>
                                    <div style="margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--border-light);">
                                        <strong style="color: #3B82F6; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 4px;">Next Focus</strong> 
                                        <p style="font-size: 0.9rem; font-weight: 500; color: var(--navy-dark); line-height: 1.4;">${f.focus || "Keep building consistency"}</p>
                                    </div>
                                `;
                    } catch (err) {
                        console.error("Error rendering session preview:", err);
                        return "Analysis could not be displayed.";
                    }
                })()}
                    </div>

                    <!-- Actions Overlay -->
                    <div class="session-card-actions">
                        <button class="action-btn edit" onclick="event.stopPropagation(); editSession('${session.id}')" title="Edit Session">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); deleteSession('${session.id}')" title="Delete Session">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    };

    window.loadWeeklyReview = function () {
        if (!weeklyReviewContent) return;

        let savedSessions = [];
        try {
            const raw = safeStorage.getItem('traderZenSessions');
            savedSessions = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Critical: Failed to load sessions from storage", e);
        }

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const weekSessions = savedSessions.filter(s => {
            const sessionDate = new Date(s.date);
            return sessionDate >= startOfWeek;
        });

        if (weekSessions.length === 0) {
            weeklyReviewContent.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i data-lucide="calendar" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 1rem;"></i>
                    <h3>No sessions saved this week yet.</h3>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const totalSessions = weekSessions.length;

        // Emotions
        let emotionCounts = {};
        weekSessions.forEach(s => {
            (s.formInputs?.emotions || []).forEach(e => {
                emotionCounts[e] = (emotionCounts[e] || 0) + 1;
            });
        });
        let mostCommonEmotion = "None";
        let maxEmotionCount = 0;
        Object.entries(emotionCounts).forEach(([e, count]) => {
            if (count > maxEmotionCount) {
                maxEmotionCount = count;
                mostCommonEmotion = e;
            }
        });

        // Rules
        const allRules = ["Respected Stop Loss", "Respected Break Even", "Respected Take Profit", "Followed Position Sizing", "Waited For Confirmation", "Max 2 Trades", "Followed Schedule"];
        let rulesRespected = 0;
        let rulesBroken = 0;
        weekSessions.forEach(s => {
            const respected = s.formInputs?.rules || [];
            rulesRespected += respected.length;
            rulesBroken += (allRules.length - respected.length);
        });

        // Quality
        const qualityScores = { 'a-plus': 7, 'a': 6, 'a-minus': 5, 'b-plus': 4, 'b': 3, 'c': 2, 'c-minus': 1, 'none': 0 };
        const scoreToQuality = ['None', 'C-', 'C', 'B', 'B+', 'A-', 'A', 'A+'];
        let totalScore = 0;
        let validQualityCount = 0;
        weekSessions.forEach(s => {
            const q = s.formInputs?.setupQuality || 'none';
            if (q !== 'none' && qualityScores[q]) {
                totalScore += qualityScores[q];
                validQualityCount++;
            }
        });
        let avgQuality = "N/A";
        if (validQualityCount > 0) {
            const avgScore = Math.round(totalScore / validQualityCount);
            avgQuality = scoreToQuality[avgScore] || "N/A";
        }

        // Mistake
        let mistakeCounts = {};
        let mistakeOriginals = {};
        weekSessions.forEach(s => {
            const m = (s.formInputs?.mistake || "").trim();
            if (m) {
                const lower = m.toLowerCase();
                mistakeCounts[lower] = (mistakeCounts[lower] || 0) + 1;
                mistakeOriginals[lower] = m;
            }
        });
        let mostCommonMistake = "None listed";
        let maxMistakeCount = 0;
        Object.entries(mistakeCounts).forEach(([lower, count]) => {
            if (count > maxMistakeCount) {
                maxMistakeCount = count;
                mostCommonMistake = mistakeOriginals[lower];
            }
        });

        // Strength
        let strengthCounts = {};
        let strengthOriginals = {};
        weekSessions.forEach(s => {
            const st = (s.formInputs?.didWell || "").trim();
            if (st) {
                const lower = st.toLowerCase();
                strengthCounts[lower] = (strengthCounts[lower] || 0) + 1;
                strengthOriginals[lower] = st;
            }
        });
        let mostCommonStrength = "None listed";
        let maxStrengthCount = 0;
        Object.entries(strengthCounts).forEach(([lower, count]) => {
            if (count > maxStrengthCount) {
                maxStrengthCount = count;
                mostCommonStrength = strengthOriginals[lower];
            }
        });

        weeklyReviewContent.innerHTML = `
            <div class="card fade-in" style="animation-delay: 0.1s;">
                <div class="card-header">
                    <div class="icon-wrap"><i data-lucide="bar-chart-2"></i></div>
                    <h3>Total Sessions</h3>
                </div>
                <div style="font-size: 2rem; font-weight: 600; color: var(--navy-dark); margin-top: 1rem;">
                    ${totalSessions}
                </div>
            </div>

            <div class="card fade-in" style="animation-delay: 0.15s;">
                <div class="card-header">
                    <div class="icon-wrap"><i data-lucide="heart"></i></div>
                    <h3>Most Common Emotion</h3>
                </div>
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--navy-dark); margin-top: 1rem;">
                    ${mostCommonEmotion}
                </div>
            </div>

            <div class="card fade-in" style="animation-delay: 0.2s;">
                <div class="card-header">
                    <div class="icon-wrap"><i data-lucide="shield-check"></i></div>
                    <h3>Rule Discipline</h3>
                </div>
                <div style="margin-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--text-secondary);">Respected</span>
                        <span style="font-weight: 600; color: #10b981;">${rulesRespected} times</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Broken</span>
                        <span style="font-weight: 600; color: #ef4444;">${rulesBroken} times</span>
                    </div>
                </div>
            </div>

            <div class="card fade-in" style="animation-delay: 0.25s;">
                <div class="card-header">
                    <div class="icon-wrap"><i data-lucide="crosshair"></i></div>
                    <h3>Avg Setup Quality</h3>
                </div>
                <div style="font-size: 2rem; font-weight: 600; color: var(--navy-dark); margin-top: 1rem;">
                    ${avgQuality}
                </div>
            </div>

            <div class="card fade-in" style="animation-delay: 0.3s;">
                <div class="card-header">
                    <div class="icon-wrap"><i data-lucide="alert-circle"></i></div>
                    <h3>Top Mistake</h3>
                </div>
                <div style="font-size: 1.1rem; font-weight: 500; color: var(--navy-dark); margin-top: 1rem; line-height: 1.4;">
                    ${mostCommonMistake}
                </div>
            </div>

            <div class="card fade-in" style="animation-delay: 0.35s;">
                <div class="card-header">
                    <div class="icon-wrap"><i data-lucide="trending-up"></i></div>
                    <h3>Top Strength</h3>
                </div>
                <div style="font-size: 1.1rem; font-weight: 500; color: var(--navy-dark); margin-top: 1rem; line-height: 1.4;">
                    ${mostCommonStrength}
                </div>
            </div>
        `;
        lucide.createIcons();
    };

    // View Past Session feature
    window.viewPastSession = function (id) {
        console.log("Viewing past session ID:", id);
        const savedSessions = JSON.parse(safeStorage.getItem('traderZenSessions') || '[]');
        const session = savedSessions.find(s => s.id === id);

        if (!session) {
            console.error("Error: Session not found for ID:", id);
            return;
        }

        switchView('new-session'); // Hijack new session view

        // 1. Update Title and Date
        const dateStr = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        document.getElementById('current-date').textContent = `Reviewing: ${dateStr}`;
        document.querySelector('.page-title').textContent = "Saved Trading Session";

        // 2. Populate and Disable Pre-Market
        const preMarketBtns = document.querySelectorAll('.mood-selector')[0].querySelectorAll('.mood-btn');
        preMarketBtns.forEach(btn => {
            btn.classList.remove('selected');
            if (session.formInputs.preMarketMoods.includes(btn.dataset.mood)) {
                btn.classList.add('selected');
            }
        });

        const numInputs = document.querySelectorAll('input[type="number"]');
        if (numInputs[0]) numInputs[0].value = session.formInputs.energy;
        if (numInputs[1]) numInputs[1].value = session.formInputs.stress;

        // 3. Setup Type
        const setupRadios = document.querySelectorAll('input[name="setup-type"]');
        setupRadios.forEach(radio => {
            radio.checked = radio.value === session.formInputs.setupType;
        });

        if (session.formInputs.setupType !== 'none') {
            document.querySelector(`input[name="setup-type"][value="${session.formInputs.setupType}"]`)?.dispatchEvent(new Event('change'));
        }

        // 4. Setup Quality
        const qualityBtns = document.querySelectorAll('.mood-selector')[1]?.querySelectorAll('.mood-btn') || [];
        qualityBtns.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood === session.formInputs.setupQuality) {
                btn.classList.add('selected');
            }
        });

        // 5. Emotions
        const tags = document.querySelectorAll('.emotion-tags .tag');
        tags.forEach(tag => {
            tag.classList.remove('selected');
            if (session.formInputs.emotions.includes(tag.textContent.trim())) {
                tag.classList.add('selected');
            }
            tag.style.pointerEvents = 'none'; // disable
        });

        // 6. Rules & Confirmations
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(cb => {
            const val = cb.value;
            if (cb.name === 'confirmations') {
                cb.checked = (session.formInputs.confirmations || []).includes(val);
            } else if (cb.name === 'rules') {
                cb.checked = (session.formInputs.rules || []).includes(val);
            }
        });

        // 7. Post Trade
        const outcomeRadios = document.querySelectorAll('input[name="trade-outcome"]');
        outcomeRadios.forEach(radio => radio.checked = radio.value === session.formInputs.outcome);

        const goodTradeRadios = document.querySelectorAll('input[name="good-trade"]');
        goodTradeRadios.forEach(radio => radio.checked = radio.value === session.formInputs.goodTrade);

        const textareas = document.querySelectorAll('textarea');
        if (textareas[0]) textareas[0].value = session.formInputs.didWell;
        if (textareas[1]) textareas[1].value = session.formInputs.mistake;
        if (textareas[2]) textareas[2].value = session.formInputs.emotionActions;

        const allInputs = form.querySelectorAll('input, textarea, button[type="button"].mood-btn');
        allInputs.forEach(input => input.disabled = true);
        formActions.style.display = 'none';

        // 8. Populate AI Feedback (regenerate if missing)
        const feedback = session.aiFeedback || (session.formInputs ? generateAICoachFeedback(session.formInputs) : null);
        if (feedback) {
            document.getElementById('coach-execution').textContent = feedback.execution;
            document.getElementById('coach-psychology').textContent = feedback.psychology;
            document.getElementById('coach-rules').textContent = feedback.rules;
            document.getElementById('coach-consistency').textContent = feedback.consistency;
            document.getElementById('coach-specific').textContent = feedback.specific;
            document.getElementById('coach-focus').textContent = feedback.focus;
        } else {
            document.getElementById('coach-execution').textContent = "Feedback unavailable.";
            document.getElementById('coach-psychology').textContent = "-";
            document.getElementById('coach-rules').textContent = "-";
            document.getElementById('coach-consistency').textContent = "-";
            document.getElementById('coach-specific').textContent = "-";
            document.getElementById('coach-focus').textContent = "-";
        }

        // Ensure section is visible
        if (coachSection) {
            coachSection.style.display = 'block';
            if (coachLoader) coachLoader.style.display = 'none';
            if (coachContent) coachContent.style.display = 'block';
            coachSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        lucide.createIcons();
    };

    // --- DELETE MODAL LOGIC ---
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    let sessionToDelete = null;

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            if (deleteModal) deleteModal.style.display = 'none';
            sessionToDelete = null;
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (sessionToDelete) {
                let savedSessions = JSON.parse(safeStorage.getItem('traderZenSessions') || '[]');
                savedSessions = savedSessions.filter(s => s.id !== sessionToDelete);
                safeStorage.setItem('traderZenSessions', JSON.stringify(savedSessions));
                window.loadSessionsToDashboard();
            }
            if (deleteModal) deleteModal.style.display = 'none';
            sessionToDelete = null;
        });
    }

    // Delete Session feature (Now uses custom modal)
    window.deleteSession = function (id) {
        console.log("Delete session triggered for ID:", id);
        sessionToDelete = id;
        const modal = document.getElementById('delete-modal');
        if (modal) {
            console.log("Showing delete modal");
            modal.style.display = 'flex';
            lucide.createIcons();
        } else {
            console.error("Critical Error: Delete modal element not found in DOM");
            // Fallback to generic confirm if modal fails
            if (confirm("Are you sure you want to delete this session?")) {
                let savedSessions = JSON.parse(safeStorage.getItem('traderZenSessions') || '[]');
                savedSessions = savedSessions.filter(s => s.id !== id);
                safeStorage.setItem('traderZenSessions', JSON.stringify(savedSessions));
                window.loadSessionsToDashboard();
            }
        }
    };

    // Edit Session feature (Enables inputs for a past session)
    window.editSession = function (id) {
        window.viewPastSession(id); // First load the data

        // Change title to Edit Mode
        document.querySelector('.page-title').textContent = "Editing Trading Session";

        // Re-enable all inputs
        form.querySelectorAll('input, textarea, button[type="button"].mood-btn').forEach(input => input.disabled = false);
        document.querySelectorAll('.emotion-tags .tag').forEach(tag => tag.style.pointerEvents = 'auto');

        // Show the save button again (Updated for Edit)
        formActions.style.display = 'flex';
        const submitBtn = document.getElementById('save-session-btn');
        submitBtn.innerHTML = '<i data-lucide="save"></i> Update Session';

        // We'll need a way for the submit handler to know if it's an update
        form.dataset.editingId = id;

        // Hide AI section while editing
        coachSection.style.display = 'none';

        lucide.createIcons();
    };

    // Initialize View
    console.log("Initializing app view...");
    switchView('dashboard');

});
