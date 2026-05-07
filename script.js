// ============================================
// SHORTCUT FUNCTION
// ============================================
const $ = id => document.getElementById(id);



// ============================================
// ESCAPE HTML
// PREVENTS HTML INJECTION
// ============================================
function esc(text) {

  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

}



// ============================================
// LOAD POSTS FROM LOCAL STORAGE
// ============================================
let posts = [];

try {

  posts = JSON.parse(
    localStorage.getItem('ms_posts')
  ) || [];

} catch (error) {

  posts = [];

}



// ============================================
// SAVE POSTS TO LOCAL STORAGE
// ============================================
function savePosts() {

  localStorage.setItem(
    'ms_posts',
    JSON.stringify(posts)
  );

}



// ============================================
// GENERATE RANDOM ANONYMOUS USERNAME
// ============================================
function generateAnonName() {

  const names = [

    'Shadow',
    'Ghost',
    'Citizen',
    'Justice',
    'Watcher',
    'Freedom',
    'Truth',
    'Panther',
    'Falcon',
    'Storm',
    'Lion',
    'Rebel'

  ];

  const randomName =
    names[
      Math.floor(
        Math.random() * names.length
      )
    ];

  const randomNumber =
    Math.floor(
      100 + Math.random() * 900
    );

  return `${randomName}${randomNumber}`;

}



// ============================================
// CREATE POST
// ============================================
function createPost(data) {

  posts.unshift({

    id: crypto.randomUUID(),

    title: data.title,

    cat: data.cat,

    loc: data.loc,

    desc: data.desc,

    urgency: data.urgency,

    reporter:
      data.reporter || 'Anonymous',

    date:
      new Date().toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      ),

    applauded: false,

    claps: 0,

    comments: [],

    src: data.src || null,

    type: data.type || null

  });

  savePosts();

}



// ============================================
// DELETE POST
// ============================================
function deletePost(id) {

  const confirmDelete = confirm(
    'Delete this strike?'
  );

  if (!confirmDelete) return;

  posts = posts.filter(
    post => post.id !== id
  );

  savePosts();

  renderPosts();

}



// ============================================
// APPLAUD POST
// ============================================
function toggleApplaud(id) {

  const post = posts.find(
    p => p.id === id
  );

  if (!post) return;

  post.applauded = !post.applauded;

  if (post.applauded) {

    post.claps++;

  } else {

    post.claps--;

    if (post.claps < 0) {

      post.claps = 0;

    }

  }

  savePosts();

  renderPosts();

}



// ============================================
// SUBMIT COMMENT
// ============================================
function submitComment(id) {

  const input =
    document.getElementById(
      `comment-${id}`
    );

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;



  const post =
    posts.find(
      p => p.id === id
    );

  if (!post) return;



  // ==========================================
  // COMMENT OBJECT
  // ==========================================
  const commentData = {

    username:
      generateAnonName(),

    text:

      text,

    date:
      new Date().toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      )

  };



  // ==========================================
  // PUSH COMMENT
  // ==========================================
  post.comments.push(
    commentData
  );



  savePosts();

  input.value = '';

  renderPosts();

}



// ============================================
// POST CARD HTML
// ============================================
function postHTML(post) {

  // ==========================================
  // MEDIA SECTION
  // ==========================================
  let media = '';



  // ==========================================
  // IF MEDIA EXISTS
  // ==========================================
  if (post.src) {



    // ========================================
    // VIDEO
    // ========================================
    if (post.type === 'video') {

      media = `

        <div
          style="
            position:relative;
            overflow:hidden;
          ">

          <video
            src="${post.src}"
            controls
            style="
              width:100%;
              height:260px;
              object-fit:cover;
              display:block;
            ">
          </video>

          <div
            style="
              position:absolute;
              top:12px;
              right:12px;
              background:rgba(0,0,0,.75);
              color:white;
              padding:.35rem .7rem;
              border-radius:999px;
              font-size:.7rem;
              font-weight:bold;
            ">

            🎥 VIDEO

          </div>

        </div>

      `;

    }



    // ========================================
    // IMAGE
    // ========================================
    else {

      media = `

        <div
          style="
            position:relative;
            overflow:hidden;
          ">

          <img
            src="${post.src}"
            alt="Strike image"
            style="
              width:100%;
              height:260px;
              object-fit:cover;
              display:block;
            ">

          <div
            style="
              position:absolute;
              top:12px;
              right:12px;
              background:rgba(0,0,0,.75);
              color:white;
              padding:.35rem .7rem;
              border-radius:999px;
              font-size:.7rem;
              font-weight:bold;
            ">

            📸 PHOTO

          </div>

        </div>

      `;

    }

  }



  // ==========================================
  // COMMENTS HTML
  // ==========================================
  const commentsHTML =
    post.comments.map(comment => `

      <div
        style="
          background:#111;
          border:1px solid #222;
          padding:.8rem;
          border-radius:8px;
          margin-top:.7rem;
        ">

        <div
          style="
            display:flex;
            justify-content:space-between;
            margin-bottom:.4rem;
          ">

          <span
            style="
              color:#f5c300;
              font-size:.78rem;
              font-weight:bold;
            ">

            👤 ${esc(comment.username)}

          </span>

          <span
            style="
              color:#666;
              font-size:.7rem;
            ">

            ${esc(comment.date)}

          </span>

        </div>

        <div
          style="
            color:#ccc;
            line-height:1.5;
            font-size:.85rem;
          ">

          ${esc(comment.text)}

        </div>

      </div>

    `).join('');



  // ==========================================
  // RETURN CARD
  // ==========================================
  return `

    <div
      style="
        background:#161616;
        border:1px solid #222;
        border-radius:14px;
        overflow:hidden;
      ">

      ${media}

      <div style="padding:1.4rem;">

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:1rem;
            margin-bottom:1rem;
          ">

          <h2
            style="
              color:#f5c300;
              font-size:1.35rem;
            ">

            ${esc(post.title)}

          </h2>

          <button
            onclick="deletePost('${post.id}')"
            style="
              background:none;
              border:none;
              color:#e02020;
              cursor:pointer;
              font-size:1rem;
            ">

            ✕

          </button>

        </div>



        <div
          style="
            color:#666;
            font-size:.78rem;
            margin-bottom:1rem;
            line-height:1.5;
          ">

          ${esc(post.cat)}
          •
          ${esc(post.loc)}
          •
          ${esc(post.reporter)}
          •
          ${esc(post.date)}

        </div>



        <p
          style="
            color:#bbb;
            line-height:1.7;
            margin-bottom:1.2rem;
          ">

          ${esc(post.desc)}

        </p>



        <!-- APPLAUD BUTTON -->
        <button
          onclick="toggleApplaud('${post.id}')"
          style="
            background:${post.applauded ? '#f5c300' : 'transparent'};
            color:${post.applauded ? '#000' : '#f5c300'};
            border:1px solid #f5c300;
            padding:.7rem 1.2rem;
            border-radius:999px;
            cursor:pointer;
            font-weight:bold;
            margin-bottom:1rem;
          ">

          👏 ${post.applauded ? 'Applauded' : 'Applaud'}

          (${post.claps})

        </button>



        <!-- COMMENTS -->
        <div>

          ${commentsHTML}

        </div>



        <!-- COMMENT INPUT -->
        <div
          style="
            display:flex;
            gap:.6rem;
            margin-top:1rem;
          ">

          <input
            id="comment-${post.id}"
            placeholder="Add a comment..."
            style="
              flex:1;
              background:#0a0a0a;
              border:1px solid #222;
              border-radius:8px;
              padding:.8rem;
              color:white;
            ">

          <button
            onclick="submitComment('${post.id}')"
            style="
              background:#f5c300;
              border:none;
              border-radius:8px;
              padding:.8rem 1rem;
              font-weight:bold;
              cursor:pointer;
            ">

            Post

          </button>

        </div>

      </div>

    </div>

  `;

}



// ============================================
// RENDER POSTS
// ============================================
function renderPosts() {

  const feedGrid =
    document.getElementById(
      'postsGrid'
    );

  const movementGrid =
    document.getElementById(
      'movementGrid'
    );

  const exposedGrid =
    document.getElementById(
      'exposedGrid'
    );



  // ==========================================
  // INDEX PAGE
  // ==========================================
  if (feedGrid) {

    if (posts.length === 0) {

      feedGrid.innerHTML = `

        <div
          style="
            color:#777;
            text-align:center;
            padding:4rem;
          ">

          No strikes available yet.

        </div>

      `;

    }

    else {

      feedGrid.innerHTML =
        posts
          .map(post => postHTML(post))
          .join('');

    }

  }



  // ==========================================
  // MOVEMENT PAGE
  // ==========================================
  if (movementGrid) {

    if (posts.length === 0) {

      movementGrid.innerHTML = `

        <div
          style="
            color:#777;
            text-align:center;
            padding:4rem;
          ">

          No movement activity yet.

        </div>

      `;

    }

    else {

      movementGrid.innerHTML =
        posts
          .map(post => postHTML(post))
          .join('');

    }

  }



  // ==========================================
  // EXPOSED PAGE
  // ==========================================
  if (exposedGrid) {

    const exposedPosts =
      posts.filter(post =>

        post.cat === 'Corruption' ||

        post.cat === 'Police Brutality' ||

        post.urgency === 'High'

      );



    if (exposedPosts.length === 0) {

      exposedGrid.innerHTML = `

        <div
          style="
            color:#777;
            text-align:center;
            padding:4rem;
          ">

          Nothing exposed yet.

        </div>

      `;

    }

    else {

      exposedGrid.innerHTML =
        exposedPosts
          .map(post => postHTML(post))
          .join('');

    }

  }

}



// ============================================
// FORM SUBMISSION
// ============================================
const reportForm =
  document.getElementById(
    'reportForm'
  );



if (reportForm) {

  reportForm.addEventListener(
    'submit',
    function(event) {

      event.preventDefault();



      // ======================================
      // GET FORM VALUES
      // ======================================
      const title =
        $('reportTitle').value.trim();

      const cat =
        $('category').value;

      const loc =
        $('location').value.trim();

      const desc =
        $('description').value.trim();

      const reporter =
        $('reporter').value.trim();

      const urgency =
        document.querySelector(
          'input[name=\"urgency\"]:checked'
        )?.value || 'Medium';



      // ======================================
      // VALIDATION
      // ======================================
      if (
        !title ||
        !cat ||
        !loc ||
        !desc
      ) {

        alert(
          'Please fill all required fields.'
        );

        return;

      }



      // ======================================
      // FILE HANDLING
      // ======================================
      const file =
        $('fileInput')?.files[0];



      // ======================================
      // IF FILE EXISTS
      // ======================================
      if (file) {

        const reader =
          new FileReader();



        reader.onload = function(e) {

          createPost({

            title,
            cat,
            loc,
            desc,
            urgency,
            reporter,

            src: e.target.result,

            type:
              file.type.startsWith(
                'video'
              )
                ? 'video'
                : 'image'

          });



          reportForm.reset();

          renderPosts();

          alert(
            'Strike submitted successfully!'
          );

        };



        reader.readAsDataURL(file);

      }



      // ======================================
      // NO FILE
      // ======================================
      else {

        createPost({

          title,
          cat,
          loc,
          desc,
          urgency,
          reporter

        });



        reportForm.reset();

        renderPosts();

        alert(
          'Strike submitted successfully!'
        );

      }

    }
  );

}



// ============================================
// INITIAL PAGE RENDER
// ============================================
renderPosts();