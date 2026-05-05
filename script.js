//=====EXPOSED.JS=====
// ===== SMALL HELPER FUNCTIONS (SHORTCUTS & SAFETY) =====

// esc = escape function → makes sure users can't inject HTML like <script>
const esc = s => 
  s.replace(/&/g,'&amp;')   // replace & with safe version
   .replace(/</g,'&lt;')    // replace < so it doesn't become HTML
   .replace(/>/g,'&gt;')    // replace > so it doesn't break layout
   .replace(/"/g,'&quot;'); // replace " to avoid attribute breaking

// fmt = format today's date nicely (e.g. 05 May 2026)
const fmt = () => 
  new Date().toLocaleDateString('en-GB', {
    day:'2-digit',        // 05
    month:'short',        // May
    year:'numeric'        // 2026
  });

// $ = shortcut for document.getElementById (less typing)
const $ = id => document.getElementById(id);



// ===== LOAD & SAVE DATA (LOCAL STORAGE) =====

// get saved posts from browser storage OR start with empty list
let posts = JSON.parse(localStorage.getItem('ms_posts') || '[]');

// save posts into browser storage so they don't disappear on refresh
const save = () => {
  try {
    localStorage.setItem('ms_posts', JSON.stringify(posts)); // convert to string & save
  } catch(e) {} // ignore errors (like storage full)
};



// ===== HANDLE FILE UPLOADS (IMAGES & VIDEOS) =====

function handleFiles(files) {

  // loop through all selected files
  Array.from(files).forEach(file => {

    const reader = new FileReader(); // tool to read files

    // when file is loaded
    reader.onload = e => {

      // create a new post object and put it at the top
      posts.unshift({
        id: Date.now() + Math.random(), // unique id
        name: file.name,                // file name
        type: file.type.startsWith('video') ? 'video' : 'image', // check if video
        date: fmt(),                   // today's date
        applauded: false,             // not liked yet
        claps: 0,                     // no likes yet
        comments: [],                 // empty comments list
        src: e.target.result          // actual file data
      });

      save();        // save to storage
      renderFeed();  // update UI
    };

    reader.readAsDataURL(file); // convert file to usable format
  });
}



// ===== DRAG & DROP AREA =====

const zone = $('uploadZone'); // get upload area

// when dragging over → prevent default & add style
zone.addEventListener('dragover', e => {
  e.preventDefault();
  zone.classList.add('dragover');
});

// when leaving → remove style
zone.addEventListener('dragleave', () => 
  zone.classList.remove('dragover')
);

// when dropping files → handle them
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files); // process files
});



// ===== CREATE A POST CARD (UI) =====

function makeCard(p, i, readonly) {

  const card = document.createElement('div'); // create container
  card.className = 'post-card';               // add style class

  // delay animation slightly for each card
  card.style.animationDelay = (i * 0.06) + 's';

  // build the HTML inside the card
  card.innerHTML = `
    <div class="media-wrap">

      ${p.type === 'video'
        ? `<video src="${p.src}" controls></video>`  // show video
        : `<img src="${p.src}" alt="${p.name}" loading="lazy">` // show image
      }

      <span class="media-type-badge">${p.type}</span>

      ${!readonly 
        ? `<button class="delete-btn" onclick="deletePost('${p.id}')">✕</button>` // delete button
        : ''
      }

    </div>

    <div class="post-body">

      <div class="post-meta">${p.name} · ${p.date}</div>

      <div class="action-row">

        <button class="applaud-btn ${p.applauded ? 'applauded' : ''}" 
          onclick="toggleApplaud('${p.id}', this)">

          <span class="clap-icon">👏</span>

          <span class="clap-text">
            ${p.applauded ? '👏 Applauded' : '👏 Applaud'}
          </span>

          <span class="clap-count">${p.claps || ''}</span>

        </button>

      </div>

      <div class="comments-section" id="comments-${p.id}">
        ${p.comments.map(c => `
          <div class="comment-item">
            <div class="comment-dot"></div>
            <div class="comment-bubble">${esc(c)}</div>
          </div>
        `).join('')}
      </div>

      <div class="comment-input-row">

        <input class="comment-input" 
          type="text" 
          placeholder="Add a comment…" 
          id="cinput-${p.id}" 

          onkeydown="
            if(event.key==='Enter') 
              submitComment('${p.id}')
          ">

        <button class="comment-submit" 
          onclick="submitComment('${p.id}')">
          Post
        </button>

      </div>

    </div>
  `;

  return card; // return finished card
}



// ===== SHOW ALL POSTS =====

function renderFeed() {

  const grid = $('postsGrid');   // where posts go
  const empty = $('emptyState'); // empty message

  grid.innerHTML = ''; // clear screen

  // show/hide empty message
  empty.style.display = posts.length ? 'none' : 'block';

  // add each post to screen
  posts.forEach((p, i) => 
    grid.appendChild(makeCard(p, i))
  );
}



// ===== SHOW ONLY APPLAUDED POSTS =====

function renderApplauded() {

  const grid = $('applaudedGrid');
  const empty = $('applaudedEmpty');

  // filter only liked posts
  const list = posts.filter(p => p.applauded);

  grid.innerHTML = '';

  empty.style.display = list.length ? 'none' : 'block';

  list.forEach((p, i) => 
    grid.appendChild(makeCard(p, i, true))
  );
}



// ===== LIKE / UNLIKE (APPLAUD) =====

function toggleApplaud(id, btn) {

  const p = posts.find(p => p.id == id); // find post
  if (!p) return;

  p.applauded = !p.applauded; // toggle state

  // increase or decrease clap count
  p.claps = p.applauded 
    ? p.claps + 1 
    : Math.max(0, p.claps - 1);

  save(); // save changes

  // update button UI
  btn.classList.toggle('applauded', p.applauded);

  btn.querySelector('.clap-text').textContent =
    p.applauded ? '👏 Applauded' : '👏 Applaud';

  btn.querySelector('.clap-count').textContent =
    p.claps || '';

  // small animation
  btn.style.transform = 'scale(1.15)';
  setTimeout(() => btn.style.transform = '', 200);
}



// ===== ADD COMMENT =====

function submitComment(id) {

  const input = $('cinput-' + id); // get input box
  const text = input.value.trim(); // get text

  if (!text) return; // ignore empty

  const p = posts.find(p => p.id == id); // find post
  if (!p) return;

  p.comments.push(text); // save comment
  save();

  input.value = ''; // clear input

  // create comment element
  const div = document.createElement('div');
  div.className = 'comment-item';
  div.style.animation = 'fadeUp 0.3s ease both';

  div.innerHTML = `
    <div class="comment-dot"></div>
    <div class="comment-bubble">${esc(text)}</div>
  `;

  // add to UI
  $('comments-' + id).appendChild(div);
}



// ===== DELETE POST =====

function deletePost(id) {

  if (!confirm('Delete this post?')) return; // ask user

  // remove post from list
  posts = posts.filter(p => p.id != id);

  save();        // save changes
  renderFeed();  // refresh UI
}



// ===== SWITCH BETWEEN TABS =====

function showTab(tab) {

  // update tab buttons
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', tab === 'feed' ? i === 0 : i === 1)
  );

  // show/hide views
  $('feed-view').style.display = tab === 'feed' ? 'block' : 'none';
  $('applauded-view').style.display = tab === 'applauded' ? 'block' : 'none';

  // render applauded posts if needed
  if (tab === 'applauded') renderApplauded();
}



// ===== INITIAL LOAD =====

// show today's date in footer
$('foot-date').textContent = fmt();

// load posts on page start
renderFeed();
