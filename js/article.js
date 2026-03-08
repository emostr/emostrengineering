(function () {
    document.addEventListener('DOMContentLoaded', function () {
        loadArticle();
    });

    function loadArticle() {
        fetch('content.md')
            .then(function (res) {
                if (!res.ok) throw new Error('Not found');
                return res.text();
            })
            .then(function (text) {
                var parsed = parseFrontmatter(text);
                renderHero(parsed.meta);
                renderContent(parsed.body);
                renderSidebarCalc(parsed.meta);
                renderCalcBanner(parsed.meta);
            })
            .catch(function () {
                var el = document.getElementById('article-content');
                if (el) el.innerHTML = "<p style='color:#666'>Статья не найдена.</p>";
            });
    }

    /* ---- Frontmatter ---- */
    function parseFrontmatter(text) {
        var meta = {};
        var body = text;

        if (text.slice(0, 3) === '---') {
            var end = text.indexOf('\n---', 3);
            if (end !== -1) {
                var fm = text.slice(3, end).trim();
                body = text.slice(end + 4).trim();

                fm.split('\n').forEach(function (line) {
                    var colon = line.indexOf(':');
                    if (colon !== -1) {
                        var key = line.slice(0, colon).trim();
                        var val = line.slice(colon + 1).trim();
                        meta[key] = val;
                    }
                });
            }
        }

        return { meta: meta, body: body };
    }

    /* ---- Hero ---- */
    function renderHero(meta) {
        var el = document.getElementById('article-hero');
        if (!el) return;

        var html = '<a href="/articles/" class="article-breadcrumb">&larr; Статьи</a>';

        if (meta.category) {
            html += '<span class="article-tag">' + esc(meta.category) + '</span>';
        }

        html += '<h1>' + esc(meta.title || '') + '</h1>';

        var metaParts = [];
        if (meta.date) metaParts.push(esc(meta.date));
        if (meta.readtime) metaParts.push(esc(meta.readtime) + ' чтения');
        if (metaParts.length) {
            html += '<div class="article-meta">' + metaParts.join(' · ') + '</div>';
        }

        el.innerHTML = html;

        if (meta.title) {
            document.title = meta.title + ' — emostrEngineering';
        }
    }

    /* ---- Content ---- */
    function renderContent(body) {
        var el = document.getElementById('article-content');
        if (!el) return;

        el.innerHTML = marked.parse(body);

        postProcessTables(el);
        postProcessBlockquotes(el);
        generateTOC(el);
    }

    /* ---- Tables ---- */
    function postProcessTables(contentEl) {
        contentEl.querySelectorAll('table').forEach(function (table) {
            var wrap = document.createElement('div');
            wrap.className = 'table-wrap';
            table.parentNode.insertBefore(wrap, table);
            wrap.appendChild(table);
        });
    }

    /* ---- Blockquotes ---- */
    var BQ_TYPES = [
        { prefix: '⚠️', cls: 'blockquote-warning', title: '⚠️ Важно' },
        { prefix: '✅', cls: 'blockquote-tip',     title: '✅ Совет' },
        { prefix: '🚫', cls: 'blockquote-danger',  title: '🚫 Опасно' }
    ];

    function postProcessBlockquotes(contentEl) {
        contentEl.querySelectorAll('blockquote').forEach(function (bq) {
            var firstP = bq.querySelector('p');
            if (!firstP) return;

            var text = firstP.textContent;

            for (var i = 0; i < BQ_TYPES.length; i++) {
                var t = BQ_TYPES[i];
                if (text.indexOf(t.prefix) === 0) {
                    bq.classList.add(t.cls);
                    var inner = firstP.innerHTML.replace(t.prefix, '').replace(/^\s+/, '');
                    firstP.innerHTML = '<div class="bq-title">' + t.title + '</div>' + inner;
                    break;
                }
            }
        });
    }

    /* ---- TOC ---- */
    function generateTOC(contentEl) {
        var headings = contentEl.querySelectorAll('h2');
        var tocEl = document.getElementById('article-toc');
        if (!headings.length || !tocEl) return;

        var links = [];

        headings.forEach(function (h, i) {
            var id = 'section-' + (i + 1);
            h.id = id;

            var a = document.createElement('a');
            a.href = '#' + id;
            a.textContent = h.textContent;
            tocEl.appendChild(a);
            links.push(a);
        });

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        links.forEach(function (a) { a.classList.remove('active'); });
                        var id = entry.target.id;
                        var active = tocEl.querySelector('a[href="#' + id + '"]');
                        if (active) active.classList.add('active');
                    }
                });
            }, { rootMargin: '0px 0px -60% 0px' });

            headings.forEach(function (h) { observer.observe(h); });
        }
    }

    /* ---- Sidebar calc ---- */
    function renderSidebarCalc(meta) {
        var el = document.getElementById('sidebar-calc');
        if (!el) return;

        if (!meta.calc_url) {
            el.style.display = 'none';
            return;
        }

        el.innerHTML =
            '<div class="sidebar-label">Калькулятор</div>' +
            '<div class="sidebar-calc-title">⚡ ' + esc(meta.calc_title || '') + '</div>' +
            '<div class="sidebar-calc-desc">' + esc(meta.calc_desc || '') + '</div>' +
            '<a href="' + esc(meta.calc_url) + '" class="sidebar-calc-btn">Открыть калькулятор</a>';
    }

    /* ---- Calc banner ---- */
    function renderCalcBanner(meta) {
        var el = document.getElementById('article-calc-banner');
        if (!el || !meta.calc_url) return;

        el.innerHTML =
            '<div class="calc-banner">' +
                '<div class="calc-banner-text">' +
                    '<h3>Попробуйте ' + esc(meta.calc_title || '') + '</h3>' +
                    '<p>' + esc(meta.calc_desc || '') + '</p>' +
                '</div>' +
                '<a href="' + esc(meta.calc_url) + '" class="calc-banner-btn">Открыть калькулятор</a>' +
            '</div>';
    }

    /* ---- Helpers ---- */
    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
})();
