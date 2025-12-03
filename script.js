// ガチャを回す処理（演出付き）
function spinGacha() {
    const selectedGroups = getSelectedGroups();
    const targets = allBooks.filter(b => selectedGroups.includes(b.groupLabel));

    if (targets.length === 0) {
        alert("対象の本がありません。シリーズを選んでください。");
        return;
    }

    // 1. 準備：ボタンを無効化し、カードを表示
    const btn = document.getElementById('gacha-btn');
    const card = document.getElementById('result-card');
    const titleEl = document.getElementById('res-title');
    const authorEl = document.getElementById('res-author');
    const imgEl = document.getElementById('res-image');
    
    // ボタンを連打できないようにする
    btn.disabled = true;
    btn.classList.add('disabled-btn');
    btn.innerText = "選書中...";

    // カードを表示（中身は空にしておく）
    card.classList.remove('hidden');
    card.classList.add('rumbling'); // ブルブル震えるクラス追加
    card.scrollIntoView({ behavior: 'smooth', block: 'center' }); // カードが見える位置へ

    // 画像とボタン類は一旦隠す（ネタバレ防止）
    imgEl.style.display = 'none';
    document.querySelector('.buy-buttons').style.opacity = '0';
    document.querySelector('.share-area').style.opacity = '0';
    document.getElementById('res-price').innerText = "";
    document.getElementById('res-date').innerText = "";
    document.getElementById('res-series-label').innerText = "選んでいます...";
    document.getElementById('res-desc-area').classList.add('hidden');

    // 2. スロット演出（パラパラ漫画）
    let count = 0;
    const maxCount = 20; // 何回パラパラさせるか
    
    const interval = setInterval(() => {
        // ランダムな本を仮表示
        const randomBook = targets[Math.floor(Math.random() * targets.length)];
        titleEl.innerText = randomBook.title;
        authorEl.innerText = randomBook.author;
        
        count++;

        // 3. 演出終了（結果表示）
        if (count > maxCount) {
            clearInterval(interval);
            
            // 本当の当たりを決める
            const finalBook = targets[Math.floor(Math.random() * targets.length)];
            
            // 演出解除
            card.classList.remove('rumbling');
            btn.disabled = false;
            btn.classList.remove('disabled-btn');
            btn.innerText = "ガチャを回す 🔄";
            
            // ボタン類を再表示
            document.querySelector('.buy-buttons').style.opacity = '1';
            document.querySelector('.share-area').style.opacity = '1';

            // 結果を表示
            displayResult(finalBook);
        }
    }, 50); // 0.05秒ごとに切り替え
}
