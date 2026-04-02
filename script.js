lucide.createIcons();

const myAtropos = Atropos({
    el: '.my-atropos',
    activeOffset: 40,
    shadowScale: 0,
    rotateXMax: 7,
    rotateYMax: 7,
});

const allTabGroups = document.querySelectorAll('.tabs');

allTabGroups.forEach(tabsContainer => {
    const tabs = tabsContainer.querySelectorAll('.tab');
    const underline = tabsContainer.querySelector('.underline');

    function moveUnderline(el) {
        const rect = el.getBoundingClientRect();
        const parentRect = tabsContainer.getBoundingClientRect();

        const padding = 8;

        underline.style.width = rect.width + padding + 'px';
        underline.style.left =
            rect.left - parentRect.left - padding / 2 + 'px';
    }

    const activeTab = tabsContainer.querySelector('.tab.active');
    if (activeTab) moveUnderline(activeTab);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabsContainer.querySelector('.tab.active')?.classList.remove('active');
            tab.classList.add('active');
            moveUnderline(tab);
        });
    });

    // fix on resize
    window.addEventListener('resize', () => {
        const active = tabsContainer.querySelector('.tab.active');
        if (active) moveUnderline(active);
    });
});