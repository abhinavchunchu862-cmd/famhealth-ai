document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM handles corresponding to the Single Page Architecture
    const profileSection = document.getElementById('profileSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const form = document.getElementById('profileForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');

    // STEP 1 & 5 & 6: LOAD CHECK AND DEBUG FALLBACK
    try {
        const savedUserRaw = localStorage.getItem('userProfile');
        if (savedUserRaw) {
            // IF it exists: Hide profile setup, show dashboard section
            const user = JSON.parse(savedUserRaw);
            renderDashboard(user);
        } else {
            // IF it does NOT exist: Show profile setup, hide dashboard (STEP 2 STATE)
            profileSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
    } catch(err) {
        console.error("Error loading profile:", err);
        // STEP 5: DEBUG FALLBACK: ALWAYS show profile fallback!
        profileSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }

    // STEP 2: FIX SAVE BUTTON
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent page reload strictly natively
            if(statusMessage) statusMessage.className = 'hidden';
            
            const age = document.getElementById('age').value;
            if (!age) {
                showStatus('Please provide your age.', 'error');
                return;
            }

            const selectedGoals = Array.from(document.querySelectorAll('input[name="goal"]:checked')).map(cb => cb.value);
            if (selectedGoals.length === 0) {
                showStatus('Please select at least one goal.', 'error');
                return;
            }
            
            // Collect Array Parameters
            const selectedAllergies = Array.from(document.querySelectorAll('input[name="allergy"]:checked')).map(cb => cb.value);
            const customAllergies = document.getElementById('customAllergies').value.split(',').map(s => s.trim()).filter(s => s);
            
            const selectedRestrictions = Array.from(document.querySelectorAll('input[name="restriction"]:checked')).map(cb => cb.value);
            const customRestrictions = document.getElementById('customRestrictions').value.split(',').map(s => s.trim()).filter(s => s);
            
            const actLevel = document.querySelector('input[name="activity_level"]:checked')?.value || 'low';

            // Exact Database Schema Representation mapping explicitly to user instructions
            const data = {
                id: crypto.randomUUID(),
                name: document.getElementById('name').value.trim() || null,
                age: parseInt(age, 10),
                height: document.getElementById('height').value ? parseFloat(document.getElementById('height').value) : null,
                weight: document.getElementById('weight').value ? parseFloat(document.getElementById('weight').value) : null,
                activity_level: actLevel,
                goals: selectedGoals,
                allergies: [...selectedAllergies, ...customAllergies],
                restrictions: [...selectedRestrictions, ...customRestrictions],
                
                // Polyfill Legacy bindings safely preserved cross-app tracking memory
                goal: selectedGoals[0],
                activity: actLevel, 
                healthConditions: ['None'],
                dietType: 'Vegetarian', 
                dislikes: '',
                createdAt: new Date().toISOString()
            };

            // Save to localStorage as exactly "userProfile" (STEP 2 explicitly requires this string ID)
            localStorage.setItem('userProfile', JSON.stringify(data));
            localStorage.setItem('currentUser', JSON.stringify(data)); // Legacy active state bridge securely

            // Show alert offline (STEP 6 feedback metric)
            window.alert('Profile Saved Successfully');
            
            // AFTER saving: Hide profile setup, show dashboard immediately without reloading (STEP 2)
            renderDashboard(data);
        });
    }

    // STEP 4 & 5: TOGGLE VISIBILITY & DASHBOARD CONTENT (Dynamic SPA behavior natively offline)
    function renderDashboard(user) {
        // Toggle visibility!
        profileSection.style.display = 'none';
        dashboardSection.style.display = 'block';

        // Welcome message explicitly targeting user parameters smoothly
        const welcomeEl = document.getElementById('dashWelcomeMsg');
        if (welcomeEl) {
            if (user.name) welcomeEl.textContent = `Welcome, ${user.name.split(' ')[0]} 👋`;
            else welcomeEl.textContent = `Welcome, User 👋`;
        }

        // Basic info & Goals mapping visually organically
        const activityEl = document.getElementById('dashActivity');
        if(activityEl) activityEl.textContent = user.activity_level.charAt(0).toUpperCase() + user.activity_level.slice(1);
        
        const goalEl = document.getElementById('dashGoal');
        if(goalEl) {
            let displayGoal = user.goals[0] ? user.goals[0].replace('_', ' ') : 'Maintain';
            if (user.goals.length > 1) displayGoal += ` (+${user.goals.length - 1} more)`;
            goalEl.textContent = displayGoal.charAt(0).toUpperCase() + displayGoal.slice(1);
        }

        // Map rigorous Restrictions & Allergies array structures visually to front-end natively
        const algEl = document.getElementById('dashAllergies');
        let totalRestr = [...(user.allergies || []), ...(user.restrictions || [])];
        if(algEl) algEl.textContent = totalRestr.length > 0 ? totalRestr.join(', ') : 'None documented';

        // Trigger predictive Daily AI tracking recommendation string conditionally offline
        const recTextEl = document.getElementById('dailyRecText');
        if (recTextEl) {
            let recs = [];
            if (user.goals.includes('weight_loss')) recs.push('focus on a minor caloric deficit');
            if (user.goals.includes('muscle_gain')) recs.push('ensure you hit your robust protein macros');
            if (totalRestr.length > 0) recs.push(`strictly avoid ${totalRestr.join(' and ')} foods actively`);
            
            if (recs.length > 0) {
                recTextEl.textContent = "To support your specific goals, we recommend you " + recs.join(", and ") + ".";
            } else {
                recTextEl.textContent = "Maintain a steady balanced diet and log your tracking goals!";
            }
        }
    }

    // STEP 6: ADD RESET BUTTON explicitly configured to wipe localStorage rigorously
    const resetBtn = document.getElementById('resetProfileBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset your profile and erase all tracking memory natively?")) {
                localStorage.removeItem('userProfile');
                localStorage.removeItem('currentUser');
                
                // STEP 6 explicit requirement "Reload app"
                window.location.reload(); 
            }
        });
    }

    function showStatus(message, type) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden');
        if (type === 'success') {
            statusMessage.style.color = '#10b981';
        } else {
            statusMessage.style.color = '#ef4444';
        }
    }
});
