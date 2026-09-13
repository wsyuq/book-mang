// --- DOM要素の取得 ---
const searchInput = document.getElementById('search-input');
const reverseUnreadBtn = document.getElementById('reverse-unread-btn');

const unreadTitle = document.getElementById('unread-title');
const addUnreadBtn = document.getElementById('add-unread-btn');

const readTitle = document.getElementById('read-title');
const readDateInput = document.getElementById('read-date-input');
const addReadBtn = document.getElementById('add-read-btn');

const unreadList = document.getElementById('unread-list');
const readList = document.getElementById('read-list');
const readSection = document.getElementById('read-section');

// 設定・ツールモーダル用要素
const openDataModalBtn = document.getElementById('open-data-modal-btn');
const closeDataModalBtn = document.getElementById('close-data-modal-btn');
const dataModal = document.getElementById('data-modal');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const importJsonBtn = document.getElementById('import-json-btn');
const importJsonFile = document.getElementById('import-json-file');

// 編集モーダル用要素
const editModal = document.getElementById('edit-modal');
const editTitle = document.getElementById('edit-title');
const editStatus = document.getElementById('edit-status');
const editDate = document.getElementById('edit-date');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

let editingBookId = null;
let draggedBookId = null;
let searchQuery = '';
let isUnreadReversed = false;

// --- 日付ヘルパー関数（YYYY-MM-DD取得） ---
function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// 読了追加フォームの初期化
function initReadDateInput() {
    readDateInput.value = getTodayString();
}
initReadDateInput();

// --- 検索機能 ---
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderBooks();
});

// --- データの取得・保存 ---
function getBooks() {
    return JSON.parse(localStorage.getItem('books')) || [];
}
function saveBooks(books) {
    localStorage.setItem('books', JSON.stringify(books));
    renderBooks();
}

function reorderUnreadBooks(books) {
    let unreadBooks = books.filter(b => b.status === 'unread').sort((a, b) => a.order - b.order);
    unreadBooks.forEach((b, i) => b.order = i);
}

// --- 未読の追加 ---
addUnreadBtn.addEventListener('click', () => {
    const title = unreadTitle.value.trim();
    if (!title) return alert('タイトルを入力してください');
    
    let books = getBooks();
    reorderUnreadBooks(books);
    
    books.push({
        id: Date.now().toString(),
        title,
        status: 'unread',
        readDate: null,
        readTimestamp: null,
        order: books.filter(b => b.status === 'unread').length
    });
    
    saveBooks(books);
    unreadTitle.value = '';
});

// --- 読了の追加 ---
addReadBtn.addEventListener('click', () => {
    const title = readTitle.value.trim();
    if (!title) return alert('タイトルを入力してください');
    
    const dateVal = readDateInput.value ? readDateInput.value : null;

    let books = getBooks();
    books.push({
        id: Date.now().toString(),
        title,
        status: 'read',
        readDate: dateVal,
        readTimestamp: Date.now(),
        order: 0
    });
    
    saveBooks(books);
    readTitle.value = '';
    initReadDateInput();
});

// --- 設定・ツールモーダルの制御 ---
openDataModalBtn.addEventListener('click', () => {
    dataModal.classList.add('show');
    searchInput.focus();
});
closeDataModalBtn.addEventListener('click', () => dataModal.classList.remove('show'));

// 1. CSV書き出し (Excel用)
exportCsvBtn.addEventListener('click', () => {
    const books = getBooks();
    if (books.length === 0) return alert('書き出すデータがありません');

    let csvContent = '\uFEFFタイトル,ステータス,読了日\n';

    books.forEach(b => {
        const status = b.status === 'read' ? '読了' : '未読';
        const date = b.readDate || '';
        const escapedTitle = `"${b.title.replace(/"/g, '""')}"`;
        csvContent += `${escapedTitle},${status},${date}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `書籍整理データ_${getTodayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// 2. JSONバックアップ
exportJsonBtn.addEventListener('click', () => {
    const books = getBooks();
    if (books.length === 0) return alert('書き出すデータがありません');

    const jsonStr = JSON.stringify(books, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `books_backup_${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// 3. JSON復元
importJsonBtn.addEventListener('click', () => {
    importJsonFile.click();
});

importJsonFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const books = JSON.parse(event.target.result);
            if (Array.isArray(books)) {
                if (confirm('現在のデータを上書きしてバックアップから復元しますか？')) {
                    saveBooks(books);
                    alert('復元が完了しました！');
                    dataModal.classList.remove('show');
                }
            } else {
                alert('無効なバックアップファイル形式です');
            }
        } catch (err) {
            alert('ファイルの読み込みに失敗しました');
        }
        importJsonFile.value = '';
    };
    reader.readAsText(file);
});

// --- プルダウンメニュー制御 ---
window.toggleMenu = function(id) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `menu-${id}`) menu.classList.remove('show');
    });
    const menu = document.getElementById(`menu-${id}`);
    if (menu) menu.classList.toggle('show');
};
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('menu-btn')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
    }
});

// --- 本の削除 ---
window.deleteBook = function(id) {
    if (confirm('この本を削除しますか？')) {
        let books = getBooks().filter(b => b.id !== id);
        reorderUnreadBooks(books);
        saveBooks(books);
    }
};

// --- 本の編集 ---
window.openEditModal = function(id) {
    const book = getBooks().find(b => b.id === id);
    if (!book) return;
    editingBookId = id;
    editTitle.value = book.title;
    editStatus.value = book.status;
    editDate.value = book.readDate || '';
    
    editDate.style.display = book.status === 'read' ? 'inline-block' : 'none';
    editModal.classList.add('show');
};

editStatus.addEventListener('change', () => {
    if (editStatus.value === 'read') {
        editDate.style.display = 'inline-block';
        if (!editDate.value) editDate.value = getTodayString();
    } else {
        editDate.style.display = 'none';
    }
});

cancelEditBtn.addEventListener('click', () => editModal.classList.remove('show'));

saveEditBtn.addEventListener('click', () => {
    const title = editTitle.value.trim();
    if (!title) return alert('タイトルを入力してください');
    const status = editStatus.value;
    const readDate = (status === 'read' && editDate.value) ? editDate.value : null;

    let books = getBooks();
    const book = books.find(b => b.id === editingBookId);
    if (book) {
        const oldStatus = book.status;
        book.title = title;
        book.status = status;
        book.readDate = readDate;
        
        if (status === 'unread' && oldStatus !== 'unread') {
            book.order = books.filter(b => b.status === 'unread').length;
        } else if (status === 'read' && oldStatus !== 'read') {
            book.readTimestamp = Date.now();
        }
    }
    reorderUnreadBooks(books);
    saveBooks(books);
    editModal.classList.remove('show');
});

// --- 未読リストの昇降順入れ替え ---
reverseUnreadBtn.addEventListener('click', () => {
    isUnreadReversed = !isUnreadReversed;
    renderBooks();
});

// --- ドラッグ＆ドロップ (未読の並び替え) ---
function handleDragStart(e, id) {
    draggedBookId = id;
    e.dataTransfer.effectAllowed = 'move';
}
function handleDragOverUnread(e) { e.preventDefault(); }

function handleDropUnread(e, targetId) {
    e.preventDefault();
    if (draggedBookId === targetId) return;

    let books = getBooks();
    let unreadBooks = books.filter(b => b.status === 'unread').sort((a, b) => a.order - b.order);
    
    if (isUnreadReversed) unreadBooks.reverse();

    const draggedIndex = unreadBooks.findIndex(b => b.id === draggedBookId);
    const targetIndex = unreadBooks.findIndex(b => b.id === targetId);
    
    if (draggedIndex > -1 && targetIndex > -1) {
        const [item] = unreadBooks.splice(draggedIndex, 1);
        unreadBooks.splice(targetIndex, 0, item);
        
        unreadBooks.forEach((b, i) => b.order = i);
        isUnreadReversed = false; 
        
        saveBooks(books.filter(b => b.status === 'read').concat(unreadBooks));
    }
}

// --- 未読から既読へのドラッグ＆ドロップ ---
readSection.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    readSection.classList.add('drag-over');
});
readSection.addEventListener('dragleave', () => {
    readSection.classList.remove('drag-over');
});
readSection.addEventListener('drop', (e) => {
    e.preventDefault();
    readSection.classList.remove('drag-over');
    if (!draggedBookId) return;

    let books = getBooks();
    const book = books.find(b => b.id === draggedBookId);
    
    if (book && book.status === 'unread') {
        book.status = 'read';
        book.readDate = getTodayString(); 
        book.readTimestamp = Date.now();
        
        reorderUnreadBooks(books);
        saveBooks(books);
    }
    draggedBookId = null;
});

// --- 画面に描画 ---
function renderBooks() {
    unreadList.innerHTML = '';
    readList.innerHTML = '';
    const books = getBooks();

    // 1. 読了リストの準備
    let readBooks = books.filter(b => b.status === 'read').sort((a, b) => {
        const timeA = a.readDate ? new Date(a.readDate).getTime() : 0;
        const timeB = b.readDate ? new Date(b.readDate).getTime() : 0;
        const dateDiff = timeB - timeA;
        if (dateDiff !== 0) return dateDiff;
        
        const stampA = a.readTimestamp || parseInt(a.id);
        const stampB = b.readTimestamp || parseInt(b.id);
        return stampB - stampA;
    });
    readBooks.forEach((b, i) => b.originalNumber = readBooks.length - i);

    // 2. 未読リストの準備
    let unreadBooks = books.filter(b => b.status === 'unread').sort((a, b) => a.order - b.order);
    if (isUnreadReversed) unreadBooks.reverse();
    unreadBooks.forEach(b => b.originalNumber = b.order + 1);

    // 3. 検索処理
    const isSearchActive = searchQuery !== '';
    if (isSearchActive) {
        const matchedRead = readBooks.filter(b => b.title.toLowerCase().includes(searchQuery));
        const unmatchedRead = readBooks.filter(b => !b.title.toLowerCase().includes(searchQuery));
        matchedRead.forEach(b => b.isMatched = true);
        unmatchedRead.forEach(b => b.isMatched = false);
        readBooks = [...matchedRead, ...unmatchedRead];

        const matchedUnread = unreadBooks.filter(b => b.title.toLowerCase().includes(searchQuery));
        const unmatchedUnread = unreadBooks.filter(b => !b.title.toLowerCase().includes(searchQuery));
        matchedUnread.forEach(b => b.isMatched = true);
        unmatchedUnread.forEach(b => b.isMatched = false);
        unreadBooks = [...matchedUnread, ...unmatchedUnread];
    } else {
        readBooks.forEach(b => b.isMatched = false);
        unreadBooks.forEach(b => b.isMatched = false);
    }

    const createListItemHTML = (book, extraInfo, isUnread) => `
        <span>
            ${(isUnread && !isSearchActive) ? '<span class="drag-handle">≡</span>' : ''}
            <span class="book-number">${book.originalNumber}.</span> 
            ${book.title} ${extraInfo}
        </span>
        <div class="menu-container">
            <button class="menu-btn" onclick="toggleMenu('${book.id}')">⋮</button>
            <div id="menu-${book.id}" class="dropdown-menu">
                <div onclick="openEditModal('${book.id}')">編集</div>
                <div class="delete-text" onclick="deleteBook('${book.id}')">削除</div>
            </div>
        </div>
    `;

    // 読了リスト描画
    readBooks.forEach(book => {
        const li = document.createElement('li');
        if (book.isMatched) li.classList.add('highlight');
        const dateLabel = book.readDate ? `<small style="margin-left:5px;">(読了: ${book.readDate})</small>` : '';
        li.innerHTML = createListItemHTML(book, dateLabel, false);
        readList.appendChild(li);
    });

    // 未読リスト描画
    unreadBooks.forEach(book => {
        const li = document.createElement('li');
        li.className = 'unread-item';
        if (book.isMatched) li.classList.add('highlight');
        
        if (!isSearchActive) {
            li.draggable = true;
            li.addEventListener('dragstart', (e) => handleDragStart(e, book.id));
            li.addEventListener('dragover', handleDragOverUnread);
            li.addEventListener('drop', (e) => handleDropUnread(e, book.id));
        } else {
            li.style.cursor = 'default';
        }
        
        li.innerHTML = createListItemHTML(book, "", true);
        unreadList.appendChild(li);
    });
}

// 初回実行
renderBooks();