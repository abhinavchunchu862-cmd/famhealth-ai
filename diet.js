document.addEventListener('DOMContentLoaded', () => {
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) { window.location.href = 'index.html'; return; }
    const user = JSON.parse(userRaw);

    // Dynamic Goals based on age, weight, height, activity_level, goal
    // Simplified Mifflin-St Jeor Equation
    const weight = user.weight || 70;
    const height = user.height || 170;
    const age = user.age || 30; // user requested age to impact calculation
    
    // Base BMR - assuming Male formula for generic use or average
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    
    // Activity factor
    let multiplier = 1.2;
    if (user.activity === 'medium') multiplier = 1.55;
    if (user.activity === 'high') multiplier = 1.9;
    
    let dailyGoalCals = Math.round(bmr * multiplier);
    
    // Goal factor
    if (user.goal === 'Weight Loss') dailyGoalCals -= 500;
    if (user.goal === 'Muscle Gain' || user.goal === 'Weight Gain') dailyGoalCals += 500;
    
    // Macros mapping (P=4, C=4, F=9 kcal per gram)
    let pctP = 0.25, pctC = 0.50, pctF = 0.25;
    if (user.goal === 'Weight Loss') { pctP = 0.35; pctC = 0.35; pctF = 0.30; }
    if (user.goal === 'Muscle Gain') { pctP = 0.30; pctC = 0.45; pctF = 0.25; }
    
    const goalPro = Math.round((dailyGoalCals * pctP) / 4);
    const goalCarb = Math.round((dailyGoalCals * pctC) / 4);
    const goalFat = Math.round((dailyGoalCals * pctF) / 9);

    document.getElementById('calorieGoalLabel').textContent = `/ ${dailyGoalCals} kcal`;
    document.getElementById('goalPro').textContent = `/ ${goalPro}g`;
    document.getElementById('goalCarb').textContent = `/ ${goalCarb}g`;
    document.getElementById('goalFat').textContent = `/ ${goalFat}g`;

    // Elements
    const addFoodFab = document.getElementById('addFoodFab');
    const addFoodSection = document.getElementById('addFoodSection');
    const cancelAdd = document.getElementById('cancelAdd');
    const mealType = document.getElementById('mealType');

    const tabText = document.getElementById('tabText');
    const tabScan = document.getElementById('tabScan');
    const modeText = document.getElementById('modeText');
    const modeScan = document.getElementById('modeScan');

    const quickAddInput = document.getElementById('quickAddInput');
    const quickAddBtn = document.getElementById('quickAddBtn');

    const scanUploadArea = document.getElementById('scanUploadArea');
    const scanInput = document.getElementById('scanInput');
    const scanLoading = document.getElementById('scanLoading');

    const stagingArea = document.getElementById('stagingArea');
    const stagingItemsList = document.getElementById('stagingItemsList');
    const addStagingRow = document.getElementById('addStagingRow');
    const saveLogBtn = document.getElementById('saveLogBtn');
    const stagingTotal = document.getElementById('stagingTotal');

    const calorieText = document.getElementById('calorieText');
    const logsContainer = document.getElementById('logsContainer');

    const valProEl = document.getElementById('valPro');
    const valCarbEl = document.getElementById('valCarb');
    const valFatEl = document.getElementById('valFat');

    // UI Toggles
    addFoodFab.addEventListener('click', () => {
        addFoodSection.classList.remove('hidden');
        stagingArea.classList.add('hidden');
        stagingItemsList.innerHTML = '';
        quickAddInput.value = '';
        addFoodFab.classList.add('hidden');
    });

    cancelAdd.addEventListener('click', () => {
        addFoodSection.classList.add('hidden');
        addFoodFab.classList.remove('hidden');
    });

    tabText.addEventListener('click', () => {
        tabText.classList.add('active'); tabScan.classList.remove('active');
        modeText.classList.remove('hidden'); modeScan.classList.add('hidden');
    });

    tabScan.addEventListener('click', () => {
        tabScan.classList.add('active'); tabText.classList.remove('active');
        modeScan.classList.remove('hidden'); modeText.classList.add('hidden');
    });

    const mockFoodDB = {
        'idli': { cal: 150, p: 4, c: 30, f: 1 },
        'rava idli': { cal: 120, p: 3, c: 25, f: 1 },
        'dosa': { cal: 250, p: 6, c: 40, f: 8 },
        'pesarattu': { cal: 200, p: 10, c: 30, f: 5 },
        'white rice': { cal: 200, p: 4, c: 45, f: 0 },
        'brown rice': { cal: 215, p: 5, c: 45, f: 2 },
        'chicken biryani': { cal: 450, p: 30, c: 55, f: 12 },
        'raita': { cal: 50, p: 4, c: 5, f: 1 },
        'apple': { cal: 95, p: 0, c: 25, f: 0 },
        'banana': { cal: 105, p: 1, c: 27, f: 0 },
        'roasted snacks': { cal: 150, p: 4, c: 20, f: 5 }
    };

    function updateStagingTotal() {
        let sc = 0, sp = 0, sca = 0, sf = 0;
        document.querySelectorAll('.staging-item').forEach(row => {
            sc += parseInt(row.querySelector('.stage-cal').value) || 0;
            sp += parseInt(row.querySelector('.stage-p').value) || 0;
            sca += parseInt(row.querySelector('.stage-c').value) || 0;
            sf += parseInt(row.querySelector('.stage-f').value) || 0;
        });
        if(stagingTotal) {
            stagingTotal.innerHTML = `Pending Total: <span style="color:var(--accent-color); font-weight:700;">${sc} kcal</span> (P:${sp}g C:${sca}g F:${sf}g)`;
        }
    }

    function parseItemsToStaging(itemsArray) {
        stagingItemsList.innerHTML = '';
        itemsArray.forEach(item => createStagingRow(item.name, item.cal, item.p, item.c, item.f));
        stagingArea.classList.remove('hidden');
        modeScan.classList.add('hidden'); 
        updateStagingTotal();
    }

    function createStagingRow(name = "", cal = "", p = "", c = "", f = "") {
        const div = document.createElement('div');
        div.className = 'staging-item';
        // HTML includes name in full width row, then macros in next row
        div.innerHTML = `
            <input type="text" class="stage-name" value="${name}" placeholder="Food name">
            <input type="number" class="stage-macro stage-cal" value="${cal}" placeholder="kcal">
            <input type="number" class="stage-macro stage-p" value="${p}" placeholder="P (g)">
            <input type="number" class="stage-macro stage-c" value="${c}" placeholder="C (g)">
            <input type="number" class="stage-macro stage-f" value="${f}" placeholder="F (g)">
            <button class="remove-staging">×</button>
        `;
        div.querySelector('.remove-staging').addEventListener('click', () => {
            div.remove();
            updateStagingTotal();
        });

        const nameInput = div.querySelector('.stage-name');
        nameInput.addEventListener('change', () => {
            const val = nameInput.value.toLowerCase();
            for(let key in mockFoodDB) {
                if(val.includes(key)) {
                    div.querySelector('.stage-cal').value = mockFoodDB[key].cal;
                    div.querySelector('.stage-p').value = mockFoodDB[key].p;
                    div.querySelector('.stage-c').value = mockFoodDB[key].c;
                    div.querySelector('.stage-f').value = mockFoodDB[key].f;
                    break;
                }
            }
            updateStagingTotal();
        });

        div.querySelectorAll('.stage-macro').forEach(inp => {
            inp.addEventListener('input', updateStagingTotal);
        });

        stagingItemsList.appendChild(div);
        updateStagingTotal();
    }

    addStagingRow.addEventListener('click', () => createStagingRow());

    // Manual / Text Parsing Simulation
    quickAddBtn.addEventListener('click', () => {
        const val = quickAddInput.value;
        if (!val) return;
        // Mock macro split for text entry
        parseItemsToStaging([{ name: val, cal: 200, p: 10, c: 25, f: 6 }]);
    });

    // Image Scanning Simulation
    scanUploadArea.addEventListener('click', () => scanInput.click());
    scanInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            scanUploadArea.classList.add('hidden');
            scanLoading.classList.remove('hidden');
            
            setTimeout(() => {
                scanLoading.classList.add('hidden');
                scanUploadArea.classList.remove('hidden'); 
                
                // Mocks with full macros
                const detected = [
                    { name: 'Chicken Biryani', cal: 450, p: 30, c: 55, f: 12 },
                    { name: 'Raita', cal: 50, p: 4, c: 5, f: 1 }
                ];
                parseItemsToStaging(detected);
            }, 1800);
        }
    });

    // Database Logic
    const DB_KEY = 'food_logs';

    saveLogBtn.addEventListener('click', () => {
        const rows = stagingItemsList.querySelectorAll('.staging-item');
        const finalItems = [];
        
        rows.forEach(row => {
            const name = row.querySelector('.stage-name').value.trim();
            const cal = parseInt(row.querySelector('.stage-cal').value) || 0;
            const p = parseInt(row.querySelector('.stage-p').value) || 0;
            const c = parseInt(row.querySelector('.stage-c').value) || 0;
            const f = parseInt(row.querySelector('.stage-f').value) || 0;
            if (name) finalItems.push({ name, calories: cal, pro: p, carbs: c, fat: f });
        });

        if (finalItems.length === 0) {
            alert('Please add at least one valid food item.');
            return;
        }

        const newLog = {
            id: crypto.randomUUID(),
            userId: user.id,
            mealType: mealType.value,
            items: finalItems,
            timestamp: new Date().toISOString()
        };

        const logs = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        logs.push(newLog);
        localStorage.setItem(DB_KEY, JSON.stringify(logs));

        addFoodSection.classList.add('hidden');
        addFoodFab.classList.remove('hidden');
        renderLogs();
    });

    window.deleteLog = function(logId) {
        let logs = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        logs = logs.filter(l => l.id !== logId);
        localStorage.setItem(DB_KEY, JSON.stringify(logs));
        renderLogs();
    }

    function renderLogs() {
        const logs = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        const todayStr = new Date().toISOString().split('T')[0];
        const userLogs = logs.filter(l => l.userId === user.id && l.timestamp.startsWith(todayStr));

        logsContainer.innerHTML = '';
        
        let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
        userLogs.forEach(l => l.items.forEach(i => {
            totalCal += i.calories; totalPro += i.pro; totalCarb += i.carbs; totalFat += i.fat;
        }));
        
        const isLowProtein = totalPro < (goalPro * 0.8);
        const isHighFat = totalFat > goalFat;

        if (userLogs.length === 0) {
            logsContainer.innerHTML = '<p class="text-secondary" style="font-size: 0.9rem;">No meals logged today yet.</p>';
            calorieText.innerHTML = `0 <br><span class="label" id="calorieGoalLabel">/ ${dailyGoalCals} kcal</span>`;
            valProEl.textContent = '0g'; valCarbEl.textContent = '0g'; valFatEl.textContent = '0g';
            return;
        }

        const grouped = { breakfast: [], lunch: [], snacks: [], dinner: [] };
        userLogs.forEach(l => {
            if (grouped[l.mealType]) grouped[l.mealType].push(l);
            else grouped[l.mealType] = [l];
        });

        ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(type => {
            if (grouped[type].length === 0) return;
            
            const groupDiv = document.createElement('div');
            groupDiv.className = 'meal-group';
            
            let mealTotalCal = 0, mealTotalPro = 0, mealTotalCarb = 0, mealTotalFat = 0;
            grouped[type].forEach(l => {
                l.items.forEach(i => {
                    mealTotalCal += i.calories;
                    mealTotalPro += i.pro;
                    mealTotalCarb += i.carbs;
                    mealTotalFat += i.fat;
                });
            });

            groupDiv.innerHTML = `
                <h3>
                    <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    <span style="font-size: 0.8rem; font-weight: 500;">
                        ${mealTotalCal} kcal 
                        <span style="color:var(--text-secondary); margin-left:8px;">P:${mealTotalPro} C:${mealTotalCarb} F:${mealTotalFat}</span>
                    </span>
                </h3>`;
            
            grouped[type].forEach(log => {
                const logItemOuter = document.createElement('div');
                logItemOuter.className = 'meal-item';
                
                let badgesHtml = '';
                log.items.forEach(item => {
                    let recommendationHtml = '';
                    const nameLower = item.name.toLowerCase();
                    
                    const algStr = (user.allergies || []).join(' ').toLowerCase();
                    const restStr = (user.restrictions || []).join(' ').toLowerCase();
                    const dslkStr = (user.dislikes || '').toLowerCase();
                    
                    const noEggs = algStr.includes('egg') || user.dietType === 'Vegetarian';
                    const noBeef = restStr.includes('beef');
                    const noDairy = restStr.includes('dairy') || algStr.includes('milk');
                    
                    const isAllergicItem = algStr.split(' ').some(a => a.length > 2 && nameLower.includes(a)) || 
                                           dslkStr.split(' ').some(a => a.length > 2 && nameLower.includes(a));
                    
                    if (nameLower.includes('beef') && noBeef) {
                        recommendationHtml = '<div class="better-option" style="font-size: 0.75rem; color: #ef4444; margin-left: 0.5rem; margin-top: 0.25rem;">🚫 Restricted: Better option is chicken or tofu</div>';
                    } else if (nameLower.includes('egg') && noEggs) {
                        recommendationHtml = '<div class="better-option" style="font-size: 0.75rem; color: #ef4444; margin-left: 0.5rem; margin-top: 0.25rem;">🚫 Allergy/Diet Alert: Better option is paneer or tofu</div>';
                    } else if (isAllergicItem) {
                        recommendationHtml = '<div class="better-option" style="font-size: 0.75rem; color: #ef4444; margin-left: 0.5rem; margin-top: 0.25rem;">🚫 Profile Alert: You should avoid this item!</div>';
                    } else if (nameLower.includes('white rice') && (user.healthConditions.includes('Diabetes') || user.goal === 'Weight Loss')) {
                        recommendationHtml = '<div class="better-option" style="font-size: 0.75rem; color: #10b981; margin-left: 0.5rem; margin-top: 0.25rem;">✨ Better option: brown rice</div>';
                    } else if (nameLower.includes('idli') && (user.goal === 'Weight Loss' || user.healthConditions.includes('Diabetes'))) {
                        recommendationHtml = '<div class="better-option" style="font-size: 0.75rem; color: #10b981; margin-left: 0.5rem; margin-top: 0.25rem;">✨ Better option: rava idli</div>';
                    } else if (nameLower.includes('fried') && (user.goal === 'Weight Loss' || user.healthConditions.includes('Thyroid') || isHighFat)) {
                        recommendationHtml = '<div class="better-option" style="font-size: 0.75rem; color: #10b981; margin-left: 0.5rem; margin-top: 0.25rem;">✨ Better option: roasted snacks</div>';
                    } else if ((nameLower.includes('dosa') || nameLower.includes('pancake')) && isLowProtein) {
                        recommendationHtml = '<div class="better-option" style="font-size: 0.75rem; color: #10b981; margin-left: 0.5rem; margin-top: 0.25rem;">✨ Better option: pesarattu (high in protein)</div>';
                    }

                    badgesHtml += `
                        <div style="margin-bottom: 0.5rem; width: 100%;">
                            <div class="food-item-badge" style="margin-bottom: 0;">
                                <span style="font-weight: 500;">${item.name}</span>
                                <span>${item.calories} <span style="font-size: 0.65rem; opacity: 0.7;">P${item.pro} C${item.carbs} F${item.fat}</span></span>
                            </div>
                            ${recommendationHtml}
                        </div>`;
                });

                logItemOuter.innerHTML = `
                    <div class="meal-info" style="flex:1;">
                        ${badgesHtml}
                    </div>
                    <button class="delete-btn" onclick="deleteLog('${log.id}')" style="align-self: flex-start; margin-left: 0.5rem;">×</button>
                `;
                groupDiv.appendChild(logItemOuter);
            });
            logsContainer.appendChild(groupDiv);
        });

        calorieText.innerHTML = `${totalCal} <br><span class="label" id="calorieGoalLabel">/ ${dailyGoalCals} kcal</span>`;
        if (totalCal > dailyGoalCals) calorieText.style.color = 'var(--error)';
        else calorieText.style.color = '#f8fafc';

        valProEl.textContent = totalPro + 'g';
        valCarbEl.textContent = totalCarb + 'g';
        valFatEl.textContent = totalFat + 'g';
        
        const aiSuggestionsList = document.getElementById('aiSuggestionsList');
        if (userLogs.length === 0) {
            aiSuggestionsList.innerHTML = '<li>Start logging meals to get AI feedback!</li>';
        } else {
            let suggestions = [];
            
            if (totalPro < (goalPro * 0.8)) suggestions.push("Add more protein (e.g. eggs, lentils, chicken).");
            if (totalFat > goalFat) suggestions.push("Reduce oil and fried foods today.");
            
            const sugarKeywords = ['sweet', 'cake', 'sugar', 'soda', 'coke', 'candy', 'chocolate', 'dessert', 'ice cream', 'biscuit', 'cookie', 'juice'];
            const fiberKeywords = ['fruit', 'apple', 'banana', 'veg', 'salad', 'greens', 'spinach', 'broccoli', 'oats', 'dal', 'beans', 'carrot'];
            let hasSugar = false, hasFiber = false;
            
            userLogs.forEach(log => {
                log.items.forEach(item => {
                    const name = item.name.toLowerCase();
                    if (sugarKeywords.some(sw => name.includes(sw))) hasSugar = true;
                    if (fiberKeywords.some(fw => name.includes(fw))) hasFiber = true;
                });
            });

            if (hasSugar) suggestions.push("Watch your sugar intake from sweets/drinks.");
            if (!hasFiber) suggestions.push("Eat fruits or veggies to boost your fiber.");
            
            if (suggestions.length === 0) suggestions.push("Macros look balanced! Keep it up.");
            aiSuggestionsList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
        }
        
        if (totalPro >= goalPro) valProEl.style.color = 'var(--success)'; else valProEl.style.color = '';
        if (totalCarb >= goalCarb) valCarbEl.style.color = 'var(--success)'; else valCarbEl.style.color = '';
        if (totalFat >= goalFat) valFatEl.style.color = 'var(--success)'; else valFatEl.style.color = '';
    }

    renderLogs();
});
