// 設定
const CSV_FILE = 'books.csv';
const APP_URL = window.location.href;

// ▼ ここで定義した名前に「自動でまとめ」ます
// データのシリーズ名に「岩波新書」という文字が含まれていれば、
// まとめて「岩波新書」グループとして扱います。
const SERIES_GROUPS = [
    "岩波新書", 
    "岩波ジュニア新書",
    "中公新書", 
    "中公新書ラクレ",
    "ちくま新書", 
    "ちくまプリマー新書",
    "講談社現代新書", 
    "ブルーバックス",
    "集英社新書",
    "光文社新書",
    "NHK出版新書", 
    "NHKブックス",
    "平凡社新書",
    "PHP新書",
    "新潮新書", 
    "新潮選書"
];

// 初期選択にするグループ（御三家）
const DEFAULT_SELECTED = ["岩波新書", "中公新書", "ちくま新書"];

let allBooks = [];

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadBooks();
    setupEvents();
});

// 1. 時間帯テーマ
function initTheme() {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
        document.body.classList.add('dark-mode');
    }
}

// 2. CSV読み込み & グループ化
function loadBooks() {
    Papa.parse(CSV_FILE, {
        download: true,
        header: true,
        complete: function(results) {
            allBooks = [];
            
            // データを1冊ずつチェックして、グループ分けする
            results.data.forEach(book => {
                if (!book.title || !book.series) return;

                // 本のシリーズ名に、定義したグループ名が含まれているか確認
                // 例：「岩波新書 新赤版」なら「岩波新書」グループに入れる
                const matchedGroup = SERIES_GROUPS.find(group => book.series.includes(group));
                
                if (matchedGroup) {
                    // グループ名（ラベル）をデータに追加して保存
                    book.groupLabel = matchedGroup;
                    allBooks.push(book);
                }
            });
            
            createFilterCheckboxes();
            updateCount();
        }
    });
}

// チェックボックス作成（定義したリスト順に作る）
function createFilterCheckboxes() {
    const container = document.getElementById('series-list');
    container.innerHTML = '';

    SERIES_GROUPS.forEach(groupName => {
        // 対象の本が1冊もないグループは表示しない（親切設計）
        const hasBooks = allBooks.some(b => b.groupLabel === groupName);
        if (!hasBooks) return;

        const wrapper = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `grp-${groupName}`;
        checkbox.value = groupName;
        
        // 初期選択
        if (DEFAULT_SELECTED.includes(groupName)) {
            checkbox.checked = true;
        }

        checkbox.addEventListener('change', updateCount);

        const label = document.createElement('label');
        label.htmlFor = `grp-${groupName}`;
        label.innerText = groupName;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    });
}

// 冊数更新
function updateCount() {
    const selectedGroups = getSelectedGroups();
    // 本についている groupLabel が選択中かチェック
    const count = allBooks.filter(b => selectedGroups.includes(b.groupLabel)).length;
    document.getElementById('book-count').innerText = `対象: ${count} 冊`;
}

// 選択中のグループを取得
function getSelectedGroups() {
    const checkboxes = document.querySelectorAll('#series-list input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// 3. イベント設定
function setupEvents() {
    document.getElementById('gacha-btn').addEventListener('click', spinGacha);

    // 全選択
    document.getElementById('btn-select-all').addEventListener('click', () => {
        document.querySelectorAll('#series-list input').forEach(cb => cb.checked = true);
        updateCount();
    });

    // 御三家に戻す
    document.getElementById('btn-reset-default').addEventListener('click', () => {
        document.querySelectorAll('#series-list input').forEach(cb => {
            cb.checked = DEFAULT_SELECTED.includes(cb.value);
        });
        updateCount();
    });
}

// ガチャ回転
function spinGacha() {
    const selectedGroups = getSelectedGroups();
    // 選択されたグループに属する本だけを抽出
    const targets = allBooks.filter(b => selectedGroups.includes(b.groupLabel));

    if (targets.length === 0) {
        alert("対象の本がありません。シリーズを選んでください。");
        return;
    }

    const book = targets[Math.floor(Math.random() * targets.length)];
    displayResult(book);
}

// 結果表示
function displayResult(book) {
    const card = document.getElementById('result-card');
    card.classList.remove('hidden');

    // 表示用のラベルは「岩波新書」のようにシンプルなものを使う
    document.getElementById('res-series-label').innerText = `📍 ${book.groupLabel}`;
    
    document.getElementById('res-title').innerText = book.title;
    document.getElementById('res-author').innerText = `著: ${book.author}`;
    
    const img = document.getElementById('res-image');
    if (book.image_url) {
        img.src = book.image_url;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    if (book.price) {
        document.getElementById('res-price').innerText = `価格: ¥${Number(book.price).toLocaleString()}`;
    }
    if (book.sales_date) {
        document.getElementById('res-date').innerText = `発売: ${book.sales_date}`;
    }

    // 楽天リンク
    const rakutenBtn = document.getElementById('link-rakuten');
    if (book.item_url) {
        rakutenBtn.href = book.item_url;
        rakutenBtn.style.display = 'inline-block';
    } else {
        rakutenBtn.style.display = 'none';
    }

    // Amazonリンク
    const amazonBtn = document.getElementById('link-amazon');
    amazonBtn.href = `https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title)}`;

    // ツイート
    // テキストにはシンプルなグループ名（岩波新書など）を入れる
    const shareText = `新書ガチャの結果\n\n『${book.title}』\n著：${book.author}\nレーベル：${book.groupLabel}\n\n#新書ガチャ\n${book.item_url}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(APP_URL)}`;
    document.getElementById('link-twitter').href = tweetUrl;

    // あらすじ
    const descArea = document.getElementById('res-desc-area');
    const descText = document.getElementById('res-desc');
    if (book.description) {
        descArea.classList.remove('hidden');
        descText.innerText = book.description;
    } else {
        descArea.classList.add('hidden');
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}