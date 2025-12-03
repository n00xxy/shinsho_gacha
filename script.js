// --- 設定エリア ---
const CSV_FILE = 'books.csv';
const APP_URL = window.location.href; // 今のURLを自動取得

// ★ここにAmazonアソシエイトのIDを入れてください
const AMAZON_ID = "shinsho0e5-22"; 

// シリーズ名の自動グループ化リスト
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

// ページ読み込み完了時に実行
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadBooks();
    setupEvents();
});

// 1. 時間帯によるテーマ切り替え
function initTheme() {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
        document.body.classList.add('dark-mode');
    }
}

// 2. CSVデータの読み込み & グループ化処理
function loadBooks() {
    Papa.parse(CSV_FILE, {
        download: true,
        header: true,
        complete: function(results) {
            allBooks = [];
            
            // データを1冊ずつチェック
            results.data.forEach(book => {
                if (!book.title || !book.series) return;

                const matchedGroup = SERIES_GROUPS.find(group => book.series.includes(group));
                
                if (matchedGroup) {
                    book.groupLabel = matchedGroup;
                    allBooks.push(book);
                }
            });
            
            createFilterCheckboxes();
            updateCount();
        }
    });
}

// チェックボックスの作成
function createFilterCheckboxes() {
    const container = document.getElementById('series-list');
    container.innerHTML = '';

    SERIES_GROUPS.forEach(groupName => {
        const hasBooks = allBooks.some(b => b.groupLabel === groupName);
        if (!hasBooks) return;

        const wrapper = document.createElement('div');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `grp-${groupName}`;
        checkbox.value = groupName;
        
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

// 対象冊数の表示更新
function updateCount() {
    const selectedGroups = getSelectedGroups();
    const count = allBooks.filter(b => selectedGroups.includes(b.groupLabel)).length;
    document.getElementById('book-count').innerText = `対象: ${count} 冊`;
}

// 現在チェックされているグループ名を取得
function getSelectedGroups() {
    const checkboxes = document.querySelectorAll('#series-list input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// 3. ボタン操作の設定
function setupEvents() {
    document.getElementById('gacha-btn').addEventListener('click', spinGacha);

    document.getElementById('btn-select-all').addEventListener('click', () => {
        document.querySelectorAll('#series-list input').forEach(cb => cb.checked = true);
        updateCount();
    });

    document.getElementById('btn-reset-default').addEventListener('click', () => {
        document.querySelectorAll('#series-list input').forEach(cb => {
            cb.checked = DEFAULT_SELECTED.includes(cb.value);
        });
        updateCount();
    });
}

// ガチャを回す処理
function spinGacha() {
    const selectedGroups = getSelectedGroups();
    const targets = allBooks.filter(b => selectedGroups.includes(b.groupLabel));

    if (targets.length === 0) {
        alert("対象の本がありません。シリーズを選んでください。");
        return;
    }

    const book = targets[Math.floor(Math.random() * targets.length)];
    displayResult(book);
}

// 結果を画面に表示
function displayResult(book) {
    const card = document.getElementById('result-card');
    card.classList.remove('hidden');

    // テキスト情報
    document.getElementById('res-series-label').innerText = `📍 ${book.groupLabel}`;
    document.getElementById('res-title').innerText = book.title;
    document.getElementById('res-author').innerText = `著: ${book.author}`;
    
    // 画像
    const img = document.getElementById('res-image');
    if (book.image_url) {
        img.src = book.image_url;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    // 価格
    if (book.price) {
        document.getElementById('res-price').innerText = `価格: ¥${Number(book.price).toLocaleString()}`;
    }
    // 発売日
    if (book.sales_date) {
        document.getElementById('res-date').innerText = `発売: ${book.sales_date}`;
    }

    // --- 楽天ボタン ---
    const rakutenBtn = document.getElementById('link-rakuten');
    if (book.item_url) {
        rakutenBtn.href = book.item_url;
        rakutenBtn.style.display = 'inline-block';
    } else {
        rakutenBtn.style.display = 'none';
    }

    // --- Amazonボタン ---
    const amazonBtn = document.getElementById('link-amazon');
    amazonBtn.href = `https://www.amazon.co.jp/s?k=${encodeURIComponent(book.title)}&tag=${AMAZON_ID}`;

    // --- ツイートリンク作成 ---
    // 構成：タイトル → 著者 → レーベル → 誘導文＆アプリURL → ハッシュタグ → 楽天URL（画像用）
    const shareText = `新書ガチャの結果\n\n『${book.title}』\n著：${book.author}\nレーベル：${book.groupLabel}\n\n▼あなたも回してみる\n${APP_URL}\n\n#新書ガチャ\n${book.item_url}`;
    
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    document.getElementById('link-twitter').href = tweetUrl;

    // --- あらすじ ---
    const descArea = document.getElementById('res-desc-area');
    const descText = document.getElementById('res-desc');
    if (book.description) {
        descArea.classList.remove('hidden');
        descText.innerText = book.description;
    } else {
        descArea.classList.add('hidden');
    }

    // カードの位置までスクロール
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
