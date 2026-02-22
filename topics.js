/**
 * topics.js — Kelajak Soati mavzulari sahifasi uchun logic
 * - Ma'lumotlarni avval PHP API dan, keyin localStorage/JSON dan oladi
 * - Qidiruv yo'q — mavzular to'liq va avtomatik chiqadi
 */

const GRADE = document.body.dataset.grade; // "5-8" yoki "9-11"
const API = 'api.php';

// ---- Ma'lumotlarni olish ----
async function loadData() {
    // 0. Agar data.js yuklangan bo'lsa, undan foydalanamiz (file:// protokoli uchun eng ishonchli)
    if (window.KS_DATA) {
        console.log('Using window.KS_DATA from data.js');
        // Cache ni yangilab qo'yamiz
        localStorage.setItem('ks_data', JSON.stringify(window.KS_DATA));
        return window.KS_DATA;
    }

    // 1. Server API dan sinab ko'ramiz
    try {
        const res = await fetch(`${API}?action=get`, { cache: 'no-cache' });
        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
                localStorage.setItem('ks_data', JSON.stringify(json.data));
                return json.data;
            }
        }
    } catch (_) { }

    // 2. data.json dan to'g'ridan-to'g'ri (har doim yangi, kesh o'tkazib)
    try {
        const res = await fetch('data.json?t=' + Date.now(), { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('ks_data', JSON.stringify(data));
            return data;
        }
    } catch (_) { }

    // 3. localStorage cache (oxirgi zaxira)
    const cached = localStorage.getItem('ks_data');
    if (cached) {
        try { return JSON.parse(cached); } catch (_) { }
    }

    return { '5-8': [], '9-11': [] };
}

// ---- Sana formatlash ----
function formatDate(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
}

// ---- Bitta karta HTML ----
function buildCard(topic, index) {
    const gradeParam = encodeURIComponent(GRADE);
    const href = `mavzu.html?grade=${gradeParam}&id=${topic.id}`;
    const color = topic.rang || '#00c6ff';
    const delay = index * 60;

    return `
    <a href="${href}" class="topic-card" 
       style="--card-color:${color}; animation-delay:${delay}ms"
       data-id="${topic.id}">
        <div class="card-header-row">
            <span class="hafta-badge">
                <i class="fas fa-hashtag"></i> ${topic.hafta}-mavzu
            </span>
            <span class="card-date">
                <i class="fas fa-clock"></i> ${formatDate(topic.date)}
            </span>
        </div>
        <h3>${escHtml(topic.title)}</h3>
        <p>${escHtml(topic.qisqa)}</p>
        <div class="card-footer-row">
            <span class="read-btn">
                Batafsil o'qish <i class="fas fa-arrow-right"></i>
            </span>
            <i class="fas fa-book-open" style="color:${color};opacity:.5;font-size:.85rem"></i>
        </div>
    </a>`;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- Mavzular topilmaganda qidiruv ko'rsatish ----
function showSearchFallback() {
    const grid = document.getElementById('topicsGrid');
    const grade = GRADE === '5-8' ? '5-8 sinf' : '9-11 sinf';
    grid.innerHTML = `
    <div class="loading-state" style="gap:1.5rem">
        <i class="fas fa-satellite-dish" style="font-size:2.5rem;opacity:.35"></i>
        <p style="font-size:1rem">Mavzular yuklanmadi</p>
        <p style="font-size:.85rem;opacity:.6">Internetdan qidirib ko'ring:</p>
        <form onsubmit="doSearch(event,'${grade}')" style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center">
            <input id="fallbackSearch" type="text"
                placeholder="Mavzu nomi..."
                style="padding:10px 18px;border-radius:50px;border:1px solid var(--border);
                       background:var(--glass);color:var(--text);font-family:var(--font);
                       font-size:.95rem;outline:none;min-width:220px;backdrop-filter:blur(10px)">
            <button type="submit"
                style="padding:10px 22px;border-radius:50px;border:none;
                       background:linear-gradient(135deg,var(--junior-2),var(--junior));
                       color:#fff;font-weight:600;cursor:pointer;font-family:var(--font);font-size:.9rem">
                <i class="fas fa-search"></i> Qidirish
            </button>
        </form>
    </div>`;
}

function doSearch(e, grade) {
    e.preventDefault();
    const q = document.getElementById('fallbackSearch')?.value?.trim();
    if (!q) return;
    const query = encodeURIComponent(`Kelajak Soati ${grade} ${q}`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
}
window.doSearch = doSearch;

// ---- Mavzularni sahifaga chiqarish ----
function renderTopics(topics) {
    const grid = document.getElementById('topicsGrid');
    const countEl = document.getElementById('totalCount');

    if (countEl) countEl.textContent = topics.length;

    if (!topics.length) {
        showSearchFallback();
        return;
    }

    // Mavzu bo'yicha tartiblash
    const sorted = [...topics].sort((a, b) => (a.hafta || 0) - (b.hafta || 0));
    grid.innerHTML = sorted.map((t, i) => buildCard(t, i)).join('');
}

// ---- Asosiy ishga tushirish ----
async function init() {
    const grid = document.getElementById('topicsGrid');
    grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Mavzular yuklanmoqda...</p></div>`;

    const data = await loadData();
    const topics = data[GRADE] || [];
    renderTopics(topics);
}

document.addEventListener('DOMContentLoaded', init);
