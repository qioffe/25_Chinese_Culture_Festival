/**
 * Dynamic Content and Interactions Script
 * Fetches content from an external XML file and handles UI logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    const xmlFilePath = 'https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData.xml';

    // --- Utility Functions ---

    const toggleCard = (card) => {
        const isOpen = card.classList.contains('open');
        const content = card.querySelector('.collapsible-content');

        if (content) {
            if (isOpen) {
                card.classList.remove('open');
                content.style.maxHeight = null;
            } else {
                card.classList.add('open');
                content.style.maxHeight = content.scrollHeight + 50 + "px";
            }
        }
    };

    const sanitizeXmlText = (text) => {
        return text.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#x?\d+;)/g, '&amp;');
    };

    // --- Rendering Functions ---

    const renderProgramList = (xmlDoc) => {
        const programListContainer = document.getElementById("program-list");
        programListContainer.innerHTML = '';

        const items = xmlDoc.querySelectorAll("program > item");

        if (items.length === 0) {
            programListContainer.innerHTML = '<p style="text-align:center;color:var(--color-muted);">节目列表为空或加载失败。</p>';
            return;
        }

        items.forEach(item => {
            const number = item.getAttribute("number") || '';
            const performer = item.getAttribute("performer") || '';
            const genreZh = item.querySelector('genre[xml\\:lang="zh-Hans"]')?.textContent || '';
            const genreEn = item.querySelector('genre[xml\\:lang="en"]')?.textContent || '';
            const titleZh = item.querySelector('title[xml\\:lang="zh-Hans"]')?.textContent || '';
            const titleEn = item.querySelector('title[xml\\:lang="en"]')?.textContent || '';
            const bioZh = item.querySelector('bio[xml\\:lang="zh-Hans"]')?.textContent || '';
            const bioEn = item.querySelector('bio[xml\\:lang="en"]')?.textContent || '';

            const bioHtml = (bioZh || bioEn) ? `
                <blockquote class="bio">
                    ${bioZh ? `<p class="zh-content">${bioZh}</p>` : ''}
                    ${bioEn ? `<p class="en-sub"><strong>Performer Bio:</strong> ${bioEn}</p>` : ''}
                </blockquote>
            ` : '';

            const article = document.createElement('article');
            article.className = 'program-item card lazy-load';
            article.innerHTML = `
                <div class="item-number">${number}</div>
                <div class="item-details">
                    <h3 class="zh-content">${titleZh} <div class="sub">${titleEn}</div></h3>
                    ${genreZh && genreEn ? `<p class="genre">${genreZh} <span class="en-sub">${genreEn}</span></p>` : ''}
                    <p class="performer">${performer}</p>
                    ${bioHtml}
                </div>
            `;

            programListContainer.appendChild(article);
        });
    };

    const renderCultureList = (xmlDoc) => {
        const listContainer = document.getElementById('culture-list');
        listContainer.innerHTML = '';

        const notes = xmlDoc.querySelectorAll('cultureNotes > note');

        if (notes.length === 0) {
            listContainer.innerHTML = '<li style="text-align:center;width:100%;color:var(--color-muted);padding:24px;">文化注释内容为空或加载失败。</li>';
            return;
        }

        notes.forEach(note => {
            const category = note.getAttribute('category') || 'Culture 101';
            const tagClass = category.toLowerCase().includes('hands-on') ? 'hands-on' : 'culture-101';
            const image = note.getAttribute('image') || 'https://placehold.co/600x400/f0f0f0/909090?text=Placeholder';
            const titleZh = note.querySelector('title[xml\\:lang="zh-Hans"]')?.textContent || '';
            const titleEn = note.querySelector('title[xml\\:lang="en"]')?.textContent || '';
            const descZh = note.querySelector('desc[xml\\:lang="zh-Hans"]')?.textContent || '';
            const descEn = note.querySelector('desc[xml\\:lang="en"]')?.textContent || '';

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="card-with-image lazy-load">
                    <div class="card-header">
                        <div class="card-content">
                            <h3 class="zh-content">${titleZh}<div class="sub">${titleEn}</div></h3>
                        </div>
                        <div class="card-image">
                            <img src="${image}" alt="${titleEn}" loading="lazy">
                        </div>
                    </div>
                    <div class="collapsible-content">
                        <div>
                            <p class="zh-content">${descZh}</p>
                            <p class="sub">${descEn}</p>
                        </div>
                    </div>
                    <div class="tag-container">
                        <button class="tag-btn ${tagClass}">${category}</button>
                    </div>
                </div>
            `;

            const card = listItem.querySelector('.card-with-image');
            card.addEventListener('click', () => toggleCard(card));

            listContainer.appendChild(listItem);
        });
    };

    // --- Fetch XML and Initialize ---
    const fetchAndRenderContent = async () => {
        try {
            const response = await fetch(xmlFilePath);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const rawText = await response.text();
            const sanitizedText = sanitizeXmlText(rawText);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(sanitizedText, "text/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("XML Parsing Error: check the remote file structure.");
            }

            renderProgramList(xmlDoc);
            renderCultureList(xmlDoc);
            initializeObservers();

        } catch (error) {
            console.error('Content loading failed:', error);
            document.getElementById('program-list').innerHTML = '<p style="text-align:center;color:red;">节目加载失败</p>';
            document.getElementById('culture-list').innerHTML = '<li style="text-align:center;color:red;padding:24px;">文化注释加载失败</li>';
        }
    };

    // --- Intersection Observers for lazy load & theme switching ---
    const initializeObservers = () => {
        const sections = document.querySelectorAll('section[data-theme]');
        const body = document.body;

        const themeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const theme = entry.target.getAttribute('data-theme');
                    if (theme === 'dark') body.classList.add('dark-mode');
                    else body.classList.remove('dark-mode');
                }
            });
        }, { threshold: 0.15 });

        sections.forEach(section => themeObserver.observe(section));

        const lazyItems = document.querySelectorAll('.lazy-load');
        const lazyObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

        lazyItems.forEach(item => lazyObserver.observe(item));
    };

    fetchAndRenderContent();
});
