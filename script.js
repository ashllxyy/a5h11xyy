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

    const moveUnderline = (el) => {
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

    window.addEventListener('resize', () => {
        const active = tabsContainer.querySelector('.tab.active');
        if (active) moveUnderline(active);
    });
});


let ACTIVITIES = [];

const loadActivities = async () => {
    const res = await fetch('activities.json');
    ACTIVITIES = await res.json();

    const container = document.getElementById('activity-list');

    container.innerHTML = ACTIVITIES.map(item => {
        return `
        <div 
            class="hflex activity-item align-center primary gap-2"
            data-id="${item.id}"
        >
            <i data-lucide="${item.icon}" class="content-icon"></i>
            
            <div class="info hflex between">
                <div class="title primary">${item.title}</div>
                
                <div class="date secondary">
                    <span class="date-text">${item.date}</span>
                    <span class="hover-hint">
                        click 
                        <i data-lucide="mouse-left" class="hint-icon"></i>
                        to open
                    </span>
                </div>
            </div>
        </div>
        `;
    }).join('');

    lucide.createIcons();
    setupItemClicks();
};

loadActivities();

const setupItemClicks = () => {
    const items = document.querySelectorAll('.activity-item');

    items.forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;

            const data = ACTIVITIES.find(a => a.id === id);
            if (!data) return;

            openDynamicScene(data);
        });
    });
}

const switchScene = (currentId, nextId) => {
    if (currentId === nextId) return;

    const current = document.getElementById(currentId);
    const next = document.getElementById(nextId);

    current.classList.add('exit');

    setTimeout(() => {
        current.classList.remove('active', 'exit');

        if (nextId === 'scene-home' && currentId !== 'scene-home') {
            current.remove();
        }

        next.classList.add('active');

        next.getBoundingClientRect();

        next.classList.add('enter');

        setTimeout(() => {
            next.classList.remove('enter');
        }, 400);

    }, 400);
}

const openDynamicScene = (data) => {
    const sceneRoot = document.querySelector('.scene-root');
    const current = document.querySelector('.scene.active');
    if (!current) return;

    const sceneId = `scene-${data.id}`;
    const details = data.details || {};

    const existing = document.getElementById(sceneId);
    if (existing) existing.remove();

    const newScene = document.createElement('div');
    newScene.className = 'scene';
    newScene.id = sceneId;

    newScene.innerHTML = 
    `
        <div class="container">
            <div class="vflex">
                <i data-lucide="${data.icon}" class="icon title-icon"></i>
                <h1>${details.title} <span class="sub-heading">[${data.type}]</span></h1>
                <div class="divider"></div>
                <span class="project-read-details"><span class="bold">${data.date} </span> | ${data['read-time'] || '1 min read'}</span>
                <p class="project-content">${details.content || "Coming soon"}</p>
                <div class="divider"></div>
                <div class="hflex back-btn">
                    <i data-lucide="arrow-left" class="back-btn-icon"></i>
                    <span>
                        go home 
                    </span>
                </div>
            </div>
        </div>
    `;

    sceneRoot.appendChild(newScene);

    newScene.querySelector('.back-btn').addEventListener('click', () => {
        switchScene(sceneId, 'scene-home');
    });
    lucide.createIcons();
    switchScene(current.id, sceneId);
}