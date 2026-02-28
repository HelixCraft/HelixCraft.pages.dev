// Language colors
const LANG_COLORS = {
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Python: "#3572A5",
  TypeScript: "#2b7489",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

// Featured projects
const FEATURED_REPOS = ["Bedrock-Formation-Locator", "Lucid-addon", "Slidium"];

// Global state
let allRepos = [];
let currentSort = { column: "stars", direction: "desc" };

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-mode") ? "light" : "dark",
  );
}

// Load theme
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  } else if (savedTheme === "dark") {
    document.body.classList.remove("light-mode");
  } else {
    // No saved preference, use system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      document.body.classList.add("light-mode");
    }
  }
}

// Time ago helper
function timeAgo(date) {
  const diffDays = Math.floor(
    (new Date() - new Date(date)) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  if (diffDays < 365)
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
}

// Copy donation address
function copyAddr(id, btn) {
  const text = document.getElementById(id).textContent.trim();
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.textContent = "✓ Copied";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = btn.dataset.original || "Copy address";
        btn.classList.remove("copied");
      }, 2000);
    })
    .catch(() => alert(text));
}

// Fetch GitHub repos
async function fetchGitHubRepos() {
  try {
    const response = await fetch(
      "https://api.github.com/users/HelixCraft/repos?per_page=100&sort=updated",
    );
    if (!response.ok) throw new Error("GitHub API error");
    return (await response.json()).filter(
      (repo) => !repo.fork && !repo.private,
    );
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return null;
  }
}

// Fetch GitHub stats
async function fetchGitHubStats() {
  try {
    const [userRes, eventsRes] = await Promise.all([
      fetch("https://api.github.com/users/HelixCraft"),
      fetch(
        "https://api.github.com/users/HelixCraft/events/public?per_page=100",
      ),
    ]);
    const user = await userRes.json();
    const events = await eventsRes.json();

    // Count contributions in last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const contributions = events.filter(
      (e) => new Date(e.created_at) > oneYearAgo,
    ).length;

    return { repos: user.public_repos, contributions };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return null;
  }
}

// Render featured projects
function renderFeaturedProjects(repos) {
  const container = document.getElementById("featuredProjects");
  if (!container) return;

  const featured = repos.filter((repo) => FEATURED_REPOS.includes(repo.name));
  if (featured.length === 0) {
    container.innerHTML =
      '<p style="color: var(--text3); font-size: 12px;">Loading...</p>';
    return;
  }

  container.innerHTML = featured
    .map((repo) => {
      const color = LANG_COLORS[repo.language] || "#445244";
      const topics = repo.topics || [];
      return `
      <a class="featured-card" href="${repo.html_url}" target="_blank">
        <div class="featured-header">
          <div class="featured-name">${repo.name}</div>
          <div class="featured-stars">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/>
            </svg>
            ${repo.stargazers_count}
          </div>
        </div>
        <div class="featured-desc">${repo.description || "No description available"}</div>
        <div class="featured-meta">
          ${repo.language ? `<div class="featured-lang"><div class="lang-dot" style="background:${color}"></div>${repo.language}</div>` : ""}
          <div class="featured-updated">Updated ${timeAgo(repo.updated_at)}</div>
        </div>
        ${
          topics.length > 0
            ? `<div class="featured-tags">${topics
                .slice(0, 5)
                .map((tag) => `<span class="featured-tag">${tag}</span>`)
                .join("")}</div>`
            : ""
        }
      </a>
    `;
    })
    .join("");
}

// Sort repos
function sortRepos(column) {
  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === "desc" ? "asc" : "desc";
  } else {
    currentSort.column = column;
    currentSort.direction = "desc";
  }

  allRepos.sort((a, b) => {
    let valA, valB;
    if (column === "stars") {
      valA = a.stargazers_count;
      valB = b.stargazers_count;
    } else if (column === "updated") {
      valA = new Date(a.updated_at).getTime();
      valB = new Date(b.updated_at).getTime();
    }
    return currentSort.direction === "desc" ? valB - valA : valA - valB;
  });

  renderReposTable(allRepos);
  updateSortIndicators();
}

// Update sort indicators
function updateSortIndicators() {
  document.querySelectorAll(".repo-table th.sortable").forEach((th) => {
    th.classList.remove("active", "desc");
  });
  const activeCol = document.querySelector(`.col-${currentSort.column}`);
  if (activeCol) {
    activeCol.classList.add("active");
    if (currentSort.direction === "desc") activeCol.classList.add("desc");
  }
}

// Render repos table
function renderReposTable(repos) {
  const tbody = document.getElementById("repoTableBody");
  if (!tbody) return;

  tbody.innerHTML = repos
    .map((repo) => {
      const color = LANG_COLORS[repo.language] || "#445244";
      return `
      <tr>
        <td>
          <a href="${repo.html_url}" target="_blank">
            <div class="repo-name-cell">
              <div class="repo-icon">📁</div>
              <div class="repo-name-info">
                <div class="repo-name">${repo.name}</div>
                ${repo.description ? `<div class="repo-desc">${repo.description}</div>` : ""}
              </div>
            </div>
          </a>
        </td>
        <td class="repo-lang-cell">
          ${repo.language ? `<div class="repo-lang-content"><div class="lang-dot" style="background:${color}"></div>${repo.language}</div>` : ""}
        </td>
        <td class="repo-stars-cell">
          <div class="repo-stars-content">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/>
            </svg>
            ${repo.stargazers_count}
          </div>
        </td>
        <td class="repo-updated-cell">${timeAgo(repo.updated_at)}</td>
      </tr>
    `;
    })
    .join("");
}

// Render stats
function renderStats(stats) {
  if (!stats) return;
  const totalStars = allRepos.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0,
  );
  document.getElementById("stat-commits").textContent =
    stats.contributions || "—";
  document.getElementById("stat-repos").textContent = stats.repos || "—";
  document.getElementById("stat-stars").textContent = totalStars || "—";
}

// Page templates
const pages = {
  home: () => `
    <div class="wrap">
      <div class="hero">
        <img class="hero-avatar" src="https://cdn.modrinth.com/user/d1i0RLDm/f4748ef6959f14f70cfe7f35867ebbea6c62a7ee_96.webp" alt="HelixCraft" onerror="this.src='https://github.com/HelixCraft.png'">
        <div>
          <div class="hero-name">HelixCraft</div>
          <div class="hero-bio">Open source hobbyist developer from Germany. I build tools I find useful and share them so others can benefit too. Mostly working with Java, Python, and Bash on Linux.</div>
          <div class="hero-stats">
            <div class="hero-stat"><strong>4</strong> Modrinth projects</div>
            <div class="hero-stat"><strong>1.52K</strong> downloads</div>
            <div class="hero-stat"><strong>17</strong> GitHub repos</div>
            <div class="hero-stat">Joined 6 months ago</div>
          </div>
          <div class="hero-links">
            <a class="btn btn-ghost" href="https://github.com/HelixCraft" target="_blank">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
            <a class="btn btn-ghost" href="https://modrinth.com/user/HelixCraft" target="_blank">
              <svg width="13" height="13" viewBox="0 0 512 514" fill="currentColor"><path d="M503.6 241.5c-7.5 29.1-18.8 56.9-33.3 82.6-45.7 79.3-130.8 131.1-224.3 131.1-82.5 0-159.1-39.3-208.8-104.2L0 369.6V271.4h98.3l.1 54.4c40.6 51.7 102.7 83.3 166.7 83.3 73.7 0 141-38.7 179.4-100.5 11.7-19.3 20.3-40.2 25.6-62.1l33.5 47.4zm8.4-115.7V224H413.7l-.1-54.4c-40.6-51.7-102.7-83.3-166.7-83.3-73.7 0-141 38.7-179.4 100.5-11.7 19.3-20.3 40.2-25.6 62.1L8.4 201.5C15.9 172.4 27.2 144.6 41.7 119c45.7-79.3 130.8-131.1 224.3-131.1 82.5 0 159.1 39.3 208.8 104.2L512 73.9l-.1 51.9z"/></svg>
              Modrinth
            </a>
            <a class="btn btn-ghost" href="https://discordapp.com/users/1292854102174470250" target="_blank">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.104.133 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Discord
            </a>
          </div>
        </div>
      </div>
      <div class="projects-grid">
        <div class="projects-left">
          <div class="section-label">Featured Projects</div>
          <div class="featured-projects" id="featuredProjects"></div>
        </div>
        <div class="projects-right">
          <div class="section-label">Modrinth Mods</div>
          <div class="mod-cards-wrap">
            <a class="mod-card" href="https://modrinth.com/mod/gBJA7Z3y" target="_blank">
              <img class="mod-icon" src="https://cdn.modrinth.com/data/gBJA7Z3y/22168fb5702d54e4dae1aaa80a64b7e8f6316e15_96.webp" alt="AFK Utilitys">
              <div class="mod-body">
                <div class="mod-header"><span class="mod-name">AFK Utilitys</span></div>
                <div class="mod-desc">Advanced AFK management mod for Minecraft Fabric with anti-kick protection, auto-reconnect, safety disconnect, and hunger management.</div>
                <div class="mod-tags"><span class="mod-tag">Client</span><span class="mod-tag">Management</span><span class="mod-tag">Fabric</span></div>
              </div>
              <div class="mod-meta"><div class="mod-stat">↓ 807</div><div class="mod-stat">♥ 5</div></div>
            </a>
            <a class="mod-card" href="https://modrinth.com/mod/UTBKI2t1" target="_blank">
              <img class="mod-icon" src="https://cdn.modrinth.com/data/UTBKI2t1/1093fd14527f4527e400f2f4642d5a462a2a375a_96.webp" alt="Fabric Packet Logger">
              <div class="mod-body">
                <div class="mod-header"><span class="mod-name">Fabric Packet Logger</span></div>
                <div class="mod-desc">Deep packet logging mod for Minecraft Fabric — captures all network traffic with full NBT/Component data.</div>
                <div class="mod-tags"><span class="mod-tag">Client</span><span class="mod-tag">Technology</span><span class="mod-tag">Fabric</span></div>
              </div>
              <div class="mod-meta"><div class="mod-stat">↓ 548</div><div class="mod-stat">♥ 4</div></div>
            </a>
            <a class="mod-card" href="https://modrinth.com/mod/mEPBTWnK" target="_blank">
              <img class="mod-icon" src="https://cdn.modrinth.com/data/mEPBTWnK/a6f8dd2a319f57d2f5ce149821b7393b58fef854_96.webp" alt="Container Data Dumper">
              <div class="mod-body">
                <div class="mod-header"><span class="mod-name">Container Data Dumper</span></div>
                <div class="mod-desc">Copy container inventory data as Data Components directly to your clipboard — works with any container block or entity in Minecraft 1.20–1.21+.</div>
                <div class="mod-tags"><span class="mod-tag">Client</span><span class="mod-tag">Fabric</span></div>
              </div>
              <div class="mod-meta"><div class="mod-stat">↓ 98</div><div class="mod-stat">♥ 2</div></div>
            </a>
            <a class="mod-card" href="https://modrinth.com/mod/l5dv9Uyi" target="_blank">
              <img class="mod-icon" src="https://cdn.modrinth.com/data/l5dv9Uyi/cbe9e6e989f39525ca8f34a1da9ddc17d943bb02_96.webp" alt="Slot Click Macros">
              <div class="mod-body">
                <div class="mod-header"><span class="mod-name">Slot Click Macros</span></div>
                <div class="mod-desc">Records and replays inventory click sequences to automate repetitive container interactions.</div>
                <div class="mod-tags"><span class="mod-tag">Client</span><span class="mod-tag">Fabric</span></div>
              </div>
              <div class="mod-meta"><div class="mod-stat">↓ 71</div><div class="mod-stat">♥ 3</div></div>
            </a>
          </div>
        </div>
      </div>
      <div class="section-label" style="margin-top:44px">All Public Repositories</div>
      <div class="repo-table-wrap">
        <table class="repo-table">
          <thead>
            <tr>
              <th class="col-name">Repository</th>
              <th class="col-lang">Language</th>
              <th class="col-stars sortable active" onclick="sortRepos('stars')">Stars <svg class="sort-icon" width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3l4 5H4z"/></svg></th>
              <th class="col-updated sortable" onclick="sortRepos('updated')">Updated <svg class="sort-icon" width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3l4 5H4z"/></svg></th>
            </tr>
          </thead>
          <tbody id="repoTableBody"></tbody>
        </table>
      </div>
    </div>
  `,

  activity: () => `
    <div class="wrap">
      <div class="section-label">Contributions — Last 12 months</div>
      <div class="contrib-box" style="margin-bottom:36px">
        <div class="contrib-inner">
          <img src="https://ghchart.rshah.org/3d7a45/HelixCraft" alt="GitHub Contributions" onerror="this.style.display='none';document.getElementById('cf').style.display='block'">
          <div class="contrib-fallback" id="cf" style="display:none">Graph unavailable — view at <a href="https://github.com/HelixCraft" target="_blank">github.com/HelixCraft</a></div>
        </div>
      </div>
      <div class="section-label">Numbers</div>
      <div class="stats-grid" id="statsGrid">
        <div class="stat-cell"><div class="stat-num" id="stat-commits">—</div><div class="stat-label">contributions / year</div></div>
        <div class="stat-cell"><div class="stat-num" id="stat-repos">—</div><div class="stat-label">public repos</div></div>
        <div class="stat-cell"><div class="stat-num" id="stat-stars">—</div><div class="stat-label">total stars</div></div>
        <div class="stat-cell"><div class="stat-num">4</div><div class="stat-label">Modrinth mods</div></div>
      </div>
    </div>
  `,
  about: () => `
    <div class="wrap">
      <div class="section-label">About</div>
      <div class="about-grid">
        <div class="about-cell">
          <div class="cell-label">About</div>
          <div class="cell-text">I'm a self-taught hobbyist developer from Germany who builds tools out of genuine need and shares them openly. Most of my work lives at the intersection of Minecraft modding and Linux tooling — I develop Fabric mods ranging from utility and automation mods to more advanced client-side modifications, and I enjoy reverse-engineering game mechanics to understand how things work under the hood.<br><br>My main languages are Java, Python, and Bash, with some web development mixed in. I run Linux as my daily driver and feel at home in the terminal. Most of my projects start because I couldn't find something that did exactly what I wanted — so I built it myself.<br><br>Beyond coding, I do a bit of graphic design and 3D animation. I care about clean, practical solutions over flashy ones. If something I make turns out useful for others, that's the whole point.</div>
        </div>
        <div class="about-cell">
          <div class="cell-label">Tech</div>
          <div class="cell-text">Java · Kotlin · Python<br>Minecraft Fabric · Meteor Client<br>Linux · Wayland · GNOME</div>
        </div>
      </div>
      <div class="section-label">Links</div>
      <a class="social-link" href="https://modrinth.com/user/HelixCraft" target="_blank">
        <svg width="17" height="17" viewBox="0 0 512 514" fill="var(--text2)"><path d="M503.6 241.5c-7.5 29.1-18.8 56.9-33.3 82.6-45.7 79.3-130.8 131.1-224.3 131.1-82.5 0-159.1-39.3-208.8-104.2L0 369.6V271.4h98.3l.1 54.4c40.6 51.7 102.7 83.3 166.7 83.3 73.7 0 141-38.7 179.4-100.5 11.7-19.3 20.3-40.2 25.6-62.1l33.5 47.4zm8.4-115.7V224H413.7l-.1-54.4c-40.6-51.7-102.7-83.3-166.7-83.3-73.7 0-141 38.7-179.4 100.5-11.7 19.3-20.3 40.2-25.6 62.1L8.4 201.5C15.9 172.4 27.2 144.6 41.7 119c45.7-79.3 130.8-131.1 224.3-131.1 82.5 0 159.1 39.3 208.8 104.2L512 73.9l-.1 51.9z"/></svg>
        <div class="social-text"><strong>Modrinth</strong>modrinth.com/user/HelixCraft</div>
      </a>
      <a class="social-link" href="https://github.com/HelixCraft" target="_blank">
        <svg width="17" height="17" viewBox="0 0 16 16" fill="var(--text2)"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
        <div class="social-text"><strong>GitHub</strong>github.com/HelixCraft</div>
      </a>
      <a class="social-link" href="https://discordapp.com/users/1292854102174470250" target="_blank">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="var(--text2)"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.104.133 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
        <div class="social-text"><strong>Discord</strong>1292854102174470250</div>
      </a>
    </div>
  `,
  donate: () => `
    <div class="wrap">
      <div class="section-label">Donate</div>
      <div class="donate-heart-banner">
        <svg class="donate-heart" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <div class="donate-heart-text">
          <div class="donate-heart-title">Thank you for your support!</div>
          <div class="donate-heart-subtitle">Every donation helps keep these projects alive</div>
        </div>
      </div>
      <p class="donate-intro">If my mods have been useful, consider supporting further development. All contributions are appreciated and help keep the projects alive.</p>
      <div class="donate-grid">
        <div class="donate-card">
          <div class="donate-header"><div class="donate-logo btc">₿</div><div class="donate-title">Bitcoin (BTC)</div></div>
          <div class="donate-addr" id="btc-addr">bc1qrtgul3gv4twc6stesgknzy94lwssffu28dq44c</div>
          <button class="copy-btn" data-original="Copy address" onclick="copyAddr('btc-addr',this)">Copy address</button>
        </div>
        <div class="donate-card">
          <div class="donate-header"><div class="donate-logo ltc">Ł</div><div class="donate-title">Litecoin (LTC)</div></div>
          <div class="donate-addr" id="ltc-addr">LYn6LCmjD2WyuGGTU2tR7tHGpzXAFmPU3C</div>
          <button class="copy-btn" data-original="Copy address" onclick="copyAddr('ltc-addr',this)">Copy address</button>
        </div>
        <div class="donate-card">
          <div class="donate-header"><div class="donate-logo pp">P</div><div class="donate-title">PayPal</div></div>
          <div class="donate-addr" id="pp-addr">kern-hoeffner32@posteo.de</div>
          <button class="copy-btn" data-original="Copy email address" onclick="copyAddr('pp-addr',this)">Copy email address</button>
        </div>
      </div>
      <div class="donate-contact">
        If you have any problems, contact me on Discord: <a href="https://discordapp.com/users/1292854102174470250" target="_blank" rel="noopener noreferrer">@xhuhnx</a>
      </div>
    </div>
  `,
};

// Router
function router() {
  const path = window.location.pathname.replace(/^\//, "") || "home";
  const pageName = ["home", "activity", "about", "donate"].includes(path)
    ? path
    : "home";

  // Update nav
  document.querySelectorAll(".nav-tab").forEach((tab, idx) => {
    tab.classList.toggle(
      "active",
      ["/", "/activity", "/about", "/donate"][idx] ===
        window.location.pathname ||
        (window.location.pathname === "/" && idx === 0),
    );
  });

  // Render page
  const app = document.getElementById("app");
  app.innerHTML = `<div class="page active" id="page-${pageName}">${pages[pageName]()}</div>`;

  // Load data for specific pages
  if (pageName === "home") {
    if (allRepos.length > 0) {
      renderFeaturedProjects(allRepos);
      sortRepos("stars");
    }
  } else if (pageName === "activity") {
    fetchGitHubStats().then((stats) => renderStats(stats));
  }

  window.scrollTo(0, 0);
}

// Handle navigation
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-link]")) {
    e.preventDefault();
    history.pushState(null, null, e.target.href);
    router();
  }
});

window.addEventListener("popstate", router);

// Initialize
async function init() {
  loadTheme();

  // Fetch repos once
  const repos = await fetchGitHubRepos();
  if (repos) {
    allRepos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  }

  // Initial route
  router();
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
