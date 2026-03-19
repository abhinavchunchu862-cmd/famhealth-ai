document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if user is logged in
    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) {
        // Redirect to profile setup if not found
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(currentUserRaw);

    // 2. Populate UI elements
    const greetingName = document.getElementById('greetingName');
    const avatarInitials = document.getElementById('avatarInitials');
    const greetingGoal = document.getElementById('greetingGoal');

    const valActivity = document.getElementById('valActivity');
    const valGoal = document.getElementById('valGoal');
    const valConditions = document.getElementById('valConditions');

    // Name & Initial
    if (user.name) {
        greetingName.textContent = `Hi, ${user.name.split(' ')[0]}!`;
        avatarInitials.textContent = user.name.charAt(0).toUpperCase();
    } else {
        greetingName.textContent = 'Welcome back!';
        avatarInitials.textContent = 'U';
    }

    // Goal Formatting
    const goalText = user.goal.replace('_', ' ');
    greetingGoal.textContent = `Let's work on your ${goalText} goal today.`;

    // Metrics
    valActivity.textContent = user.activity.charAt(0).toUpperCase() + user.activity.slice(1);
    valGoal.textContent = goalText;
    
    const valDiet = document.getElementById('valDiet');
    if (valDiet) valDiet.textContent = user.dietType || 'Not specified';
    
    const valAllergies = document.getElementById('valAllergies');
    let allgRestr = [];
    if (user.allergies && user.allergies.length) allgRestr.push(...user.allergies);
    if (user.restrictions && user.restrictions.length) allgRestr.push(...user.restrictions);
    if (valAllergies) valAllergies.textContent = allgRestr.length > 0 ? allgRestr.join(', ') : 'None documented';

    if (user.healthConditions && user.healthConditions.length > 0 && !user.healthConditions.includes('None')) {
        valConditions.textContent = user.healthConditions.join(', ');
    } else {
        valConditions.textContent = 'None documented';
    }

    // 3. AI Recommendation Logic
    const dailyRecText = document.getElementById('dailyRecText');
    if (dailyRecText) {
        let recs = [];
        const g = user.goal || '';
        const c = user.healthConditions || [];
        
        // Goal constraints
        if (g === 'Weight Loss') recs.push("reduce your calories and choose low oil food");
        if (g === 'Muscle Gain') recs.push("increase your protein intake");
        
        // Condition constraints
        if (c.includes('Diabetes')) recs.push("reduce sugar and stick to low GI foods");
        if (c.includes('Thyroid')) recs.push("focus heavily on whole foods");
        
        let avoids = [];
        if (user.allergies && user.allergies.length > 0) avoids.push("allergic foods (" + user.allergies.join(', ') + ")");
        if (user.restrictions && user.restrictions.length > 0) avoids.push("restricted foods (" + user.restrictions.join(', ') + ")");
        if (user.dislikes && user.dislikes.length > 0) avoids.push("dislikes (" + user.dislikes + ")");
        
        if (avoids.length > 0) {
            recs.push("strictly avoid " + avoids.join(" and "));
        }
        
        // Combine constraints for a complete sentence
        if (recs.length > 0) {
            dailyRecText.textContent = "To support your specific health profile, we recommend you " + recs.join(", and ") + ".";
        } else {
            dailyRecText.textContent = "Maintain a balanced diet and stay hydrated today!";
        }
    }

    // 4. Logout / Clear Profile
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset your profile and erase all data?")) {
                localStorage.clear();
                window.location.href = 'index.html';
            }
        });
    }

    const langSel = document.getElementById('globalLangToggle');
    if (langSel) {
        langSel.value = localStorage.getItem('appLang') || 'en';
        langSel.addEventListener('change', (e) => {
            if(window.setLanguage) window.setLanguage(e.target.value);
            location.reload(); // Refresh generative scripts cleanly
        });
    }
});
