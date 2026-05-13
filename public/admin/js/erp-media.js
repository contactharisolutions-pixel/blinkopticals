'use strict';
/**
 * erp-media.js — Advanced Media Library
 * List view · Robust thumbnail · One-click select · Upload · Rename · Delete
 */

window.mediaState = {
    folder: 'all',
    data:   [],
    mode:   'library',
    search: '',
    type:   'all',
    targetInput:   null,
    targetPreview: null,
    targetModule:  'general'
};

/* ─────────────────────── MAIN VIEW ─────────────────────── */
window.load_media = async function(folder) {
    folder = folder || 'all';
    const el = document.getElementById('view-media');
    if (!el) return;

    window.mediaState.mode   = 'library';
    window.mediaState.folder = folder;
    window.mediaState.search = '';
    window.mediaState.type   = 'all';

    el.innerHTML = `
    <div style="display:flex; height:calc(100vh - 120px); background:#fff; border-radius:16px; border:1px solid var(--border); overflow:hidden;">

        <!-- Sidebar -->
        <aside style="width:260px; min-width:260px; background:#f8fafc; border-right:1px solid var(--border); display:flex; flex-direction:column;">
            <div style="padding:24px 20px 12px; font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); display:flex; justify-content:space-between; align-items:center;">
                Folders
                <button onclick="fetchFolders()" style="background:none; border:none; cursor:pointer; color:var(--accent);"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div style="flex:1; overflow-y:auto; padding:0 12px; display:flex; flex-direction:column; gap:5px;">
                <button id="mf-all" class="media-folder-item active" onclick="switchMediaFolder('all')">
                    <i class="fas fa-layer-group"></i> <span>All Media</span>
                </button>
                <div id="custom-folders" style="display:flex; flex-direction:column; gap:5px;"></div>
            </div>
            <div style="padding:20px; border-top:1px solid var(--border); background:#fff;">
                <button class="btn btn-primary" style="width:100%; font-size:0.85rem; border-radius:10px;" onclick="showCreateFolderModal()">
                    <i class="fas fa-plus-circle"></i> New Folder
                </button>
            </div>
        </aside>

        <!-- Main content -->
        <main style="flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; background:#fff;">

            <!-- Toolbar -->
            <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:16px; background:#fff; flex-shrink:0;">
                <div style="position:relative; flex:1; max-width:350px;">
                    <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:0.9rem;"></i>
                    <input id="media-search-box" type="text" class="filter-input" placeholder="Search files, tags..." style="padding-left:42px; width:100%; height:44px; border-radius:12px;"
                        oninput="mediaSearchDebounce(this.value)">
                </div>
                <select class="filter-input" style="width:140px; height:44px; border-radius:12px;" onchange="window.mediaState.type=this.value; fetchMedia()">
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="document">Documents</option>
                </select>
                
                <div style="margin-left:auto; display:flex; gap:12px; align-items:center;">
                    <button id="media-bulk-delete-btn" class="btn btn-danger" style="display:none; font-size:0.85rem; height:44px; padding:0 20px; border-radius:12px;" onclick="bulkDeleteMedia()">
                        <i class="fas fa-trash-alt"></i> Delete Selected
                    </button>
                    <span id="media-count-badge" style="font-size:0.85rem; color:var(--muted); font-weight:600; margin-right:8px;"></span>
                    
                    <div id="upload-progress-container" style="display:none; align-items:center; gap:12px; padding:0 15px; background:#f1f5f9; border-radius:12px; height:44px;">
                        <span id="upload-progress-text" style="font-size:0.8rem; color:var(--muted); font-weight:700;"></span>
                        <div style="width:100px; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                            <div id="upload-progress-bar" style="width:0%; height:100%; background:var(--accent); transition:width 0.2s;"></div>
                        </div>
                    </div>
                    
                    <input type="file" id="media-upload-input" multiple hidden onchange="handleMediaUpload(this)">
                    <button class="btn btn-primary" style="height:44px; padding:0 24px; border-radius:12px; font-weight:700;" onclick="document.getElementById('media-upload-input').click()">
                        <i class="fas fa-cloud-upload-alt"></i> Upload Files
                    </button>
                </div>
            </div>

            <!-- List table header -->
            <div id="media-list-header" style="display:grid; grid-template-columns:48px 80px 1fr 110px 100px 130px 140px; align-items:center; padding:12px 24px; background:#f8fafc; border-bottom:1px solid var(--border); font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--muted); flex-shrink:0;">
                <div style="display:flex; align-items:center;">
                    <input type="checkbox" id="media-select-all" onclick="toggleAllMedia(this.checked)" style="cursor:pointer; width:18px; height:18px;">
                </div>
                <div>Preview</div>
                <div>File Name</div>
                <div>Type</div>
                <div>Size</div>
                <div>Uploaded</div>
                <div style="text-align:right;">Actions</div>
            </div>

            <!-- List body -->
            <div id="media-list" style="flex:1; overflow-y:auto; scroll-behavior:smooth;"></div>
        </main>

        <style>
            .media-folder-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                font-size: 0.9rem;
                font-weight: 600;
                color: #475569;
                cursor: pointer;
                border-radius: 12px;
                transition: 0.2s;
            }
            .media-folder-item:hover { background: rgba(0,0,0,0.03); color: #000; }
            .media-folder-item.active { background: #fff; color: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .media-folder-item i { font-size: 1.1rem; opacity: 0.7; }
            .media-folder-item.active i { opacity: 1; color: var(--accent); }
            
            .media-row {
                display: grid;
                grid-template-columns: 48px 80px 1fr 110px 100px 130px 140px;
                align-items: center;
                padding: 14px 24px;
                background: #fff;
                border-bottom: 1px solid #f1f5f9;
                transition: background .15s;
            }
            .media-row:hover { background: #f8fafc; }
            .media-row.selected { background: #f0fdf4; }
        </style>
    </div>`;

    fetchFolders();
    fetchMedia();
};

/* ─────────────────────── FOLDERS ─────────────────────── */
window.switchMediaFolder = function(id) {
    window.mediaState.folder = id;
    document.querySelectorAll('.media-folder-item').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(id === 'all' ? 'mf-all' : `mf-${id}`);
    if (btn) btn.classList.add('active');
    fetchMedia();
};

async function fetchFolders() {
    try {
        const res = await api(`/api/media/folders?business_id=${BIZ}`);
        const c = document.getElementById('custom-folders');
        if (!res.success || !c) return;
        c.innerHTML = res.folders.map(f => `
            <button id="mf-${f.id}" class="media-folder-item ${window.mediaState.folder === f.id ? 'active' : ''}"
                onclick="switchMediaFolder('${f.id}')">
                <i class="fas fa-folder"></i> <span>${f.folder_name}</span>
            </button>`).join('');
    } catch(e) { console.error('folders error', e); }
}

window.showCreateFolderModal = function() {
    openModal('Create New Folder', `
        <div style="padding:10px 0;">
            <p style="font-size:0.9rem; color:var(--muted); margin-bottom:20px;">Organize your media assets by creating a dedicated folder.</p>
            <div class="form-group" style="margin-bottom:24px;">
                <label style="display:block; margin-bottom:8px; font-weight:700; font-size:0.85rem;">Folder Name</label>
                <input id="new-folder-name" class="filter-input" placeholder="e.g. Summer Collection, Store Banners..." style="width:100%; height:46px; border-radius:10px;"
                    onkeydown="if(event.key==='Enter') saveNewFolder()">
            </div>
            <div style="display:flex; gap:12px; justify-content:flex-end;">
                <button class="btn btn-outline" onclick="closeModal()" style="padding:0 24px; height:44px; border-radius:10px;">Cancel</button>
                <button class="btn btn-primary" onclick="saveNewFolder()" style="padding:0 24px; height:44px; border-radius:10px;"><i class="fas fa-folder-plus"></i> Create Folder</button>
            </div>
        </div>`);
    setTimeout(() => document.getElementById('new-folder-name')?.focus(), 150);
};

window.saveNewFolder = async function() {
    const inp = document.getElementById('new-folder-name');
    const name = (inp?.value || '').trim();
    if (!name) { inp && (inp.style.borderColor = 'var(--danger)'); return; }
    try {
        const r = await postAPI('/api/media/folders', { business_id: BIZ, folder_name: name });
        if (r.success) { 
            toast('Folder created successfully!', 'success'); 
            closeModal(); 
            fetchFolders(); 
        } else {
            toast(r.error || 'Failed to create folder', 'error');
        }
    } catch(e) { toast('Network connection error', 'error'); }
};

/* ─────────────────────── FETCH & RENDER ─────────────────────── */
let _mediaSearchTimer = null;
window.mediaSearchDebounce = function(val) {
    clearTimeout(_mediaSearchTimer);
    _mediaSearchTimer = setTimeout(() => { window.mediaState.search = val; fetchMedia(); }, 350);
};

async function fetchMedia() {
    const list = document.getElementById('media-list');
    if (!list) return;
    list.innerHTML = `<div style="text-align:center; padding:80px; color:var(--muted);"><div class="spinner" style="width:40px; height:40px; border-width:4px;"></div><div style="margin-top:15px; font-size:0.85rem; font-weight:600;">Loading assets...</div></div>`;

    const { folder, search, type } = window.mediaState;
    const q = new URLSearchParams({ business_id: BIZ });
    if (folder && folder !== 'all') q.append('folder_id', folder);
    if (search)                    q.append('search', search);
    if (type && type !== 'all')    q.append('type', type);

    try {
        const res = await api(`/api/media?${q}`);
        if (!res.success) {
            list.innerHTML = `<div style="text-align:center; padding:80px; color:var(--danger);">
                <i class="fas fa-exclamation-circle" style="font-size:3rem; margin-bottom:15px; display:block; opacity:0.5;"></i>
                <div style="font-size:1.1rem; font-weight:800; margin-bottom:5px;">Unable to load library</div>
                <div style="font-size:0.9rem; opacity:0.8;">${res.error || 'Server error'}</div>
                <button class="btn btn-outline" style="margin-top:20px;" onclick="fetchMedia()">Try Again</button>
            </div>`;
            return;
        }
        window.mediaState.data = res.data;
        const badge = document.getElementById('media-count-badge');
        if (badge) badge.textContent = `${res.data.length} item${res.data.length !== 1 ? 's' : ''}`;
        renderList(res.data);
    } catch(e) {
        list.innerHTML = `<div style="text-align:center; padding:80px; color:var(--danger);"><i class="fas fa-wifi" style="font-size:3rem; margin-bottom:15px; display:block; opacity:0.5;"></i>Network connection lost</div>`;
    }
}

function renderList(data) {
    const list = document.getElementById('media-list');
    if (!list) return;

    if (!data || !data.length) {
        list.innerHTML = `
        <div style="text-align:center; padding:120px 20px; color:var(--muted); background:#fafafa; margin:20px; border-radius:20px; border:2px dashed var(--border);">
            <div style="width:80px; height:80px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 25px; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                <i class="fas fa-images" style="font-size:2.5rem; opacity:0.3; color:var(--muted);"></i>
            </div>
            <div style="font-size:1.2rem; font-weight:800; color:#1e293b; margin-bottom:8px;">Your library is empty</div>
            <div style="font-size:0.95rem; opacity:0.6; max-width:400px; margin:0 auto 30px;">Upload images, videos or documents to start organizing your store's media assets.</div>
            <button class="btn btn-primary" style="padding:0 30px; height:46px; border-radius:12px; font-weight:700;" onclick="document.getElementById('media-upload-input').click()">
                <i class="fas fa-plus"></i> Upload First Asset
            </button>
        </div>`;
        return;
    }

    list.innerHTML = data.map((m, i) => {
        const thumb   = m.thumbnail_url || m.file_url || '';
        const isImg   = m.file_type === 'image';
        const isVid   = m.file_type === 'video';
        const kb      = m.size ? (m.size > 1024*1024 ? (m.size/1024/1024).toFixed(1)+' MB' : (m.size/1024).toFixed(1)+' KB') : '—';
        const date    = m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

        const thumbHtml = isImg
            ? `<div style="width:56px; height:56px; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; background:#f1f5f9; display:flex; align-items:center; justify-content:center; position:relative;">
                <img src="${thumb}" style="width:100%; height:100%; object-fit:cover; display:block;"
                     onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\'fas fa-image\' style=\'color:#94a3b8; font-size:1.2rem;\'></i>';">
               </div>`
            : isVid
            ? `<div style="width:56px; height:56px; border-radius:10px; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center;">
                   <i class="fas fa-play-circle" style="color:var(--accent); font-size:1.8rem;"></i>
               </div>`
            : `<div style="width:56px; height:56px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
                   <i class="fas fa-file-alt" style="color:#94a3b8; font-size:1.4rem;"></i>
               </div>`;

        const typeBadge = `<span style="padding:4px 10px; border-radius:30px; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;
            background:${isImg ? '#dcfce7' : isVid ? '#dbeafe' : '#f1f5f9'};
            color:${isImg ? '#15803d' : isVid ? '#1d4ed8' : '#475569'};">${m.file_type}</span>`;

        if (window.mediaState.mode === 'selector') {
            return `
            <div id="ml-row-${m.id}" style="display:grid; grid-template-columns:70px 1fr 100px 120px; align-items:center; padding:10px 20px; border-bottom:1px solid var(--border); transition:background .15s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <div style="display:flex; align-items:center;">${thumbHtml}</div>
                <div style="padding-right:15px; min-width:0;">
                    <div style="font-size:0.85rem; font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${m.file_name}">${m.file_name}</div>
                    <div style="font-size:0.7rem; color:var(--muted); margin-top:2px;">${kb} &middot; ${date}</div>
                </div>
                <div>${typeBadge}</div>
                <div style="text-align:right;">
                    <button type="button" onclick="selectMediaItem('${m.id}')" class="btn btn-sm btn-primary" style="font-weight:700; border-radius:8px; padding:6px 12px; height:auto;">Select Asset</button>
                </div>
            </div>`;
        }

        const actionBtns = `
            <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end;">
                <button title="Preview" onclick="previewMediaItem('${m.id}')" class="media-action-btn" style="color:var(--accent);">
                    <i class="fas fa-eye"></i>
                </button>
                <button title="Rename" onclick="openInlineRename('${m.id}')" class="media-action-btn">
                    <i class="fas fa-pen"></i>
                </button>
                <input type="file" id="rpl-${m.id}" hidden onchange="replaceMediaItem('${m.id}', this)">
                <button title="Replace" onclick="document.getElementById('rpl-${m.id}').click()" class="media-action-btn">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <a href="${m.file_url}" download="${m.file_name}" title="Download" class="media-action-btn" style="text-decoration:none;">
                    <i class="fas fa-download"></i>
                </a>
                <button title="Delete" onclick="deleteMediaItem('${m.id}')" class="media-action-btn" style="color:#ef4444;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`;

        return `
        <div id="ml-row-${m.id}" class="media-row">
            <div style="display:flex; align-items:center;">
                <input type="checkbox" class="media-row-checkbox" value="${m.id}" onclick="updateMediaBulkActions()" style="cursor:pointer; width:18px; height:18px; border-radius:4px;">
            </div>
            <div style="display:flex; align-items:center;">${thumbHtml}</div>
            <div style="padding-right:20px; min-width:0;">
                <div id="ml-name-${m.id}" style="font-size:0.9rem; font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;"
                    title="${m.file_name}" ondblclick="openInlineRename('${m.id}')">${m.file_name}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:3px; font-weight:500;">${m.width && m.height ? m.width + ' × ' + m.height + ' px' : 'Document Asset'}</div>
            </div>
            <div>${typeBadge}</div>
            <div style="font-size:0.85rem; color:var(--muted); font-weight:600;">${kb}</div>
            <div style="font-size:0.85rem; color:var(--muted); font-weight:500;">${date}</div>
            <div>${actionBtns}</div>
        </div>`;
    }).join('');
    
    // Add action btn styles
    if (!document.getElementById('media-custom-styles')) {
        const s = document.createElement('style');
        s.id = 'media-custom-styles';
        s.textContent = `
            .media-action-btn { background:none; border:none; cursor:pointer; color:var(--muted); font-size:1rem; padding:8px; border-radius:8px; transition:0.2s; display:inline-flex; align-items:center; justify-content:center; }
            .media-action-btn:hover { background:rgba(0,0,0,0.05); color:#000; transform:translateY(-1px); }
        `;
        document.head.appendChild(s);
    }
}

/* ─────────────────────── UPLOAD ─────────────────────── */
window.handleMediaUpload = async function(input) {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    
    const cont = document.getElementById('upload-progress-container');
    const progText = document.getElementById('upload-progress-text');
    const progBar = document.getElementById('upload-progress-bar');
    
    let done = 0;
    let successCount = 0;
    
    if (cont) cont.style.display = 'flex';
    if (progText) progText.textContent = `Uploading 0 / ${files.length}`;
    if (progBar) { progBar.style.width = `0%`; progBar.style.background = 'var(--accent)'; }

    for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('business_id', BIZ);
        fd.append('module_name', 'gallery');
        if (window.mediaState.folder && window.mediaState.folder !== 'all')
            fd.append('folder_id', window.mediaState.folder);
            
        try {
            const r = await fetch('/api/media/upload', { method:'POST', body:fd }).then(res => res.json());
            done++;
            if (r.success) {
                successCount++;
            } else {
                toast(`❌ ${file.name}: ${r.error}`, 'error');
            }
        } catch(e) {
            done++;
            toast(`❌ ${file.name}: connection lost`, 'error');
        }
        
        if (progText) progText.textContent = `Uploading ${done} / ${files.length}`;
        if (progBar) progBar.style.width = `${(done / files.length) * 100}%`;
    }

    input.value = '';
    
    if (successCount > 0) {
        toast(`${successCount} file(s) added to your library!`, 'success');
        if (progText) progText.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> All Sync'd`;
        if (progBar) progBar.style.background = '#10b981';
    }

    setTimeout(() => { 
        if (cont) cont.style.display = 'none'; 
    }, 4000);

    fetchMedia();
};

/* ─────────────────────── INLINE RENAME ─────────────────────── */
window.openInlineRename = function(id) {
    const m = window.mediaState.data.find(x => x.id === id);
    if (!m) return;
    const nameEl = document.getElementById(`ml-name-${id}`);
    if (!nameEl) return;
    const oldName = m.file_name;
    nameEl.innerHTML = `
        <input id="inline-rename-${id}" type="text" value="${oldName}"
            style="width:100%; font-size:0.9rem; font-weight:700; border:2px solid var(--accent); border-radius:8px; padding:6px 12px; outline:none; color:#000; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.1);"
            onkeydown="if(event.key==='Enter'){event.preventDefault(); commitRename('${id}', '${oldName}');} if(event.key==='Escape'){restoreNameEl('${id}','${oldName}');}">
        <div style="font-size:0.65rem; color:var(--muted); margin-top:4px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Press Enter to save · Esc to cancel</div>`;
    const inp = document.getElementById(`inline-rename-${id}`);
    if (inp) { 
        inp.focus(); 
        inp.select(); 
        inp.addEventListener('blur', (e) => {
            // Delay to allow Enter key to fire first
            setTimeout(() => { if (document.getElementById(`inline-rename-${id}`)) commitRename(id, oldName); }, 200);
        });
    }
};

window.restoreNameEl = function(id, name) {
    const el = document.getElementById(`ml-name-${id}`);
    if (el) el.innerHTML = name;
};

window.commitRename = async function(id, oldName) {
    const inp = document.getElementById(`inline-rename-${id}`);
    if (!inp) return;
    const newName = (inp.value || '').trim();
    if (!newName || newName === oldName) { restoreNameEl(id, oldName); return; }
    try {
        const r = await putAPI(`/api/media/${id}/rename`, { file_name: newName });
        if (r.success) {
            toast('File renamed!', 'success');
            const m = window.mediaState.data.find(x => x.id === id);
            if (m) m.file_name = newName;
            const el = document.getElementById(`ml-name-${id}`);
            if (el) { el.textContent = newName; el.title = newName; }
        } else {
            toast(r.error || 'Rename failed', 'error');
            restoreNameEl(id, oldName);
        }
    } catch(e) {
        toast('Network error', 'error');
        restoreNameEl(id, oldName);
    }
};

/* ─────────────────────── PREVIEW MODAL ─────────────────────── */
window.previewMediaItem = function(id) {
    const m = window.mediaState.data.find(x => x.id === id);
    if (!m) return;
    const tags = (() => { try { return typeof m.tags === 'string' ? JSON.parse(m.tags) : (m.tags || []); } catch(e) { return []; }})();

    openModal('Asset Intelligence', `
        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:32px; min-height:450px;">

            <!-- Preview pane -->
            <div style="background:#f8fafc; border-radius:20px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative;">
                ${m.file_type === 'image'
                    ? `<img src="${m.file_url}"
                           style="max-width:100%; max-height:450px; object-fit:contain; display:block; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.1));"
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div style="display:none; flex-direction:column; align-items:center; gap:15px; color:#94a3b8; padding:40px;">
                           <i class="fas fa-image" style="font-size:4rem; opacity:0.3;"></i>
                           <span style="font-weight:700;">Image format unsupported</span>
                       </div>`
                    : m.file_type === 'video'
                    ? `<video controls src="${m.file_url}" style="max-width:100%; max-height:450px; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.2);"></video>`
                    : `<div style="text-align:center; padding:60px; color:#94a3b8; background:#fff; border-radius:20px; border:2px dashed #e2e8f0; width:80%;">
                           <i class="fas fa-file-invoice" style="font-size:5rem; margin-bottom:20px; display:block; opacity:0.3;"></i>
                           <div style="font-weight:800; color:#1e293b; font-size:1.1rem; margin-bottom:5px;">Document Asset</div>
                           <div style="font-size:0.85rem;">${m.file_name}</div>
                       </div>`}
            </div>

            <!-- Info pane -->
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:10px;">Asset Name</div>
                    <div style="display:flex; gap:10px;">
                        <input id="preview-rename-${m.id}" type="text" value="${m.file_name}"
                            class="filter-input" style="font-weight:800; font-size:1.1rem; height:50px; border-radius:12px; flex:1;"
                            onkeydown="if(event.key==='Enter') renameFromPreview('${m.id}')">
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:#f8fafc; padding:20px; border-radius:20px; border:1px solid var(--border);">
                    <div><div style="font-size:0.65rem; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:5px;">Format</div><b style="font-size:0.95rem;">${m.file_type.toUpperCase()}</b></div>
                    <div><div style="font-size:0.65rem; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:5px;">Size</div><b style="font-size:0.95rem;">${m.size ? (m.size/1024).toFixed(1)+' KB' : '—'}</b></div>
                    <div><div style="font-size:0.65rem; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:5px;">Dimensions</div><b style="font-size:0.95rem;">${m.width ? m.width+' × '+m.height : 'N/A'}</b></div>
                    <div><div style="font-size:0.65rem; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:5px;">Uploaded</div><b style="font-size:0.95rem;">${new Date(m.created_at).toLocaleDateString('en-IN')}</b></div>
                </div>

                <div>
                    <div style="font-size:0.7rem; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">AI Metadata Tags</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${tags.length ? tags.map(t => `<span style="background:#e0f2fe; color:#0369a1; padding:6px 14px; border-radius:10px; font-size:0.8rem; font-weight:800; border:1px solid #bae6fd;">${t}</span>`).join('') : '<span style="color:var(--muted); font-size:0.9rem; font-style:italic;">No AI tags analyzed</span>'}
                    </div>
                </div>

                <div style="background:#f1f5f9; border-radius:12px; padding:12px 16px; display:flex; gap:12px; align-items:center; margin-top:auto;">
                    <input type="text" value="${m.file_url}" readonly style="flex:1; font-size:0.75rem; border:none; background:transparent; color:#475569; outline:none; font-family:monospace; font-weight:600;">
                    <button class="btn btn-sm btn-outline" style="height:34px; width:34px; display:flex; align-items:center; justify-content:center; border-radius:8px;" onclick="navigator.clipboard.writeText('${m.file_url}').then(()=>toast('Public URL Copied!','success'))">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <button class="btn btn-primary" style="height:48px; border-radius:12px; font-weight:700;" onclick="renameFromPreview('${m.id}')">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button class="btn btn-danger" style="height:48px; border-radius:12px; font-weight:700;" onclick="deleteMediaItem('${m.id}')">
                        <i class="fas fa-trash-alt"></i> Delete Asset
                    </button>
                </div>
            </div>
        </div>
    `, 'modal-lg');
};

window.renameFromPreview = async function(id) {
    const inp = document.getElementById(`preview-rename-${id}`);
    if (!inp) return;
    const newName = inp.value.trim();
    if (!newName) return;
    try {
        const r = await putAPI(`/api/media/${id}/rename`, { file_name: newName });
        if (r.success) {
            toast('Asset renamed successfully!', 'success');
            const m = window.mediaState.data.find(x => x.id === id);
            if (m) m.file_name = newName;
            const el = document.getElementById(`ml-name-${id}`);
            if (el) { el.textContent = newName; el.title = newName; }
        } else toast(r.error || 'Update failed', 'error');
    } catch(e) { toast('Network error', 'error'); }
};

/* ─────────────────────── ACTIONS ─────────────────────── */
window.replaceMediaItem = async function(id, input) {
    if (!input.files.length) return;
    if (!confirm('Replace this file globally? All links to this asset will update automatically.')) return;
    toast('Processing replacement...', 'info');
    const fd = new FormData();
    fd.append('file', input.files[0]);
    try {
        const r = await fetch(`/api/media/replace/${id}`, { method:'POST', body:fd }).then(res => res.json());
        if (r.success) { 
            toast('Asset replaced successfully!', 'success'); 
            closeModal(); 
            fetchMedia(); 
        } else {
            toast(r.error || 'Replacement failed', 'error');
        }
    } catch(e) { toast('Network error', 'error'); }
};

window.deleteMediaItem = async function(id) {
    if (!confirm('Delete permanently? This will break any existing links to this asset.')) return;
    try {
        const r = await api(`/api/media/${id}`, { method:'DELETE' });
        if (r.success) {
            toast('Asset removed!', 'success');
            closeModal();
            const row = document.getElementById(`ml-row-${id}`);
            if (row) row.style.opacity = '0.3';
            setTimeout(fetchMedia, 500);
        } else toast(r.error || 'Delete failed', 'error');
    } catch(e) { toast('Network error', 'error'); }
};

window.toggleAllMedia = function(checked) {
    document.querySelectorAll('.media-row-checkbox').forEach(cb => {
        cb.checked = checked;
        const row = document.getElementById(`ml-row-${cb.value}`);
        if (row) checked ? row.classList.add('selected') : row.classList.remove('selected');
    });
    updateMediaBulkActions();
};

window.updateMediaBulkActions = function() {
    const checked = Array.from(document.querySelectorAll('.media-row-checkbox:checked'));
    const count = checked.length;
    const allCb = document.getElementById('media-select-all');
    const total = document.querySelectorAll('.media-row-checkbox').length;
    if (allCb) allCb.checked = (count === total && total > 0);

    checked.forEach(cb => {
        const row = document.getElementById(`ml-row-${cb.value}`);
        if (row) row.classList.add('selected');
    });
    document.querySelectorAll('.media-row-checkbox:not(:checked)').forEach(cb => {
        const row = document.getElementById(`ml-row-${cb.value}`);
        if (row) row.classList.remove('selected');
    });

    const btn = document.getElementById('media-bulk-delete-btn');
    if (btn) {
        btn.style.display = count > 0 ? 'inline-flex' : 'none';
        btn.innerHTML = `<i class="fas fa-trash-alt"></i> Delete (${count})`;
    }
};

window.bulkDeleteMedia = async function() {
    const checked = Array.from(document.querySelectorAll('.media-row-checkbox:checked')).map(cb => cb.value);
    if (!checked.length) return;
    if (!confirm(`Permanently delete ${checked.length} selected assets?`)) return;

    let successCount = 0;
    const btn = document.getElementById('media-bulk-delete-btn');
    if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Purging...`;

    for (const id of checked) {
        try {
            const r = await api(`/api/media/${id}`, { method: 'DELETE' });
            if (r.success) successCount++;
        } catch(e) {}
    }
    
    toast(`Purge complete: ${successCount} assets removed.`, successCount === checked.length ? 'success' : 'warning');
    fetchMedia();
};

/* ─────────────────────── SELECTOR MODE (FOR OTHER MODULES) ─────────────────────── */
window.openMediaSelector = function(inputId, previewBoxId, moduleName) {
    moduleName = moduleName || 'general';
    window.mediaState.mode          = 'selector';
    window.mediaState.targetInput   = inputId;
    window.mediaState.targetPreview = previewBoxId;
    window.mediaState.targetModule  = moduleName;

    openModal('Universal Media Picker', `
        <div style="height:70vh; display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; gap:12px; align-items:center; flex-shrink:0; padding-bottom:5px;">
                <div style="position:relative; flex:1;">
                    <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted);"></i>
                    <input type="text" class="filter-input" placeholder="Find in library..." style="padding-left:38px; width:100%; border-radius:10px; height:40px;"
                        oninput="window.mediaState.search=this.value; fetchMedia()">
                </div>
                <select class="filter-input" style="width:120px; border-radius:10px; height:40px;" onchange="window.mediaState.type=this.value; fetchMedia()">
                    <option value="all">All</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                </select>
                <input type="file" id="sel-upload-input" multiple hidden onchange="handleMediaUpload(this)">
                <button class="btn btn-primary" style="border-radius:10px; height:40px;" onclick="document.getElementById('sel-upload-input').click()">
                    <i class="fas fa-plus"></i> Upload
                </button>
            </div>
            <!-- Simple Header -->
            <div style="display:grid; grid-template-columns:70px 1fr 100px 90px; padding:8px 20px; background:#f8fafc; border:1px solid var(--border); border-radius:10px; font-size:0.7rem; font-weight:800; text-transform:uppercase; color:var(--muted); flex-shrink:0;">
                <div>Preview</div><div>Asset Name</div><div>Type</div><div>Action</div>
            </div>
            <div id="media-list" style="flex:1; overflow-y:auto; border:1px solid var(--border); border-radius:12px;">
                <div style="text-align:center; padding:50px;"><div class="spinner"></div></div>
            </div>
        </div>
    `, 'modal-lg');

    fetchMedia();
};

window.selectMediaItem = function(id) {
    const m = window.mediaState.data.find(x => x.id === id);
    if (!m) return;
    const input   = document.getElementById(window.mediaState.targetInput);
    const preview = document.getElementById(window.mediaState.targetPreview);
    if (input)   input.value = m.file_url;
    if (preview) {
        preview.innerHTML = m.file_type === 'image'
            ? `<img src="${m.file_url}" style="width:100%; height:100%; object-fit:contain;">`
            : `<div style="display:flex; flex-direction:column; align-items:center; gap:8px; height:100%; justify-content:center;">
                 <i class="fas fa-file-alt" style="font-size:2.5rem; color:var(--muted); opacity:0.5;"></i>
                 <span style="font-size:0.6rem; font-weight:800; text-transform:uppercase;">${m.file_type}</span>
               </div>`;
        preview.classList.add('has-image');
    }
    postAPI('/api/media/usage', { media_id:id, module_name:window.mediaState.targetModule, reference_id:'new' }).catch(()=>{});
    closeModal();
    toast('Media attached!', 'success');
    window.mediaState.mode = 'library';
};
