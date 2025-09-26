document.addEventListener('DOMContentLoaded', () => {
    const xmlFilePath = 'https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData.xml';

    const toggleCard = (card) => {
        const content = card.querySelector('.collapsible-content');
        if (!content) return;
        if (card.classList.contains('open')) {
            card.classList.remove('open');
            content.style.maxHeight = null;
        } else {
            card.classList.add('open');
            content.style.maxHeight = content.scrollHeight + 50 + "px";
        }
    };

    const sanitizeXmlText = (text) => text.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#x?\d+;)/g, '&amp;');

    const renderProgramList = (xmlDoc) => {
        const container = document.getElementById("program-list");
        container.innerHTML = '';
        const items = xmlDoc.querySelectorAll("program > item");

        items.forEach(item => {
            const number = item.getAttribute("number");
            const performer = item.getAttribute("performer");
            const genreZh = item.querySelector('genre[xml\\:lang="zh-Hans"]')?.textContent || '';
            const genreEn = item.querySelector('genre[xml\\:lang="en"]')?.textContent || '';
            const titleZh = item.querySelector('title[xml\\:lang="zh-Hans"]')?.textContent || '';
            const titleEn = item.querySelector('title[xml\\:lang="en"]')?.textContent || '';
            const bioZh = item.querySelector('bio[xml\\:lang="zh-Hans"]')?.textContent || '';
            const bioEn = item.querySelector('bio[xml\\:lang="en"]')?.textContent || '';

            const html = `
                <div class="program-item card lazy-load">
                    <div class="program-number">${number}</div>
                    <div class="program-details">
                        <h3>${titleZh} <span class="en-sub">${titleEn}</span></h3>
                        <p class="genre">${genreZh} <span class="en-sub">${genreEn}</span></p>
                        <p class="performer">${performer}</p>
                        ${bioZh || bioEn ? `<blockquote class="bio">
                            ${bioZh ? `<p>${bioZh}</p>` : ''}
                            ${bioEn ? `<p class="en-sub"><strong>Performer Bio:</strong> ${bioEn}</p>` : ''}
                        </blockquote>` : ''}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", html);
        });
    };

    const renderCultureList = (xmlDoc) => {
        const container = document.getElementById("culture-list");
        container.innerHTML = '';
        const notes = xmlDoc.querySelectorAll("cultureNotes > note");

        notes.forEach(note => {
            const category = note.getAttribute("category") || 'Culture 101';
            const image = note.getAttribute("image") || 'https://placehold.co/600x400/f0f0f0/909090?text=Placeholder';
            const titleZh = note.querySelector('title[xml\\:lang="zh-Hans"]')?.textContent || '';
            const titleEn = note.querySelector('title[xml\\:lang="en"]')?.textContent || '';
            const descZh = note.querySelector('desc[xml\\:lang="zh-Hans"]')?.textContent || '';
            const descEn = note.querySelector('desc[xml\\:lang="en"]')?.textContent || '';
            const tagClass = category.toLowerCase().includes('hands-on') ? 'hands-on' : 'culture-101';

            const temp = document.createElement('div');
            temp.innerHTML = `
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
            const card = temp.querySelector('.card-with-image');
            card.addEventListener('click', () => toggleCard(card));
            container.appendChild(temp.firstElementChild);
        });
    };

    const initializeObservers = () => {
        const lazyLoadItems = document.querySelectorAll('.lazy-load');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });
        lazyLoadItems.forEach(item => observer.observe(item));
    };

    const fetchAndRenderContent = async () => {
        try {
            const resp = await fetch(xmlFilePath);
            if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
            const rawText = await resp.text();
            const sanitized = sanitizeXmlText(rawText);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(sanitized, "text/xml");
            if (xmlDoc.getElementsByTagName("parsererror").length) throw new Error("XML Parsing Error");

            renderProgramList(xmlDoc);
            renderCultureList(xmlDoc);
            initializeObservers();
        } catch (err) {
            console.error('Content loading failed:', err);
        }
    };

    fetchAndRenderContent();
});
