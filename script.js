  // Load saved posts or start fresh
    let posts = JSON.parse(localStorage.getItem('ms_posts') || '[]');
    const save = () => { try { localStorage.setItem('ms_posts', JSON.stringify(posts)); } catch(e) {} };
    const find = id => posts.find(p => p.id === id);
    const esc  = s  => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 
    // Upload: read file as base64 and add to posts
    function handleFiles(files) {
      [...files].forEach(file => {
        const r = new FileReader();
        r.onload = e => {
          posts.unshift({ id: crypto.randomUUID(), name: file.name,
            type: file.type.startsWith('video') ? 'video' : 'image',
            date: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
            applauded: false, claps: 0, comments: [], src: e.target.result });
          save(); renderFeed();
        };
        r.readAsDataURL(file);
      });
    }
 
    // Drag & drop
    const zone = document.getElementById('uploadZone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
 
    // Render posts into a grid
    function renderGrid(gridId, emptyId, list) {
      const grid = document.getElementById(gridId);
      document.getElementById(emptyId).style.display = list.length ? 'none' : 'block';
      grid.innerHTML = list.map((p, i) => cardHTML(p, i, gridId === 'applaudedGrid')).join('');
    }
 
    function renderFeed()      { renderGrid('postsGrid',    'emptyState',    posts); }
    function renderApplauded() { renderGrid('applaudedGrid','applaudedEmpty', posts.filter(p => p.applauded)); }
 
    // Build card HTML as a string (simple and readable)
    function cardHTML(p, i, readonly) {
      const media    = p.type === 'video' ? `<video src="${p.src}" controls></video>` : `<img src="${p.src}" loading="lazy">`;
      const comments = p.comments.map(c => `<div class="comment-item"><div class="comment-dot"></div><div class="comment-bubble">${esc(c)}</div></div>`).join('');
      const delBtn   = readonly ? '' : `<button class="delete-btn" onclick="deletePost('${p.id}')">✕</button>`;
      return `
        <div class="post-card" style="animation-delay:${i*0.06}s">
          <div class="media-wrap">${media}<span class="media-type-badge">${p.type}</span>${delBtn}</div>
          <div class="post-body">
            <div class="post-meta">${p.name} · ${p.date}</div>
            <button class="applaud-btn ${p.applauded?'applauded':''}" onclick="toggleApplaud('${p.id}',this)">
              👏 <span>${p.applauded?'Applauded':'Applaud'}</span> <span>${p.claps||''}</span>
            </button>
            <div class="comments-section" id="comments-${p.id}">${comments}</div>
            <div class="comment-input-row">
              <input class="comment-input" id="cinput-${p.id}" placeholder="Add a comment…" onkeydown="if(event.key==='Enter')submitComment('${p.id}')">
              <button class="comment-submit" onclick="submitComment('${p.id}')">Post</button>
            </div>
          </div>
        </div>`;
    }
 
    // Applaud toggle
    function toggleApplaud(id, btn) {
      const p = find(id); if (!p) return;
      p.applauded = !p.applauded;
      p.claps += p.applauded ? 1 : -1;
      save();
      btn.classList.toggle('applauded', p.applauded);
      btn.querySelectorAll('span')[0].textContent = p.applauded ? 'Applauded' : 'Applaud';
      btn.querySelectorAll('span')[1].textContent = p.claps || '';
      btn.style.transform = 'scale(1.15)';
      setTimeout(() => btn.style.transform = '', 200);
    }
 
    // Add comment
    function submitComment(id) {
      const input = document.getElementById('cinput-' + id);
      const text = input.value.trim(); if (!text) return;
      const p = find(id); if (!p) return;
      p.comments.push(text); save(); input.value = '';
      document.getElementById('comments-' + id).insertAdjacentHTML('beforeend',
        `<div class="comment-item" style="animation:fadeUp .3s ease both"><div class="comment-dot"></div><div class="comment-bubble">${esc(text)}</div></div>`);
    }
 
    // Delete post
    function deletePost(id) {
      if (!confirm('Delete?')) return;
      posts = posts.filter(p => p.id !== id);
      save(); renderFeed();
    }
 
    // Switch tabs
    function showTab(tab) {
      document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i === (tab==='feed'?0:1)));
      document.getElementById('feed-view').style.display      = tab==='feed'      ? 'block':'none';
      document.getElementById('applauded-view').style.display = tab==='applauded' ? 'block':'none';
      if (tab === 'applauded') renderApplauded();
    }
 
    // Init
    document.getElementById('foot-date').textContent = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    renderFeed();
  


    //EXPOSED PAGE - simple static HTML with no JS, just to show the "exposed" media in a grid. The real "exposure" is that these files are accessible directly via their base64 URLs, which can be shared or viewed outside the app.
     const $ = id => document.getElementById(id);
  let all = [], filter = 'all';

  function load() {
    all = JSON.parse(localStorage.getItem('ms_posts') || '[]').filter(p => p.applauded);
    $('total-count').textContent = all.length;
    render();
  }

  function setFilter(type, btn) {
    filter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  }

  function render() {
    const list = filter === 'all' ? all : all.filter(p => p.type === filter);
    $('empty').style.display = list.length ? 'none' : 'block';
    $('gallery').innerHTML = list.map((p, i) => `
      <div class="gallery-item" style="animation-delay:${i*0.05}s" onclick="openLightbox(${i}, '${filter}')">
        ${p.type === 'video'
          ? `<video src="${p.src}" muted loop onmouseenter="this.play()" onmouseleave="this.pause()"></video><div class="video-badge">▶ video</div>`
          : `<img src="${p.src}" loading="lazy">`}
        <div class="gallery-overlay">
          <div class="overlay-name">${p.name}</div>
          <div class="overlay-meta">
            <span class="overlay-claps">👏 ${p.claps}</span>
            <span class="overlay-type">${p.type}</span>
            ${p.comments.length ? `<span class="overlay-comments">💬 ${p.comments.length}</span>` : ''}
          </div>
        </div>
      </div>`).join('');
  }

  function openLightbox(i, f) {
    const p = (f === 'all' ? all : all.filter(x => x.type === f))[i];
    $('lb-name').textContent = p.name;
    $('lb-claps').textContent = `👏 ${p.claps} clap${p.claps !== 1 ? 's' : ''}`;
    $('lb-date').textContent = p.date;
    $('lb-media').innerHTML = p.type === 'video'
      ? `<video src="${p.src}" class="lightbox-media" controls></video>`
      : `<img src="${p.src}" class="lightbox-media">`;
    $('lb-comments').innerHTML = p.comments.map(c => `<div class="lb-comment">${c}</div>`).join('');
    $('lightbox').classList.add('open');
  }

  function closeLightbox(e) {
    if (!e || e.target === $('lightbox') || e.target.classList.contains('lightbox-close')) {
      $('lightbox').classList.remove('open');
      $('lb-media').innerHTML = '';
    }
  }

  document.addEventListener('keydown', e => e.key === 'Escape' && closeLightbox());
  document.addEventListener('visibilitychange', () => !document.hidden && load());
  $('foot-date').textContent = new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
  load();

  //MOVEMENT.JS///
  
  const $ = id => document.getElementById(id);
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let posts = JSON.parse(localStorage.getItem('mv_posts') || '[]');
  let pending = [];

  const save = () => { try { localStorage.setItem('mv_posts', JSON.stringify(posts)); } catch(e) {} };

  // File picked — open modal for title/category
  function openModal(files) {
    pending = [...files];
    $('m-title').value = ''; $('m-desc').value = ''; $('m-cat').value = 'strike';
    $('modalOverlay').classList.add('open');
    $('fileInput').value = '';
  }

  function cancelModal() { pending = []; $('modalOverlay').classList.remove('open'); }

  function confirmPost() {
    const title = $('m-title').value.trim() || 'Untitled Action';
    const cat = $('m-cat').value, desc = $('m-desc').value.trim();
    $('modalOverlay').classList.remove('open');
    pending.forEach(file => {
      const r = new FileReader();
      r.onload = e => {
        posts.unshift({ id: crypto.randomUUID(), name: file.name, title, cat, desc,
          type: file.type.startsWith('video') ? 'video' : 'image',
          date: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
          applauded: false, claps: 0, comments: [], src: e.target.result });
        save(); renderFeed();
      };
      r.readAsDataURL(file);
    });
    pending = [];
  }

  // Drag & drop
  const zone = $('uploadZone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); openModal(e.dataTransfer.files); });

  function cardHTML(p, i, readonly) {
    const media = p.type === 'video' ? `<video src="${p.src}" controls></video>` : `<img src="${p.src}" loading="lazy">`;
    const comments = p.comments.map(c => `<div class="comment-item"><span class="comment-dash">—</span><span class="comment-text">${esc(c)}</span></div>`).join('');
    return `
      <div class="post-card" style="animation-delay:${i*0.07}s">
        <div class="video-wrap">${media}
          <span class="cat-badge cat-${p.cat}">${p.cat}</span>
          ${!readonly ? `<button class="delete-btn" onclick="deletePost('${p.id}')">✕</button>` : ''}
        </div>
        <div class="post-body">
          <div class="post-header">
            <div class="post-title">${esc(p.title)}</div>
            <div class="post-meta">${p.date}</div>
          </div>
          ${p.desc ? `<div class="post-desc">${esc(p.desc)}</div>` : ''}
          <button class="applaud-btn ${p.applauded?'applauded':''}" onclick="toggleApplaud('${p.id}',this)">
            ✊ <span>${p.applauded?'Applauded':'Applaud'}</span> <span>${p.claps||''}</span>
          </button>
          <div class="comments-section" id="comments-${p.id}">${comments}</div>
          <div class="comment-input-row">
            <input class="comment-input" id="cinput-${p.id}" placeholder="Speak out…" onkeydown="if(event.key==='Enter')submitComment('${p.id}')">
            <button class="comment-submit" onclick="submitComment('${p.id}')">Post</button>
          </div>
        </div>
      </div>`;
  }

  function renderGrid(gridId, emptyId, list) {
    $(emptyId).style.display = list.length ? 'none' : 'block';
    $(gridId).innerHTML = list.map((p,i) => cardHTML(p, i, gridId === 'applaudedGrid')).join('');
  }

  function renderFeed()      { renderGrid('postsGrid',    'emptyState',    posts); }
  function renderApplauded() { renderGrid('applaudedGrid','applaudedEmpty', posts.filter(p => p.applauded)); }

  function toggleApplaud(id, btn) {
    const p = posts.find(p => p.id === id); if (!p) return;
    p.applauded = !p.applauded; p.claps += p.applauded ? 1 : -1; save();
    btn.classList.toggle('applauded', p.applauded);
    btn.querySelectorAll('span')[0].textContent = p.applauded ? 'Applauded' : 'Applaud';
    btn.querySelectorAll('span')[1].textContent = p.claps || '';
    btn.style.transform = 'scale(1.12)'; setTimeout(() => btn.style.transform = '', 180);
  }

  function submitComment(id) {
    const input = $('cinput-' + id), text = input.value.trim(); if (!text) return;
    const p = posts.find(p => p.id === id); if (!p) return;
    p.comments.push(text); save(); input.value = '';
    $('comments-' + id).insertAdjacentHTML('beforeend',
      `<div class="comment-item"><span class="comment-dash">—</span><span class="comment-text">${esc(text)}</span></div>`);
  }

  function deletePost(id) {
    if (!confirm('Delete this post?')) return;
    posts = posts.filter(p => p.id !== id); save(); renderFeed();
  }

  function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i === (tab==='feed'?0:1)));
    $('feed-view').style.display      = tab === 'feed'      ? 'block' : 'none';
    $('applauded-view').style.display = tab === 'applauded' ? 'block' : 'none';
    if (tab === 'applauded') renderApplauded();
  }

  $('foot-date').textContent = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  renderFeed();