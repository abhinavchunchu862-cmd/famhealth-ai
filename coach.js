document.addEventListener('DOMContentLoaded', () => {
    // 1. Session check
    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) {
        window.location.href = 'index.html';
        return;
    }
    const user = JSON.parse(currentUserRaw);

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

    // Food History (Today)
    const logs = JSON.parse(localStorage.getItem('food_logs') || '[]');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.userId === user.id && l.timestamp.startsWith(todayStr));
    
    let totalCal = 0, totalPro = 0;
    todayLogs.forEach(l => l.items.forEach(i => {
        totalCal += i.calories; totalPro += i.pro;
    }));

    // 2. Constants & Elements
    const chatContainer = document.getElementById('chatContainer');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const langToggle = document.getElementById('langToggle');
    const welcomeMsg = document.getElementById('welcomeMsg');

    let isTelugu = false;

    if (user.name) {
        welcomeMsg.textContent = `Hi ${user.name.split(' ')[0]}! I'm your FamHealth AI coach. Ask me "What should I eat today?" or "How is my diet?"`;
    }

    // 3. Smart AI Logic
    const getAiResponse = (userInput) => {
        const lowerInput = userInput.toLowerCase();
        
        const isEatQuery = lowerInput.includes('eat') || lowerInput.includes('food') || lowerInput.includes('bhojanam') || lowerInput.includes('meal');
        const isDietQuery = lowerInput.includes('how is my diet') || lowerInput.includes('status') || lowerInput.includes('progress');

        const remainingCals = Math.max(0, dailyGoalCals - totalCal);
        const lowPro = totalPro < goalPro * 0.8;
        const hasDiab = user.healthConditions && user.healthConditions.includes('Diabetes');
        const hasThyroid = user.healthConditions && user.healthConditions.includes('Thyroid');
        
        let avoids = [];
        if (user.allergies && user.allergies.length > 0) avoids.push(...user.allergies);
        if (user.restrictions && user.restrictions.length > 0) avoids.push(...user.restrictions);
        if (user.dislikes && user.dislikes.length > 0) avoids.push(user.dislikes);
        if (user.dietType && user.dietType !== 'Non-Vegetarian') avoids.push('all meat');
        const hasAvoids = avoids.length > 0;
        const avoidsStr = avoids.join(', ');

        if (isTelugu) {
            if (isDietQuery) {
                if (todayLogs.length === 0) return `మీరు ఈ రోజు ఇంకా భోజనం ట్రాక్ చేయలేదు. ట్రాకింగ్ ప్రారంభించండి! (లక్ష్యం: ${dailyGoalCals} kcal)`;
                let resp = `ఈరోజు మీ డైట్: మీరు ${totalCal} kcal తీసుకున్నారు (మిగిలినవి: ${remainingCals} kcal). `;
                if (lowPro) resp += `మీరు ప్రోటీన్ ఎక్కువగా ఉన్న ఆహారం తీసుకోవాలి. `;
                else resp += `మీ ప్రోటీన్ స్థాయి చాలా బాగుంది! `;
                if (totalCal > dailyGoalCals) resp += `కానీ, మీరు క్యాలరీ పరిమితిని దాటారు.`;
                return resp;
            }
            if (isEatQuery) {
                let resp = `మీ లక్ష్యం (${user.goal.replace('_', ' ')}) ప్రకారం: `;
                if (hasDiab) resp += `చక్కెర తక్కువగా ఉండే బ్రౌన్ రైస్ లేదా ఓట్స్ తీసుకోండి. `;
                else if (hasThyroid) resp += `క్యాబేజీ వంటివి తగ్గించి, ఉడికించిన అసలైన ఆహారం తీసుకోండి. `;
                
                if (hasAvoids) resp += `ముఖ్యంగా వీటిని నివారించండి: ${avoidsStr}. `;
                
                if (lowPro) {
                    if (avoidsStr.includes('egg') || avoidsStr.includes('meat')) resp += `పప్పులు లేదా సోయా పనీర్ మీ భోజనంలో చేర్చండి. `;
                    else resp += `పప్పులు, పాలు, లేదా కోడిగుడ్లు మీ భోజనంలో చేర్చండి. `;
                }
                if (remainingCals < 300) resp += `మీ క్యాలరీలు దాదాపు పూర్తయ్యాయి, తేలికపాటి సలాడ్ లేదా సూప్ తీసుకోండి.`;
                else resp += `మీకు ఇంకా ${remainingCals} kcal అవసరం, కనుక సమతుల్య భోజనం చేయండి.`;
                return resp;
            }
            return `నమస్కారం! దయచేసి "నేను ఈ రోజు ఏమి తినాలి?" లేదా "నా డైట్ ఎలా ఉంది?" అని అడగండి.`;
        } else {
            // English Responses
            if (isDietQuery) {
                if (todayLogs.length === 0) return `You haven't logged any meals today yet! Your goal is ${dailyGoalCals} kcal and ${goalPro}g of protein.`;
                let resp = `Here's your status today: You've consumed ${totalCal} kcal. You have ${remainingCals} kcal remaining today. `;
                if (lowPro) resp += `Your protein is a bit low (${totalPro}g out of ${goalPro}g), try to focus on that for your next meal! `;
                else resp += `Your protein intake is looking great! `;
                if (totalCal > dailyGoalCals) resp += `Note: You are slightly over your calorie limit today.`;
                return resp;
            }
            if (isEatQuery) {
                let resp = `Based on your ${user.goal.replace('_', ' ')} goal: `;
                if (hasDiab) resp += `Since you have diabetes, I suggest a low-GI meal like quinoa or a hearty lentil (moong dal) soup to keep blood sugar stable. `;
                else if (hasThyroid) resp += `Since you have thyroid concerns, focus on warm, cooked whole foods and avoid raw cruciferous veggies. `;
                else resp += `I suggest a balanced meal. `;
                
                if (hasAvoids) resp += `Just ensure you strictly avoid ${avoidsStr} based on your allergies and preferences! `;
                
                if (lowPro && remainingCals > 300) {
                    if (avoidsStr.includes('meat') || avoidsStr.includes('egg')) resp += `Definitely add a strong plant protein source like paneer, tofu, or lentils! `;
                    else resp += `Definitely add a strong protein source like paneer, eggs, or chicken! `;
                }
                if (remainingCals < 300 && remainingCals > 0) resp += `Since you only have ${remainingCals} kcal left today, opt for a very light snack like cucumbers or a small apple.`;
                else if (remainingCals === 0) resp += `Since you hit your calorie limit, stick to water or herbal tea for the rest of the night!`;
                
                return resp;
            }
            return `Hello there! I'm here to help. Try asking me "How is my diet today?" or "What should I eat for dinner?"`;
        }
    };

    // 4. Handle Submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        const typingDiv = appendMessage('...', 'ai', true);
        
        setTimeout(() => {
            chatContainer.removeChild(typingDiv);
            const response = getAiResponse(text);
            appendMessage(response, 'ai');
        }, 1000);
    });

    function appendMessage(text, sender, isTyping = false) {
        const div = document.createElement('div');
        div.className = `chat-msg ${sender === 'user' ? 'msg-user' : 'msg-ai'}`;
        if (isTyping) div.style.opacity = "0.7";
        div.textContent = text;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return div;
    }

    // 5. Handle Language Toggle
    langToggle.addEventListener('click', () => {
        isTelugu = !isTelugu;
        if (isTelugu) {
            langToggle.style.background = 'var(--accent-color)';
            langToggle.textContent = 'English';
            appendMessage(`ఇప్పుడు మనం తెలుగులో మాట్లాడుకుందాం. "నా డైట్ ఎలా ఉంది?" అని అడగండి.`, 'ai');
        } else {
            langToggle.style.background = 'rgba(255,255,255,0.1)';
            langToggle.textContent = 'తెలుగు';
            appendMessage(`Switched back to English! Try asking "What should I eat today?"`, 'ai');
        }
    });
});
