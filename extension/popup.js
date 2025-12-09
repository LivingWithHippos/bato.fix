document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const globalToggle = document.getElementById('global-toggle');
    const mainContent = document.getElementById('main-content');
    const reloadBar = document.getElementById('reload-bar');
    const reloadBtn = document.getElementById('reload-btn');

    const listContainer = document.getElementById('rules-list');
    const inputFrom = document.getElementById('input-from');
    const inputTo = document.getElementById('input-to');
    const addBtn = document.getElementById('add-btn');
    const errorMsg = document.getElementById('error-msg');

    // Load initial state
    init();

    // Event: Global Toggle
    globalToggle.addEventListener('change', () => {
        saveSettings();
        toggleMainContent(globalToggle.checked);
        showReloadUI();
    });

    // Event: Add Rule
    addBtn.addEventListener('click', addNewRule);

    // Event: Manual Reload Button
    reloadBtn.addEventListener('click', () => {
        browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            if (tabs[0]) browser.tabs.reload(tabs[0].id);
            window.close(); // Close popup after clicking reload
        });
    });

    async function init() {
        const data = await browser.storage.local.get(['rules', 'globalEnabled']);

        // Handle Global Toggle (default to true)
        const isEnabled = data.globalEnabled !== false;
        globalToggle.checked = isEnabled;
        toggleMainContent(isEnabled);

        // Handle Rules (default to k->n)
        const rules = data.rules || [{ from: 'k', to: 'n', active: true }];
        renderList(rules);
    }

    function toggleMainContent(enabled) {
        if (enabled) {
            mainContent.classList.remove('disabled');
        } else {
            mainContent.classList.add('disabled');
        }
    }

    function showReloadUI() {
        reloadBar.style.display = 'flex';
    }

    function renderList(rules) {
        listContainer.innerHTML = '';
        rules.forEach((rule, index) => {
            const div = document.createElement('div');
            div.className = 'rule-item';
            div.innerHTML = `
            <span class="rule-text">${rule.from} &rarr; ${rule.to}</span>
            <div class="actions">
            <label class="switch">
            <input type="checkbox" ${rule.active ? 'checked' : ''}>
            <span class="slider"></span>
            </label>
            <span class="delete-btn" title="Delete Rule">&times;</span>
            </div>
            `;

            // Rule Toggle
            const toggle = div.querySelector('input[type="checkbox"]');
            toggle.addEventListener('change', () => {
                rules[index].active = toggle.checked;
                saveSettings(rules);
                showReloadUI();
            });

            // Delete Rule
            const delBtn = div.querySelector('.delete-btn');
            delBtn.addEventListener('click', () => {
                rules.splice(index, 1);
                saveSettings(rules);
                renderList(rules); // Re-render to remove from DOM immediately
                showReloadUI();
            });

            listContainer.appendChild(div);
        });
    }

    async function addNewRule() {
        errorMsg.style.display = 'none';
        const fromChar = inputFrom.value.trim().toLowerCase();
        const toChar = inputTo.value.trim().toLowerCase();

        if (!fromChar.match(/^[a-z]$/) || !toChar.match(/^[a-z]$/)) {
            showError("Please enter single letters (a-z) only.");
            return;
        }

        const data = await browser.storage.local.get('rules');
        const rules = data.rules || [{ from: 'k', to: 'n', active: true }];

        if (rules.some(r => r.from === fromChar)) {
            showError(`A rule for "${fromChar}" already exists.`);
            return;
        }

        rules.push({ from: fromChar, to: toChar, active: true });
        inputFrom.value = '';
        inputTo.value = '';

        saveSettings(rules);
        renderList(rules);
        showReloadUI();
    }

    function saveSettings(rulesOverride) {
        // If rulesOverride is passed, use it, otherwise fetch current state (tricky in async)
        // Better approach: We only call this when we KNOW we have the data.
        // For the global toggle, we just update that key.

        let updateData = { globalEnabled: globalToggle.checked };

        if (rulesOverride) {
            updateData.rules = rulesOverride;
        }

        browser.storage.local.set(updateData);
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});
