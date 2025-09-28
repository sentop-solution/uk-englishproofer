// Register the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Using '/sw.js' ensures it's registered from the root, which is good practice.
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}

document.addEventListener('DOMContentLoaded', () => { 
    const textInput = document.getElementById('text-input');
    const wordCountEl = document.getElementById('word-count');
    const errorMessageEl = document.getElementById('error-message');
    const proofreadBtn = document.getElementById('proofread-btn');
    const resultsEl = document.getElementById('results');

    const WORD_LIMIT = 5000;
    const API_URL = 'https://api.languagetoolplus.com/v2/check';

    const countWords = (text) => {
        if (!text.trim()) {
            return 0;
        }
        return text.trim().split(/\s+/).length;
    };

    const updateWordCount = () => {
        const text = textInput.value;
        const words = countWords(text);

        wordCountEl.textContent = `${words} / ${WORD_LIMIT} words`;

        if (words > WORD_LIMIT) {
            wordCountEl.classList.add('error');
            errorMessageEl.textContent = 'Word limit exceeded.';
            proofreadBtn.disabled = true;
        } else {
            wordCountEl.classList.remove('error');
            errorMessageEl.textContent = '';
            proofreadBtn.disabled = words === 0;
        }
    };

    const displayResults = (matches) => {
        resultsEl.innerHTML = ''; // Clear previous results

        if (matches.length === 0) {
            resultsEl.innerHTML = '<p>No suggestions found. Looks good!</p>';
            return;
        }

        matches.forEach(match => {
            // Create elements programmatically for better security and structure
            const card = document.createElement('div');
            card.className = 'suggestion-card';

            const messageEl = document.createElement('p');
            messageEl.className = 'message';
            messageEl.textContent = match.message;

            const contextP = document.createElement('p');
            const contextStrong = document.createElement('strong');
            contextStrong.textContent = 'Context: ';
            const contextSpan = document.createElement('span');
            contextSpan.className = 'context';
            contextSpan.textContent = `"${match.context.text}"`;
            contextP.append(contextStrong, contextSpan);

            card.appendChild(messageEl);
            card.appendChild(contextP);

            const replacements = match.replacements.map(r => `<code>${r.value}</code>`).join(', ');
            if (replacements) {
                const replacementsP = document.createElement('p');
                const replacementsStrong = document.createElement('strong');
                replacementsStrong.textContent = 'Suggestions: ';
                
                // Using innerHTML here is safe because we construct the `<code>` tags ourselves
                // from a trusted part of the API response.
                const replacementsSpan = document.createElement('span');
                replacementsSpan.className = 'replacements';
                replacementsSpan.innerHTML = replacements;

                replacementsP.append(replacementsStrong, replacementsSpan);
                card.appendChild(replacementsP);
            }

            resultsEl.appendChild(card);
        });
    };

    const handleProofread = async () => {
        const text = textInput.value;
        if (!text.trim()) {
            resultsEl.innerHTML = '<p>Please enter some text to proofread.</p>';
            return;
        }

        proofreadBtn.disabled = true;
        proofreadBtn.textContent = 'Checking...';
        resultsEl.innerHTML = '<p>Checking your text for suggestions...</p>';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `text=${encodeURIComponent(text)}&language=en-GB`
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            displayResults(data.matches);

        } catch (error) {
            console.error('Error during proofreading:', error);
            resultsEl.innerHTML = `<p class="error">Could not get suggestions. Please check your internet connection and try again.</p>`;
        } finally {
            proofreadBtn.disabled = false;
            proofreadBtn.textContent = 'Proofread Text';
            updateWordCount(); // Re-check button state based on word count
        }
    };

    textInput.addEventListener('input', updateWordCount);
    proofreadBtn.addEventListener('click', handleProofread);

    // Initial state
    updateWordCount();
});