let totalFixedCount = 0;

function fixImages(rules) {
    const container = document.querySelector('div[name="image-items"]');
    if (!container) return;

    const images = container.querySelectorAll('img');
    let hasNewFixes = false;

    images.forEach(img => {
        let currentSrc = img.src;
        let newSrc = currentSrc;

        // Loop through all ACTIVE rules
        rules.forEach(rule => {
            if (!rule.active) return;

            // DYNAMIC REGEX GENERATION
            // Example: https://k(\d+).(mb\w+.org)
            const pattern = new RegExp(`https:\/\/${rule.from}(\\d+)\\.(mb\\w+\\.org)`);

            if (pattern.test(newSrc)) {
                newSrc = newSrc.replace(pattern, `https://${rule.to}$1.$2`);
            }
        });

        // Apply change if URL is different
        if (currentSrc !== newSrc) {
            img.src = newSrc;
            totalFixedCount++;
            hasNewFixes = true;
            // console.log(`[Bato Fixer] Fixed: ${currentSrc} -> ${newSrc}`);
        }
    });

    if (hasNewFixes) {
        browser.runtime.sendMessage({ type: "updateBadge", count: totalFixedCount });
    }
}

// --- INITIALIZATION (UPDATED) ---
// We now fetch BOTH 'rules' and 'globalEnabled'
browser.storage.local.get(["rules", "globalEnabled"]).then((data) => {

    // 1. Check Global Switch First
    // If undefined (first run), we treat it as TRUE
    const isGlobalEnabled = data.globalEnabled !== false;

    if (!isGlobalEnabled) {
        // If disabled, we STOP here.
        // We do not run fixImages() and we do not start the Observer.
        // console.log("[Bato Fixer] Extension is globally DISABLED.");
        return;
    }

    // 2. Get rules (Default to k->n if first run)
    const rules = data.rules || [{ from: 'k', to: 'n', active: true }];

    // 3. Run immediately
    fixImages(rules);

    // 4. Start Observer
    const observer = new MutationObserver(() => fixImages(rules));
    observer.observe(document.body, { childList: true, subtree: true });
});
