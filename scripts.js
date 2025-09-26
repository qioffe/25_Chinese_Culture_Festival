/**
 * Dynamic Content and Interactions Script
 * Fetches content from the refined XML file and handles all UI logic.
 */
document.addEventListener('DOMContentLoaded', () => {
    const xmlFilePath = 'https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData.xml';

    // --- Rendering Functions ---

    /**
     * Reads the refined XML and renders the program list with genre tags.
     */
    const renderProgramList = (xmlDoc) => {
        const programListContainer = document.getElementById("program-list");
        if (!programListContainer) return;

        programListContainer.innerHTML = '';
        const programs = xmlDoc.querySelectorAll("program > item");

        if (!programs.length) {
            programListContainer.innerHTML = '<p style="text-align: center; color: var(--color-muted);">节目列表加载失败或为空。</p>';
            return;
        }

        programs.forEach(item => {
            const number = item.getAttribute("number");
            const performer = item.getAttribute("performer");

            // Query for elements using attributes to get correct language data.
            // Note the '\\' is required to escape the ':' in the selector.
            const genreZh = Array.from(item.querySelectorAll('genre[xml\\:lang="zh-Hans"]')).map(el => el.textContent).join(' / ');
            const genreEn = Array.from(item.querySelectorAll('genre[xml\\:lang="en"]')).map(el => el.textContent).join(' / ');
            const titleZh = item.querySelector('title[xml\\:lang="zh-Hans"]')?.textContent || '';
            const titleEn = item.querySelector('title[xml\\:lang="en"]')?.textContent || '';
            const bioZh = item.querySelector('bio[xml\\:lang="zh-Hans"]')?.textContent || '';
            const bioEn = item.querySelector('bio[xml\\:lang="en"]')?.textContent || '';
            
            // This HTML structure includes the .genre-tag span and the subtitle paragraph
            const programHTML = `
                <div class="program-item card lazy-load">
                    <span class="item-number">${number}</span>
                    <div class="item-details">
                        <h3>
                            ${genreZh ? `<span class="genre-tag">${genreZh}</span>` : ''}
                            <span class="title-zh">${titleZh}</span>
                        </h3>
                        <p class="sub en-sub">${genreEn ? `${genreEn}: ` : ''}${titleEn}</p>
                        <p class="performer">${performer}</p>
                        ${bioZh || bioEn ? `
                            <div class="bio">
                                ${bioZh ? `<p class="zh-content">${bioZh}</p>` : ''}
                                ${bioEn ? `<p class="en-sub">${bioEn}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            programListContainer.insertAdjacentHTML("beforeend", programHTML);
        });
    };

    /**
     * Reads the refined XML and renders the culture notes list.
     */
    const renderCultureList = (xmlDoc) => {
        const cultureListContainer = document.getElementById("culture-list");
        if (!cultureListContainer) return;

        cultureListContainer.innerHTML = '';
        const notes = xmlDoc.querySelectorAll("cultureNotes > note");

        if (!notes.length) {
            cultureListContainer.innerHTML = '<li style="text-align:center;color:var(--color-muted);padding:24px;">文化注释内容加载失败或为空。</li>';
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

            const noteHTML = `
                <li class="card-with-image lazy-load">
                    <div class="card-header">
                        <div class="card-content">
                            <h3>${titleZh}</h3>
                            <p class="sub en-sub">${titleEn}</p>
                        </div>
                        <div class="card-image">
                            <img src="${image}" alt="${titleEn}" loading="lazy">
                        </div>
                    </div>
                    <div class="collapsible-content">
                        <p class="zh-content">${descZh}</p>
                        <p class="en-sub">${descEn}</p>
                    </div>
                    <div class="tag-container">
                        <span class="tag-btn ${tagClass}">${category}</span>
                    </div>
                </li>
            `;
            cultureListContainer.insertAdjacentHTML("beforeend", noteHTML);
        });

        // Use event delegation for better performance
        cultureListContainer.addEventListener('click', (event) => {
            const card = event.target.closest('.card-with-image');
            if (card) {
                card.classList.toggle('open');
            }
        });
    };

    // --- Fetch and Init ---
    const fetchAndRenderContent = async () => {
        try {
            const response = await fetch(xmlFilePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length) {
                throw new Error("XML Parsing Error. Check if your XML is well-formed.");
            }

            renderProgramList(xmlDoc);
            renderCultureList(xmlDoc);
            initializeObservers();
        } catch (err) {
            console.error('Content loading failed:', err);
            document.getElementById('program-list').innerHTML = `<p style="text-align:center;color:red;">Error: ${err.message}</p>`;
            document.getElementById('culture-list').innerHTML = `<li style="text-align:center;color:red;padding:24px;">Error: ${err.message}</li>`;
        }
    };

    // --- Observers for Lazy Load & Theme Switching ---
    const initializeObservers = () => {
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

        const lazyLoadItems = document.querySelectorAll('.lazy-load');
        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        lazyLoadItems.forEach(item => lazyLoadObserver.observe(item));
    };

    fetchAndRenderContent();
});
