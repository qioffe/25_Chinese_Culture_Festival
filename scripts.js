/**
 * Dynamic Content and Interactions Script
 * Handles fetching XML content and all UI/UX interactions:
 * lazy-loading, collapsibles, theme switching, highlights.
 */
document.addEventListener('DOMContentLoaded', () => {
    const xmlFilePath = 'https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData.xml';

    const renderProgramList = (xmlDoc) => {
        const container = document.getElementById("program-list");
        if (!container) return;
        container.innerHTML = '';

        const programs = xmlDoc.querySelectorAll("program > item");
        if (!programs.length) {
            container.innerHTML = '<p style="text-align:center;color:var(--color-muted);">节目列表加载失败或为空。</p>';
            return;
        }

        programs.forEach(item => {
            const number = item.getAttribute("number");
            const performer = item.getAttribute("performer");
            const genreZh = Array.from(item.querySelectorAll('genre[xml\\:lang="zh-Hans"]')).map(e => e.textContent).join(' / ');
            const genreEn = Array.from(item.querySelectorAll('genre[xml\\:lang="en"]')).map(e => e.textContent).join(' / ');
            const titleZh = item.querySelector('title[xml\\:lang="zh-Hans"]')?.textContent || '';
            const titleEn = item.querySelector('title[xml\\:lang="en"]')?.textContent || '';
            const bioZh = item.querySelector('bio[xml\\:lang="zh-Hans"]')?.textContent || '';
            const bioEn = item.querySelector('bio[xml\\:lang="en"]')?.textContent || '';

            const html = `
                <div class="program-item card lazy-load">
                    <span class="item-number">${number}</span>
                    <div class="item-details">
                        <h3>${genreZh ? `<span class="genre-tag">${genreZh}</span>` : ''} <span class="title-zh">${titleZh}</span></h3>
                        <p class="sub en-sub">${genreEn ? `${genreEn}: ` : ''}${titleEn}</p>
                        <p class="performer">${performer}</p>
                        ${(bioZh || bioEn) ? `<div class="bio">${bioZh ? `<p class="zh-content">${bioZh}</p>` : ''}${bioEn ? `<p class="en-sub">${bioEn}</p>` : ''}</div>` : ''}
                    </div>
                </div>`;
            container.insertAdjacentHTML("beforeend", html);
        });
    };

    const renderCultureList = (xmlDoc) => {
        const container = document.getElementById("culture-list");
        if (!container) return;
        container.innerHTML = '';

        const notes = xmlDoc.querySelectorAll("cultureNotes > note");
        if (!notes.length) {
            container.innerHTML = '<li style="text-align:center;color:var(--color-muted);padding:24px;">文化注释内容加载失败或为空。</li>';
            return;
        }

        notes.forEach(note => {
            const category = note.getAttribute("category") || 'Culture 101';
            const image = note.getAttribute("image") || 'https://placehold.co/600x400';
            const titleZh = note.querySelector('title[xml\\:lang="zh-Hans"]')?.textContent || '';
            const titleEn = note.querySelector('title[xml\\:lang="en"]')?.textContent || '';
            const descZh = note.querySelector('desc[xml\\:lang="zh-Hans"]')?.textContent || '';
            const descEn = note.querySelector('desc[xml\\:lang="en"]')?.textContent || '';
            const tagClass = category.toLowerCase().includes('hands-on') ? 'hands-on' : 'culture-101';

            const html = `
                <li class="card-with-image lazy-load">
                    <div class="card-header">
                        <div class="card-content">
                            <h3>${titleZh}</h3>
                            <p class="sub en-sub">${titleEn}</p>
                        </div>
                        <div class="card-image"><img src="${image}" alt="${titleEn}" loading="lazy"></div>
                    </div>
                    <div class="collapsible-content">
                        <p class="zh-content">${descZh}</p>
                        <p class="en-sub">${descEn}</p>
                    </div>
                    <div class="tag-container"><span class="tag-btn ${tagClass}">${category}</span></div>
                </li>`;
            container.insertAdjacentHTML("beforeend", html);
        });

        // Collapsible toggle
        container.addEventListener('click', e => {
            const card = e.target.closest('.card-with-image');
            if (card) card.classList.toggle('open');
        });
    };

    const initializeObservers = () => {
        // Theme switcher
        const sections = document.querySelectorAll('section[data-theme]');
        const themeObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const theme = entry.target.getAttribute('data-theme');
                    document.body.classList.toggle('dark-mode', theme === 'dark');
                }
            });
        }, { threshold: 0.15 });
        sections.forEach(s => themeObserver.observe(s));

        // Lazy loading
        const lazyItems = document.querySelectorAll('.lazy-load');
        const lazyObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        lazyItems.forEach(item => lazyObserver.observe(item));
    };

    const fetchAndRender = async () => {
        try {
            const res = await fetch(xmlFilePath, {cache: "no-store"});
            if (!res.ok) throw new Error(`Network error: ${res.statusText}`);
            const xmlText = await res.text();
            const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");
            if (xmlDoc.getElementsByTagName("parsererror").length) throw new Error("XML Parsing Error");

            renderProgramList(xmlDoc);
            renderCultureList(xmlDoc);
            initializeObservers();
        } catch (err) {
            console.error(err);
        }
    };

    fetchAndRender();
});
