document.addEventListener('DOMContentLoaded', () => {
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) { window.location.href = 'index.html'; return; }
    const user = JSON.parse(userRaw);

    // Calculate baseline profile goals
    const weight = user.weight || 70;
    const height = user.height || 170;
    const age = user.age || 30;
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    
    let multiplier = 1.2;
    if (user.activity === 'medium') multiplier = 1.55;
    if (user.activity === 'high') multiplier = 1.9;
    
    let dailyGoalCals = Math.round(bmr * multiplier);
    if (user.goal === 'Weight Loss') dailyGoalCals -= 500;
    if (user.goal === 'Muscle Gain' || user.goal === 'Weight Gain') dailyGoalCals += 500;
    
    let pctP = 0.25, pctC = 0.50, pctF = 0.25;
    if (user.goal === 'Weight Loss') { pctP = 0.35; pctC = 0.35; pctF = 0.30; }
    if (user.goal === 'Muscle Gain') { pctP = 0.30; pctC = 0.45; pctF = 0.25; }
    
    const goalPro = Math.round((dailyGoalCals * pctP) / 4);
    const goalFat = Math.round((dailyGoalCals * pctF) / 9);

    const logs = JSON.parse(localStorage.getItem('food_logs') || '[]');
    const userLogs = logs.filter(l => l.userId === user.id);

    // Group logs by day (last 7 days)
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        dailyStats[dayStr] = { cals: 0, pro: 0, fat: 0, hasLogs: false, dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }) };
    }

    userLogs.forEach(l => {
        const dayStr = l.timestamp.split('T')[0];
        if (dailyStats[dayStr]) {
            dailyStats[dayStr].hasLogs = true;
            l.items.forEach(item => {
                dailyStats[dayStr].cals += item.calories;
                dailyStats[dayStr].pro += item.pro;
                dailyStats[dayStr].fat += item.fat;
            });
        }
    });

    const daysKeys = Object.keys(dailyStats);
    const todayKey = daysKeys[daysKeys.length - 1];
    const todayStats = dailyStats[todayKey];

    // 1. Calculate Diet Score for Today (0-100)
    let score = 0;
    let rankTagline = "Log meals to see score";
    let circleColor = "var(--text-secondary)";

    if (todayStats.hasLogs) {
        // Points for Calorie bounds (Max 40)
        let calDiff = Math.abs(todayStats.cals - dailyGoalCals);
        if (calDiff < dailyGoalCals * 0.1) score += 40;
        else if (calDiff < dailyGoalCals * 0.2) score += 20;
        else if (calDiff < dailyGoalCals * 0.4) score += 10;
        
        // Points for Protein (Max 30)
        if (todayStats.pro >= goalPro * 0.9) score += 30;
        else if (todayStats.pro >= goalPro * 0.5) score += 15;
        
        // Points for Fats tracking (Max 30)
        if (todayStats.fat <= goalFat * 1.1) score += 30;
        else if (todayStats.fat <= goalFat * 1.5) score += 10;

        // Apply colors logically
        if (score >= 80) { circleColor = "var(--success)"; rankTagline = "Excellent. Perfectly balanced!"; }
        else if (score >= 50) { circleColor = "#fbbf24"; rankTagline = "Good. Room for improvement."; }
        else { circleColor = "var(--error)"; rankTagline = "Off-track. Check your macros!"; }
    }

    document.getElementById('scoreValue').textContent = todayStats.hasLogs ? score : '--';
    document.getElementById('scoreTagline').textContent = rankTagline;
    // Render dynamic CSS conic-gradient
    document.getElementById('scoreCircle').style.background = `conic-gradient(${circleColor} 0%, ${circleColor} ${score}%, rgba(255,255,255,0.05) ${score}%)`;

    // 2. Generate Progress Insights
    let insightsHtml = '';
    let daysHitPro = 0;
    let daysHitCal = 0;
    
    daysKeys.forEach(k => {
        if (!dailyStats[k].hasLogs) return;
        if (dailyStats[k].pro >= goalPro * 0.9) daysHitPro++;
        if (Math.abs(dailyStats[k].cals - dailyGoalCals) < dailyGoalCals * 0.15) daysHitCal++;
    });

    if (daysHitPro >= 3) insightsHtml += `<li>🎉 You've hit your protein goal <strong>${daysHitPro} times</strong> this week!</li>`;
    else insightsHtml += `<li>Focus on adding more protein to hit your weekly trends.</li>`;

    if (daysHitCal >= 3) insightsHtml += `<li>🔥 Great consistency! You met your calorie target <strong>${daysHitCal} days</strong>.</li>`;
    else insightsHtml += `<li>Calorie tracking has fluctuated. Try using the Smart Scan to log meals more accurately.</li>`;

    document.getElementById('insightsList').innerHTML = insightsHtml;

    // 3. Render CSS Graphs (Calories and Protein)
    const calChart = document.getElementById('calorieChart');
    const proChart = document.getElementById('proteinChart');
    
    let maxCalFound = dailyGoalCals * 1.5;
    let maxProFound = goalPro * 1.5;
    
    daysKeys.forEach(k => { if(dailyStats[k].cals > maxCalFound) maxCalFound = dailyStats[k].cals; });
    daysKeys.forEach(k => { if(dailyStats[k].pro > maxProFound) maxProFound = dailyStats[k].pro; });

    let calHtml = '';
    let proHtml = '';

    daysKeys.forEach(k => {
        const d = dailyStats[k];
        
        // Cal Chart Math
        const calHeight = d.cals > 0 ? Math.max(5, (d.cals / maxCalFound) * 100) : 0;
        let calColor = "var(--accent-color)";
        if (d.cals > dailyGoalCals * 1.1) calColor = "var(--error)"; 
        
        calHtml += `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height: ${calHeight}%; background: ${d.hasLogs ? calColor : 'transparent'};"></div>
                <div class="chart-label">${d.dayLabel}</div>
            </div>`;
            
        // Pro Chart Math
        const proHeight = d.pro > 0 ? Math.max(5, (d.pro / maxProFound) * 100) : 0;
        let proColor = "#3b82f6";
        if (d.pro >= goalPro * 0.9) proColor = "var(--success)";
        
        proHtml += `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height: ${proHeight}%; background: ${d.hasLogs ? proColor : 'transparent'};"></div>
                <div class="chart-label">${d.dayLabel}</div>
            </div>`;
    });

    calChart.innerHTML = calHtml;
    proChart.innerHTML = proHtml;
});
