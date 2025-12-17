// 1. Firebase 核心設定 (已同步你的專屬密鑰)
const firebaseConfig = {
  apiKey: "AIzaSyA2ryGi_LImOxgXWssY-sm4KqiZWmvSr6M",
  authDomain: "couple-s-log.firebaseapp.com",
  databaseURL: "https://couple-s-log-default-rtdb.firebaseio.com",
  projectId: "couple-s-log",
  storageBucket: "couple-s-log.firebasestorage.app",
  messagingSenderId: "327080956450",
  appId: "1:327080956450:web:9398693264b3581fa1307b",
  measurementId: "G-T15SBXDQBL"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. 全域變數
let currentUser = ''; // 'xin' (欣欣) 或 'new' (新新)
let currentApp = '';  

// 勵志語錄
const quotes = [
    "今天的努力，是為了 2026 更好的我們。",
    "交易不是預測未來，而是管理當下的心態。",
    "慢慢來，比較快。紀律是獲利的唯一途徑。",
    "每一本書都是通往更高維度的階梯。",
    "財富流動的方向，取決於你的心念。"
];
document.getElementById('daily-quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];

// 3. 路由與基礎導航
function goHome() {
    hideAllPages();
    document.getElementById('home-page').classList.add('active');
    document.getElementById('navbar').classList.add('hidden');
}

function navigateTo(pageId) {
    hideAllPages();
    document.getElementById(pageId).classList.add('active');
    document.getElementById('navbar').classList.remove('hidden');
    
    let title = "";
    if(pageId === 'xin-menu') title = "欣欣日記 👧";
    if(pageId === 'new-menu') title = "新新日記 👦";
    if(pageId === 'money-menu') { title = "來財來財 💰"; renderMoneyPage(); }
    if(pageId === 'vision-board') { title = "願景版 🌟"; renderVisionPage(); }
    document.getElementById('page-title').innerText = title;
}

function openSubApp(user, appType) {
    currentUser = user;
    currentApp = appType;
    hideAllPages();
    document.getElementById('app-content').classList.add('active');
    let content = document.getElementById('dynamic-content');
    content.innerHTML = '<div class="loader">正在讀取雲端資料...</div>';

    if(appType === 'daily') renderDailyPage(content);
    else if(appType === 'forex') renderForexPage(content);
    else if(appType === 'reading') renderReadingPage(content);
    else if(appType === 'akashic') renderAkashicPage(content);
    else if(appType === 'breaking') renderBreakingPage(content);
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
}

// 4. --- 功能：每日記錄 ---
function renderDailyPage(container) {
    document.getElementById('page-title').innerText = (currentUser==='xin'?"欣欣":"新新") + " - 每日記錄";
    container.innerHTML = `
        <div class="daily-box hard-shadow">
            <h3 id="current-date-display"></h3>
            <div id="todo-list"></div>
            <hr>
            <div style="font-weight:900;">完成進度：<span id="progress-percent">0%</span></div>
            <button class="add-btn-corner" onclick="addTodoItem()">＋</button>
        </div>
    `;
    document.getElementById('current-date-display').innerText = "📅 " + new Date().toLocaleDateString();
    loadTodoData();
}

function loadTodoData() {
    db.ref(`users/${currentUser}/daily`).on('value', (snapshot) => {
        const listDiv = document.getElementById('todo-list');
        if(!listDiv) return;
        listDiv.innerHTML = "";
        let count = 0, done = 0;
        snapshot.forEach((child) => {
            const item = child.val();
            count++; if(item.completed) done++;
            listDiv.innerHTML += `
                <div style="margin:12px 0; font-size:1.3rem; display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" style="width:25px; height:25px;" ${item.completed?'checked':''} 
                        onclick="toggleTodo('${child.key}', ${item.completed})"> 
                    <span style="${item.completed?'text-decoration:line-through; color:gray;':''}">${item.text}</span>
                    <small onclick="deleteTodo('${child.key}')" style="margin-left:auto; cursor:pointer; font-size:0.8rem;">❌</small>
                </div>`;
        });
        document.getElementById('progress-percent').innerText = count === 0 ? "0%" : Math.round((done/count)*100) + "%";
    });
}

function addTodoItem() {
    const task = prompt("新增挑戰項目 (例如: 運動、閱讀、飲水2000cc)：");
    if(task) db.ref(`users/${currentUser}/daily`).push({ text: task, completed: false });
}

function toggleTodo(key, status) { db.ref(`users/${currentUser}/daily/${key}`).update({ completed: !status }); }
function deleteTodo(key) { if(confirm("確定刪除？")) db.ref(`users/${currentUser}/daily/${key}`).remove(); }

// 5. --- 功能：外匯記錄 (超詳細版) ---
function renderForexPage(container) {
    document.getElementById('page-title').innerText = (currentUser==='xin'?"欣欣":"新新") + " - 外匯記錄";
    container.innerHTML = `
        <div class="split-view">
            <div class="panel" id="forex-list">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3>📜 交易筆記</h3>
                    <button onclick="showForexForm()">＋ 新增紀錄</button>
                </div>
                <div id="forex-entries"></div>
            </div>
            <div class="panel" id="forex-form-panel" style="display:none;">
                <h3 id="form-mode-title">📝 紀錄交易</h3>
                <form id="forex-form">
                    <input type="hidden" id="f-key">
                    <label>筆記日期</label><input type="date" id="f-date">
                    <label>圖片連結</label><input type="text" id="f-img" placeholder="https://...">
                    <label>分類 (多選)</label>
                    <div class="multi-select-box">
                        <label><input type="checkbox" name="f-cat" value="獲利"> 獲利</label>
                        <label><input type="checkbox" name="f-cat" value="虧損"> 虧損</label>
                        <label><input type="checkbox" name="f-cat" value="持倉中"> 持倉中</label>
                        <label><input type="checkbox" name="f-cat" value="無下單"> 無下單</label>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div><label>盈虧</label><select id="f-res"><option>獲利</option><option>虧損</option><option>BE</option></select></div>
                        <div><label>時區</label><select id="f-session"><option>紐約交易時段</option><option>亞洲交易時段</option><option>倫敦交易時段</option></select></div>
                    </div>
                    <label>數據 (進場/TP/SL/手數)</label>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                        <input type="text" id="f-entry" placeholder="進場價">
                        <input type="text" id="f-tp" placeholder="止盈目標">
                        <input type="text" id="f-sl" placeholder="止損價格">
                        <input type="text" id="f-lots" placeholder="手數">
                    </div>
                    <label>進場前情緒</label>
                    <div class="emotion-group">
                        <div style="background:var(--mood-green); padding:5px; border:1px solid #000; margin-bottom:5px;">
                            <label><input type="checkbox" name="f-pre" value="冷靜自信"> 冷靜自信</label>
                        </div>
                        <div style="background:var(--mood-red); padding:5px; border:1px solid #000;">
                            <label><input type="checkbox" name="f-pre" value="猶豫不決"> 猶豫不決</label>
                            <label><input type="checkbox" name="f-pre" value="急躁"> 急躁</label>
                        </div>
                    </div>
                    <label>心得筆記</label><textarea id="f-note" rows="3"></textarea>
                    <button type="button" style="width:100%; margin-top:10px;" onclick="saveForex()">💾 儲存並同步</button>
                    <button type="button" style="width:100%; margin-top:5px; background:gray;" onclick="document.getElementById('forex-form-panel').style.display='none'">取消</button>
                </form>
            </div>
        </div>
    `;
    loadForexData();
}

function showForexForm() {
    document.getElementById('forex-form-panel').style.display = 'block';
    document.getElementById('forex-form').reset();
    document.getElementById('f-key').value = "";
    document.getElementById('f-date').valueAsDate = new Date();
}

function saveForex() {
    const key = document.getElementById('f-key').value;
    const cats = Array.from(document.querySelectorAll('input[name="f-cat"]:checked')).map(el => el.value);
    const preEmos = Array.from(document.querySelectorAll('input[name="f-pre"]:checked')).map(el => el.value);
    
    const data = {
        date: document.getElementById('f-date').value,
        res: document.getElementById('f-res').value,
        session: document.getElementById('f-session').value,
        note: document.getElementById('f-note').value,
        cats: cats,
        preEmotions: preEmos,
        entry: document.getElementById('f-entry').value,
        timestamp: Date.now()
    };

    const ref = db.ref(`users/${currentUser}/forex`);
    if(key) {
        ref.child(key).update(data).then(() => { alert("已修改！"); });
    } else {
        ref.push(data).then(() => { alert("已儲存！"); });
    }
    document.getElementById('forex-form-panel').style.display = 'none';
}

function loadForexData() {
    db.ref(`users/${currentUser}/forex`).on('value', (snapshot) => {
        const div = document.getElementById('forex-entries');
        if(!div) return;
        div.innerHTML = "";
        snapshot.forEach((child) => {
            const v = child.val();
            div.innerHTML += `
                <div class="hard-shadow" style="padding:15px; margin-bottom:15px; background:white; position:relative;">
                    <div style="font-weight:900; color:var(--accent-orange);">${v.date} [${v.res}]</div>
                    <div style="font-size:0.9rem; margin:5px 0;">時區: ${v.session} | 進場: ${v.entry || '未填'}</div>
                    <div style="font-size:0.8rem; color:#555;">${v.note || ''}</div>
                    <button onclick="deleteForex('${child.key}')" style="position:absolute; top:10px; right:10px; background:none; border:none; cursor:pointer;">🗑️</button>
                </div>`;
        });
    });
}

function deleteForex(key) { if(confirm("確定刪除此交易筆記？")) db.ref(`users/${currentUser}/forex/${key}`).remove(); }

// 6. --- 功能：來財來財 ---
function renderMoneyPage() {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div class="split-view">
            <div class="panel">
                <h3>💸 貸款管理</h3>
                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <button onclick="handleLoan('add')">➕ 新增貸款</button>
                    <button onclick="handleLoan('pay')" style="background:#555;">➖ 償還貸款</button>
                </div>
                <div class="grid-container" style="height:auto; grid-template-columns: 1fr 1fr;">
                    <div class="hard-shadow" style="padding:10px;"><h4>欣宜</h4><div id="list-xin"></div></div>
                    <div class="hard-shadow" style="padding:10px;"><h4>明新</h4><div id="list-new"></div></div>
                </div>
            </div>
            <div class="panel">
                <h3>💰 資金盤倉位</h3>
                <button onclick="addAsset()">＋ 新增倉位</button>
                <div id="asset-display" style="margin-top:15px;"></div>
            </div>
        </div>
    `;
    loadFinanceData();
}

function handleLoan(type) {
    const name = prompt("姓名 (欣宜/明新):");
    const amount = prompt(type==='add'?"貸款金額:":"償還金額:");
    if(name && amount) {
        const ref = db.ref(`finance/loans/${name==='欣宜'?'xin':'new'}`);
        ref.push({ type, amount: parseInt(amount), date: new Date().toLocaleDateString() });
    }
}

function loadFinanceData() {
    // 貸款讀取邏輯
    ['xin','new'].forEach(user => {
        db.ref(`finance/loans/${user}`).on('value', snapshot => {
            const div = document.getElementById(`list-${user}`);
            if(!div) return;
            div.innerHTML = "";
            let total = 0;
            snapshot.forEach(c => {
                const v = c.val();
                total += (v.type === 'add' ? v.amount : -v.amount);
                div.innerHTML += `<div style="font-size:0.8rem;">${v.date}: ${v.type==='add'?'+':'-'}${v.amount}</div>`;
            });
            div.innerHTML += `<hr><strong>總計: ${total}</strong>`;
        });
    });
}

// 7. --- 初始化 ---
goHome();

// 點擊 Logo 回首頁
document.getElementById('page-title').onclick = goHome;