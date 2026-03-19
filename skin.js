document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    const loadingState = document.getElementById('loadingState');
    const resultsSection = document.getElementById('resultsSection');
    const resetBtn = document.getElementById('resetBtn');
    
    const resSkinType = document.getElementById('resSkinType');
    const resRecommendations = document.getElementById('resRecommendations');

    // Handle Upload Trigger
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // Handle Image Selection
    imageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                uploadArea.classList.add('hidden');
                imagePreviewContainer.classList.remove('hidden');
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Handle Analyze Click
    analyzeBtn.addEventListener('click', () => {
        imagePreviewContainer.classList.add('hidden');
        loadingState.classList.remove('hidden');

        // Simulate AI Processing delay
        setTimeout(() => {
            loadingState.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            
            // Randomize a fun response for prototype purposes
            const types = ["Combination Skin", "Dry/Dehydrated Skin", "Oily/Acne Prone", "Normal Skin"];
            const selectedType = types[Math.floor(Math.random() * types.length)];
            
            resSkinType.textContent = selectedType;
            
            if (selectedType.includes("Oily")) {
                resRecommendations.innerHTML = "Use a salicylic acid cleanser and a lightweight oil-free moisturizer. Don't skip sunscreen! For hair, try a clarifying shampoo twice a week.";
            } else if (selectedType.includes("Dry")) {
                resRecommendations.innerHTML = "Prioritize hydration! Look for hyaluronic acid and ceramides. Use a thick moisturizing cream. For hair, consider a hydrating leave-in conditioner.";
            } else {
                resRecommendations.innerHTML = "Your skin looks balanced. Maintain your current routine with a gentle cleanser and broad-spectrum SPF 30+. Keep hydrating daily!";
            }

        }, 2000);
    });

    // Handle Reset
    resetBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        imageInput.value = '';
    });
});
