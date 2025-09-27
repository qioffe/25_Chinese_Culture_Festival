document.addEventListener("DOMContentLoaded", async () => {
  // IMPORTANT: Replace this URL with the actual URL where your XML file is hosted.
  const xmlFilePath =
    "https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData.xml";

  const PEXELS_API_KEY =
    "LjiShVOHSXZFRrA3mzFWhQPemd0kEdL7IQsyjV2nR2z27uqWIM9mfS5S";

  // --- Pexels Image Fetcher ---
  const getPexelsImage = async (query) => {
    const fallbackUrl = `https://placehold.co/600x400/2a2a2a/eab308?text=${encodeURIComponent(
      query
    )}`;
    if (!query) return fallbackUrl;

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query
        )}&per_page=1`,
        {
          headers: {
            Authorization: PEXELS_API_KEY
          }
        }
      );

      if (!response.ok) {
        console.error(
          `Pexels API error for "${query}": ${response.statusText}`
        );
        return fallbackUrl;
      }

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.large; // Using 'large' image size
      } else {
        console.warn(`No Pexels image found for query: "${query}"`);
        return fallbackUrl;
      }
    } catch (error) {
      console.error(`Error fetching Pexels image for "${query}":`, error);
      return fallbackUrl;
    }
  };

  // --- Data Fetching & Rendering ---
  const fetchXML = async () => {
    const res = await fetch(xmlFilePath, {
      cache: "no-store"
    });
    if (!res.ok)
      throw new Error(`Network response was not ok: ${res.statusText}`);
    const text = await res.text();
    const parsedXML = new DOMParser().parseFromString(text, "text/xml");
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
      const html = `
        <div class="program-item card lazy-load">
            <span class="item-number">${number}</span>
            <div class="item-details">
                <h3>${
                  genreZh ? `<span class="genre-tag">${genreZh}</span>` : ""
                } <span class="title-zh">${titleZh}</span></h3>
                <p class="sub en-sub">${
                  genreEn ? genreEn + ": " : ""
                }${titleEn}</p>
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

  const renderCulture = async (xmlDoc) => {
    const container = document.getElementById("culture-list");
    if (!container) return;
    container.innerHTML = "";
    let notes = Array.from(xmlDoc.getElementsByTagName("note"));

    for (let i = notes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [notes[i], notes[j]] = [notes[j], notes[i]];
    }

    // REFINED LOGIC: Prioritize image from XML, otherwise fetch from Pexels.
    const imagePromises = notes.map((note) => {
      const imageAttr = note.getAttribute("image");
      if (imageAttr) {
        return Promise.resolve(imageAttr); // Use the image URL from the XML file
      } else {
        const titleEn = getLangText(note, "title", "en");
        return getPexelsImage(titleEn); // Fallback to Pexels if no image is specified
      }
    });
    const imageUrls = await Promise.all(imagePromises);

    notes.forEach((note, index) => {
      const category = note.getAttribute("category") || "";
      const titleEn = getLangText(note, "title", "en");
      const image = imageUrls[index];
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
                <div class="card-image"><img src="${image}" alt="${titleEn}" loading="lazy"></div>
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
      cultureContainer.addEventListener("click", (e) => {
        const card = e.target.closest(".card-with-image");
        if (card) card.classList.toggle("open");
      });
    }
    const sections = document.querySelectorAll("main > section[data-theme]");
    const themeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const theme = entry.target.getAttribute("data-theme");
            document.body.classList.toggle("dark-mode", theme === "dark");
          }
        });
      },
      {
        threshold: 0.15
      }
    );
    if (sections.length > 0) sections.forEach((s) => themeObserver.observe(s));

    const lazyItems = document.querySelectorAll(".lazy-load");
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
    if (lazyItems.length > 0)
      lazyItems.forEach((item) => lazyObserver.observe(item));
  };

  // --- Main Execution ---
  try {
    const xml = await fetchXML();
    renderProgram(xml);
    await renderCulture(xml);
    initializeUIInteractions();
  } catch (err) {
    console.error("Error loading or rendering XML:", err);
    const programList = document.getElementById("program-list");
    const cultureList = document.getElementById("culture-list");
    if (programList)
      programList.innerHTML = `<p style="text-align:center; color:red;">Error: Could not load content. ${err.message}</p>`;
    if (cultureList)
      cultureList.innerHTML = `<li style="text-align:center; color:red;">Error: Could not load content. ${err.message}</li>`;
  }
});
