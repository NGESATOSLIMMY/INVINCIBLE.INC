// EXPOSED.JS   
    // STATE ─────────────────────────────────────────────────────────────
    // Load saved posts from localStorage (browser storage that survives page refresh)
    // If nothing saved yet, default to an empty array []
    let posts = JSON.parse(localStorage.getItem('ms_posts') || '[]');


    // SAVE ──────────────────────────────────────────────────────────────
    // Saves the current posts array to localStorage so data persists on refresh
    function save() {
      const toSave = posts.map(p => ({
        id: p.id,              // Unique ID for each post
        name: p.name,          // Original filename e.g. "photo.jpg"
        type: p.type,          // 'image' or 'video'
        date: p.date,          // Upload date as a formatted string
        applauded: p.applauded,// true or false — did you applaud this?
        claps: p.claps,        // Total number of claps given
        comments: p.comments,  // Array of comment strings
        src: p.src             // Base64 encoded file data so it persists across refreshes
      }));
      // Wrapped in try/catch because localStorage can fail if it is full (large images)
      try { localStorage.setItem('ms_posts', JSON.stringify(toSave)); } catch(e) {}
    }


    // FILE HANDLING ─────────────────────────────────────────────────────
    // Called when the user selects or drops files onto the upload zone
    function handleFiles(files) {
      Array.from(files).forEach(file => {
        // FileReader converts the raw file into a base64 string we can store and display
        const reader = new FileReader();
        reader.onload = e => {
          // Build a new post object with all the data it needs
          const post = {
            id: Date.now() + Math.random(), // Unique ID using timestamp + random number
            name: file.name,               // e.g. "my-photo.jpg"
            type: file.type.startsWith('video') ? 'video' : 'image', // Detect image vs video
            date: new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}),
            applauded: false,              // Not applauded when first uploaded
            claps: 0,                      // Zero claps to start
            comments: [],                  // No comments yet
            src: e.target.result           // The base64 encoded file data
          };
          posts.unshift(post); // Add new post to the FRONT of the array (newest first)
          save();              // Persist to localStorage
          renderFeed();        // Re-draw the feed to show the new post
        };
        reader.readAsDataURL(file); // Start reading the file as a base64 data URL
      });
    }

    // DRAG AND DROP SETUP ───────────────────────────────────────────────
    const zone = document.getElementById('uploadZone');

    // When a file is dragged over the zone — preventDefault stops browser from opening the file
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });

    // When the dragged file leaves the zone — remove the highlighted green style
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

    // When a file is actually dropped — process it like a normal file selection
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files); // e.dataTransfer.files = the dropped files
    });


    // RENDER FEED ───────────────────────────────────────────────────────
    // Draws all posts into the #postsGrid element
    function renderFeed() {
      const grid = document.getElementById('postsGrid');
      const empty = document.getElementById('emptyState');
      grid.innerHTML = ''; // Clear existing cards before re-drawing from scratch
      if (posts.length === 0) { empty.style.display = 'block'; return; } // Show empty state
      empty.style.display = 'none'; // Hide empty state if there are posts
      posts.forEach((p, i) => grid.appendChild(makeCard(p, i))); // Build a card for each post
    }

    // RENDER APPLAUDED ──────────────────────────────────────────────────
    // Draws only the applauded posts into the #applaudedGrid element
    function renderApplauded() {
      const grid = document.getElementById('applaudedGrid');
      const empty = document.getElementById('applaudedEmpty');
      const applauded = posts.filter(p => p.applauded); // Keep only posts where applauded = true
      grid.innerHTML = '';
      if (applauded.length === 0) { empty.style.display = 'block'; return; }
      empty.style.display = 'none';
      applauded.forEach((p, i) => grid.appendChild(makeCard(p, i, true)));
      // true = readonly mode, which hides the delete button on this view
    }


    // MAKE CARD ─────────────────────────────────────────────────────────
    // Builds and returns one post card as a DOM element
    function makeCard(p, i, readonly) {
      const card = document.createElement('div'); // Create a new <div> element
      card.className = 'post-card';
      card.style.animationDelay = (i * 0.06) + 's'; // Stagger animation: each card is delayed a little more

      // Choose the right media element based on file type
      const media = p.type === 'video'
        ? `<video src="${p.src}" controls></video>`         // Video with built-in playback controls
        : `<img src="${p.src}" alt="${p.name}" loading="lazy">`; // Image (lazy = only loads when visible)

      // Build the HTML for all existing comments on this post
      const comments = p.comments.map((c) => {
        return `<div class="comment-item">
                  <div class="comment-dot"></div>
                  <div class="comment-bubble">${escHtml(c)}</div>
                </div>`;
      }).join(''); // .join('') merges the array into one HTML string

      // Button appearance depends on whether this post is already applauded
      const applaudClass = p.applauded ? 'applauded' : ''; // Extra CSS class when applauded
      const clapLabel = p.applauded ? '👏 Applauded' : '👏 Applaud'; // Different label text

      // Fill the card with all its HTML
      card.innerHTML = `
        <div class="media-wrap">
          ${media}
          <span class="media-type-badge">${p.type}</span>
          ${!readonly ? `<button class="delete-btn" onclick="deletePost('${p.id}')" title="Delete">✕</button>` : ''}
          <!-- Delete button is only rendered in feed view, not in the readonly applauded view -->
        </div>
        <div class="post-body">
          <div class="post-meta">${p.name} &nbsp;·&nbsp; ${p.date}</div>
          <!-- Shows filename and date e.g. "photo.jpg · 05 May 2026" -->

          <div class="action-row">
            <!-- Applaud button: calls toggleApplaud() with this post's unique ID -->
            <button class="applaud-btn ${applaudClass}" onclick="toggleApplaud('${p.id}', this)">
              <span class="clap-icon">👏</span>
              <span class="clap-text">${clapLabel}</span>
              <span class="clap-count">${p.claps > 0 ? p.claps : ''}</span>
              <!-- Clap count only displayed if it is greater than zero -->
            </button>
          </div>

          <div class="comments-section" id="comments-${p.id}">
            ${comments}
            <!-- Existing comments are rendered here -->
          </div>

          <div class="comment-input-row">
            <input class="comment-input" type="text"
              placeholder="Add a comment…"
              id="cinput-${p.id}"
              onkeydown="if(event.key==='Enter') submitComment('${p.id}')">
            <!-- Pressing Enter calls submitComment() — same as clicking Post -->

            <button class="comment-submit" onclick="submitComment('${p.id}')">Post</button>
          </div>
        </div>
      `;
      return card; // Return the completed card element so it can be added to the grid
    }


    // TOGGLE APPLAUD ────────────────────────────────────────────────────
    // Called when the applaud button is clicked on any post
    function toggleApplaud(id, btn) {
      const post = posts.find(p => p.id == id); // Find the matching post by ID
      if (!post) return; // Safety check — exit if post is not found

      post.applauded = !post.applauded; // Flip: true becomes false, false becomes true
      post.claps = post.applauded
        ? post.claps + 1             // If now applauded: add one clap
        : Math.max(0, post.claps - 1); // If un-applauded: remove one clap (minimum 0)

      save(); // Persist the new state to localStorage

      // Update the button appearance directly — no need to re-render the whole page
      btn.classList.toggle('applauded', post.applauded); // Add or remove the green style
      btn.querySelector('.clap-text').textContent = post.applauded ? '👏 Applauded' : '👏 Applaud';
      btn.querySelector('.clap-count').textContent = post.claps > 0 ? post.claps : '';

      // Quick bounce animation on click to give satisfying feedback
      btn.style.transform = 'scale(1.15)'; // Scale up slightly
      setTimeout(() => btn.style.transform = '', 200); // Reset back after 200 milliseconds
    }


    // SUBMIT COMMENT ────────────────────────────────────────────────────
    // Called when the Post button is clicked or Enter is pressed
    function submitComment(id) {
      const input = document.getElementById('cinput-' + id); // Get the input field for this post
      const text = input.value.trim(); // Read the text, removing leading/trailing spaces
      if (!text) return; // Do nothing if the comment is empty

      const post = posts.find(p => p.id == id);
      if (!post) return;

      post.comments.push(text); // Add the comment text to the post's comments array
      save(); // Persist the update
      input.value = ''; // Clear the input field ready for the next comment

      // Add the new comment to the DOM without re-rendering the whole page
      const container = document.getElementById('comments-' + id);
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.style.animation = 'fadeUp 0.3s ease both'; // Animate the new comment sliding in
      div.innerHTML = `<div class="comment-dot"></div><div class="comment-bubble">${escHtml(text)}</div>`;
      container.appendChild(div); // Append to the bottom of the comments section
    }


    // DELETE POST ───────────────────────────────────────────────────────
    // Permanently removes a post when the red X is clicked
    function deletePost(id) {
      if (!confirm('Delete this post?')) return; // Ask for confirmation first
      posts = posts.filter(p => p.id != id); // Keep all posts EXCEPT the one matching this ID
      save();        // Persist the removal
      renderFeed();  // Re-draw the feed without the deleted post
    }


    // SHOW TAB ──────────────────────────────────────────────────────────
    // Switches the visible view between Feed and Applauded
    function showTab(tab) {
      // Update which tab button looks active (green background)
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', (tab === 'feed' && i === 0) || (tab === 'applauded' && i === 1));
      });

      // Show or hide the correct view panel
      document.getElementById('feed-view').style.display = tab === 'feed' ? 'block' : 'none';
      document.getElementById('applauded-view').style.display = tab === 'applauded' ? 'block' : 'none';

      // Re-render applauded posts fresh each time the tab is opened
      if (tab === 'applauded') renderApplauded();
    }


    // ESCAPE HTML ───────────────────────────────────────────────────────
    // Converts dangerous characters so user-typed comments cannot inject HTML or scripts
    // Example: typing "<script>" becomes "&lt;script&gt;" — displayed as text, not executed
    function escHtml(s) {
      return s
        .replace(/&/g, '&amp;')   // & becomes &amp;
        .replace(/</g, '&lt;')    // < becomes &lt;
        .replace(/>/g, '&gt;')    // > becomes &gt;
        .replace(/"/g, '&quot;'); // " becomes &quot;
    }


    // INIT ──────────────────────────────────────────────────────────────
    // This runs once when the page first loads

    // Write today's date into the footer
    document.getElementById('foot-date').textContent =
      new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});

    // Render the feed using any posts previously saved in localStorage
    renderFeed();
