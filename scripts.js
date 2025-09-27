document.addEventListener("DOMContentLoaded", async () => {
    const xmlFilePath =
        "https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData.xml";

    // --- Data Fetching & Rendering ---
    const fetchXML = async () => {
        const res = await fetch(xmlFilePath, {
            cache: "no-store"
        });
        if (!res.ok)
            throw new Error(`Network response was not ok: ${res.statusText}`);
        const text = await res.text();
        const parsedXML = new DOMParser().parseFromString(text, "text/xml");
        // Check for XML parsing errors
        if (parsedXML.getElementsByTagName("parsererror").length)
            throw new Error("XML Parsing Error");
        return parsedXML;
    };

    const getLangText = (parent, tagName, lang) => {
        const elements = parent.getElementsByTagName(tagName);
        for (let el of elements) {
            if (el.getAttribute("xml:lang") === lang) return el.textContent || "";
        }
        return "";
    };

    const renderProgram = (xmlDoc) => {
        const container = document.getElementById("program-list");
        if (!container) return;
        container.innerHTML = "";
        const items = xmlDoc.getElementsByTagName("item");
        for (let item of items) {
            const number = item.getAttribute("number");
            const performer = item.getAttribute("performer");
            const genreZh = getLangText(item, "genre", "zh-Hans");
            const genreEn = getLangText(item, "genre", "en");
            const titleZh = getLangText(item, "title", "zh-Hans");
            const titleEn = getLangText(item, "title", "en");
            const bioZh = getLangText(item, "bio", "zh-Hans");
            const bioEn = getLangText(item, "bio", "en");
            
            const subtitleEn = `${genreEn ? genreEn + ": " : ""}${titleEn}`;
            
            const html = `
                <div class="program-item card lazy-load">
                    <span class="item-number">${number}</span>
                    <div class="item-details">
                        <h3>${
                            genreZh ? `<span class="genre-tag">${genreZh}</span>` : ""
                        } <span class="title-zh">${titleZh}</span></h3>
                        <p class="sub en-sub">${subtitleEn}</p>
                        <p class="performer">${performer}</p>
                        ${
                            bioZh || bioEn
                                ? `<div class="bio">${
                                      bioZh ? `<p class="zh-content">${bioZh}</p>` : ""
                                  }${bioEn ? `<p class="en-sub">${bioEn}</p>` : ""}</div>`
                                : ""
                        }
                    </div>
                </div>`;
            container.insertAdjacentHTML("beforeend", html);
        }
    };

    const renderCulture = (xmlDoc) => {
        const container = document.getElementById("culture-list");
        if (!container) return;
        container.innerHTML = "";
        let notes = Array.from(xmlDoc.getElementsByTagName("note"));

        // Shuffle logic (Fisher-Yates) - kept for randomization
        for (let i = notes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [notes[i], notes[j]] = [notes[j], notes[i]];
        }

        notes.forEach((note) => {
            const category = note.getAttribute("category") || "";
            const titleEn = getLangText(note, "title", "en");
            
            // MODIFIED: Directly use the image attribute from XML, no API fetching.
            const image = note.getAttribute("image") || 'https://placehold.co/600x400/cccccc/2a2a2a?text=Image+Missing';
            
            const titleZh = getLangText(note, "title", "zh-Hans");
            const descZh = getLangText(note, "desc", "zh-Hans");
            const descEn = getLangText(note, "desc", "en");
            const html = `
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
                    <div class="tag-container"><span class="tag-btn ${
                        category.toLowerCase().includes("hands-on")
                            ? "hands-on"
                            : "culture-101"
                    }">${category}</span></div>
                </li>`;
            container.insertAdjacentHTML("beforeend", html);
        });
    };

    // --- UI/UX Interactions ---
    const initializeUIInteractions = () => {
        const cultureContainer = document.getElementById("culture-list");
        if (cultureContainer) {
            // Card click toggle logic
            cultureContainer.addEventListener("click", (e) => {
                const card = e.target.closest(".card-with-image");
                if (card) card.classList.toggle("open");
            });
        }
        
        // --- THEME SWITCH FIX: Stable Intersection Observer using rootMargin ---
        const sections = document.querySelectorAll("main > section[data-theme]");

        const observerOptions = {
            root: null, // The viewport
            // Shrinks the effective viewport to the central 40%, forcing stable theme switching
            rootMargin: '-30% 0px -30% 0px', 
            threshold: 0.01 // Fire as soon as the element crosses the shrunk boundary
        };

        const themeObserver = new IntersectionObserver((entries) => {
            let activeTheme = null;
            
            // Find the element currently occupying the central target zone.
            for (let entry of entries) {
                if (entry.isIntersecting) {
                    activeTheme = entry.target.getAttribute("data-theme");
                    break; // Use the first section found in the target zone
                }
            }

            // Apply the determined theme only if a section is dominating
            if (activeTheme) {
                // Toggle the 'dark-mode' class based on the active theme
                document.body.classList.toggle("dark-mode", activeTheme === "dark");
            }
        }, observerOptions);

        if (sections.length > 0) {
            sections.forEach((s) => themeObserver.observe(s));
        }

        // Lazy load interaction (kept same)
        const lazyObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1
            }
        );
        document.querySelectorAll(".lazy-load").forEach((item) => lazyObserver.observe(item));
    };

    // --- Main Execution ---
    try {
        const xml = await fetchXML();
        renderProgram(xml);
        // Note: No 'await' needed for renderCulture since there are no more async image calls
        renderCulture(xml); 
        initializeUIInteractions();
    } catch (err) {
        console.error("Error loading or rendering XML:", err);
        const errorHtml = `<p style="text-align:center; color:red;">Error: Could not load content. ${err.message}</p>`;
        const programList = document.getElementById("program-list");
        const cultureList = document.getElementById("culture-list");
        if (programList) programList.innerHTML = errorHtml;
        if (cultureList) cultureList.innerHTML = errorHtml;
    }
});
