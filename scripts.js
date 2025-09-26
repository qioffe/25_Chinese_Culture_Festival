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
    }

    // --- Rendering Functions ---
    const renderProgramList = (xmlDoc) => {
        const programListContainer = document.getElementById("program-list");
        programListContainer.innerHTML = '';

        const programs = xmlDoc.querySelectorAll("program > item");
        if (!programs.length) {
            programListContainer.innerHTML = '<p style="text-align: center; color: var(--color-muted);">节目列表加载失败或为空。</p>';
            return;
        }

        programs.forEach(item => {
            const number = item.getAttribute("number");
            const performer = item.getAttribute("performer");
            const titleZh = item.querySelector("titleZh")?.textContent || '';
            const titleEn = item.querySelector("titleEn")?.textContent || '';
            const bioZh = item.querySelector("bioZh")?.textContent || '';
            const bioEn = item.querySelector("bioEn")?.textContent || '';

            const programHTML = `
                <div class="program-item card lazy-load">
                    <div class="program-number">${number}</div>
                    <div class="program-details">
                        <h3>${titleZh} <span class="en-sub">${titleEn}</span></h3>
                        <p class="performer">${performer}</p>
                        ${bioZh || bioEn ? `
                            <blockquote class="bio">
                                ${bioZh ? `<p>${bioZh}</p>` : ''}
                                ${bioEn ? `<p class="en-sub"><strong>Performer Bio:</strong> ${bioEn}</p>` : ''}
                            </blockquote>
                        ` : ''}
                    </div>
                </div>
            `;
            programListContainer.insertAdjacentHTML("beforeend", programHTML);
        });
    };

    const renderCultureList = (xmlDoc) => {
        const cultureListContainer = document.getElementById("culture-list");
        cultureListContainer.innerHTML = '';

        const notes = xmlDoc.querySelectorAll("cultureNotes > note");
        if (!notes.length) {
            cultureListContainer.innerHTML = '<li style="text-align:center;color:var(--color-muted);padding:24px;">文化注释内容加载失败或为空。</li>';
            return;
        }

        notes.forEach(note => {
            const category = note.getAttribute("category") || 'Culture 101';
            const image = note.getAttribute("image") || 'https://placehold.co/600x400/f0f0f0/909090?text=Placeholder';
            const titleZh = note.querySelector("titleZh")?.textContent || '';
            const titleEn = note.querySelector("titleEn")?.textContent || '';
            const descZh = note.querySelector("descZh")?.textContent || '';
            const descEn = note.querySelector("descEn")?.textContent || '';
            const tagClass = category.toLowerCase().includes('hands-on') ? 'hands-on' : 'culture-101';

            const noteHTML = `
                <li>
                    <div class="card-with-image lazy-load">
                        <div class="card-header">
                            <div class="card-content">
                                <h3>${titleZh} <div class="sub">${titleEn}</div></h3>
                            </div>
                            <div class="card-image">
                                <img src="${image}" alt="${titleEn}" loading="lazy">
                            </div>
                        </div>
                        <div class="collapsible-content">
                            <p>${descZh}</p>
                            <p class="sub">${descEn}</p>
                        </div>
                        <div class="tag-container">
                            <button class="tag-btn ${tagClass}">${category}</button>
                        </div>
                    </div>
                </li>
            `;
            const temp = document.createElement('div');
            temp.innerHTML = noteHTML;
            const cardElement = temp.querySelector('.card-with-image');
            cardElement.addEventListener('click', () => toggleCard(cardElement));
            cultureListContainer.appendChild(temp.firstElementChild);
        });
    };

    // --- Fetch and Init ---
    const fetchAndRenderContent = async () => {
        try {
            const response = await fetch(xmlFilePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const rawText = await response.text();
            const sanitizedText = sanitizeXmlText(rawText);

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(sanitizedText, "text/xml");
            if (xmlDoc.getElementsByTagName("parsererror").length) {
                throw new Error("XML Parsing Error");
            }

            renderProgramList(xmlDoc);
            renderCultureList(xmlDoc);
            initializeObservers();
        } catch (err) {
            console.error('Content loading failed:', err);
            document.getElementById('program-list').innerHTML = '<p style="text-align:center;color:red;">Error: Failed to load program content.</p>';
            document.getElementById('culture-list').innerHTML = '<li style="text-align:center;color:red;padding:24px;">Error: Failed to load cultural notes.</li>';
        }
    };

    // --- Observers for Lazy Load & Theme Switching ---
    const initializeObservers = () => {
        const sections = document.querySelectorAll('section[data-theme]');
        const body = document.body;

        const themeObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const theme = entry.target.getAttribute('data-theme');
                    body.classList.toggle('dark-mode', theme === 'dark');
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
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });
        lazyLoadItems.forEach(item => lazyLoadObserver.observe(item));
    };

    fetchAndRenderContent();
});
