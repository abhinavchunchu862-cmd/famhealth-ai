const translations = {
    en: {
        nav_home: "Home",
        nav_track: "Track",
        nav_coach: "Coach",
        
        dash_title: "Dashboard",
        dash_snapshot: "Health Snapshot",
        dash_activity: "Activity",
        dash_goal: "Goal",
        dash_conditions: "Conditions",
        dash_ai_assistant: "AI Assistant",
        dash_smart_diet: "Smart Diet",
        dash_smart_diet_desc: "Track meals & macros",
        dash_skin: "Skin Analysis",
        dash_skin_desc: "AI checkup for skin/hair",
        dash_analytics: "Analytics Dashboard",
        dash_analytics_desc: "Diet score & weekly trends",
        dash_switch_profile: "Switch Profile",
        dash_daily_rec: "Daily AI Recommendation",
        
        diet_title: "Smart Diet",
        diet_save: "Save to Log"
    },
    te: {
        nav_home: "హోమ్",
        nav_track: "ట్రాక్",
        nav_coach: "కోచ్",
        
        dash_title: "డ్యాష్‌బోర్డ్",
        dash_snapshot: "ఆరోగ్య నివేదిక",
        dash_activity: "శారీరక శ్రమ",
        dash_goal: "లక్ష్యం",
        dash_conditions: "ఆరోగ్య పరిస్థితులు",
        dash_ai_assistant: "AI సహాయకుడు",
        dash_smart_diet: "స్మార్ట్ డైట్",
        dash_smart_diet_desc: "ఆహారం మరియు మాక్రోస్",
        dash_skin: "చర్మ విశ్లేషణ",
        dash_skin_desc: "చర్మం/జట్టై కోసం AI",
        dash_analytics: "అనలిటిక్స్",
        dash_analytics_desc: "డైట్ స్కోర్ & ట్రెండ్స్",
        dash_switch_profile: "ప్రొఫైల్ మార్చండి",
        dash_daily_rec: "రోజువారీ AI సలహా",
        
        diet_title: "స్మార్ట్ డైట్",
        diet_save: "లాగ్‌ సేవ్ చేయండి"
    }
};

function applyTranslations() {
    const lang = localStorage.getItem('appLang') || 'en';
    const dict = translations[lang] || translations['en'];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if(el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = dict[key];
            } else {
                el.childNodes.forEach(child => {
                    // Only replace the actual text to preserve span hierarchy etc
                    if(child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
                        child.textContent = dict[key];
                    }
                });
                if(el.childNodes.length === 0) el.textContent = dict[key];
            }
        }
    });
}

function setLanguage(lang) {
    localStorage.setItem('appLang', lang);
    applyTranslations();
    // Dispatch event to allow generative text scripts to react
    window.dispatchEvent(new Event('languageChanged'));
}

window.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});
window.setLanguage = setLanguage;
