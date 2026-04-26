// financial ruin academy app logic

const VIDEOS = {
  1: 'https://www.youtube.com/embed/oLAZdgBXj5A?si=QOWMTWcDWwM2ujQM&enablejsapi=1&rel=0',
  2: 'https://www.youtube.com/embed/WoPmi0c-c3I?si=ex6M5uHHyAwDkMuA&enablejsapi=1&rel=0',
  3: 'https://www.youtube.com/embed/Y8U6SRIhvsg?si=F4NbDNDU_HMyNFIP&enablejsapi=1&rel=0',
};

const ITEMS = [
  { id: 0, emoji: '🫕', name: 'Artisanal Fondue Set',  desc: '"For dinner parties." (you\'ve had 0)', price: '$89', orig: '$120' },
  { id: 1, emoji: '🚣', name: 'Inflatable Kayak',       desc: 'Indoor use. Near water, probably.',     price: '$247', orig: '$400' },
  { id: 2, emoji: '✨', name: 'Star Projector Pro',     desc: 'Despite owning no ceiling space.',       price: '$54', orig: '$85'  },
];

const POLL_OPTS = [
  { id: 0, label: '🏦 Emergency Fund',               type: 'save',  comment: '"An emergency fund is just money you\'re scared to spend. Respectfully." — Alice' },
  { id: 1, label: '🏠 3 Months Ahead on Rent',       type: 'save',  comment: '"Three months early. That\'s three months of fondue sets not bought." — Alice' },
  { id: 2, label: '👴 Retirement Contribution',      type: 'save',  comment: '"You\'re thinking 40 years ahead. I can\'t think past Thursday." — Alice' },
  { id: 3, label: '🕯️ Artisanal Candle Subscription', type: 'spend', comment: '"Smells Like Poor Decisions is a legitimate scent. I own 14." — Alice 🎉' },
  { id: 4, label: '👕 Limited Edition Crypto Hoodie', type: 'spend', comment: '"Says HODL on the back. Ironic now. Still correct." — Alice 🎉' },
  { id: 5, label: '🖼️ NFT of Your Own Face',          type: 'spend', comment: '"Proof you exist on the blockchain. That\'s called legacy." — Alice 🎉' },
];

const QUIZ = [
  {
    prompt: 'You have $500 to invest. What do you recommend?',
    ctx: 'S&P 500 ETF: avg +10%/yr for 50 years. MOONCOIN 🌙: up 3,000% this week. Has a mascot.',
    opts: [
      { text: 'S&P 500 index fund — boring, proven, sensible.',           right: false, fb: '"50 years of data? That\'s 50 years of missed MOONCOIN." — Sam 😐' },
      { text: 'MOONCOIN 🌙 — up 3,000% this week. Momentum is everything.', right: true,  fb: '"Correct 🚀 Momentum IS the fundamental." — Alice' },
      { text: 'Treasury bonds. Low risk, guaranteed return.',              right: false, fb: '"Guaranteed." You sound like someone who files taxes early." — Sam 😐' },
    ],
    quote: '"If a coin has a mascot and exclamation points, that\'s called due diligence." — Alice',
  },
  {
    prompt: 'MOONCOIN just hit an all-time high. You\'re up 400%. What now?',
    ctx: 'MOONCOIN/USD — ATH: $420 ▲ 400% from entry. Reddit: "we\'re just getting started!!!!"',
    opts: [
      { text: 'Take some profits. Lock in gains. Diversify.',         right: false, fb: '"Sell at the top? Classic rookie mistake. That\'s called not believing." — Sam 😐' },
      { text: 'BUY MORE. The higher it goes, the more validated it is.', right: true,  fb: '"Correct 🚀 Conviction is the only fundamental." — Alice' },
      { text: 'Hold and wait for more data before deciding.',          right: false, fb: '"More data." You sound like someone with a savings account." — Sam 😐' },
    ],
    quote: '"Selling at the top means you didn\'t believe in it. That\'s a character flaw." — Alice',
  },
  {
    prompt: 'MOONCOIN is now down 80% from ATH. Your $500 is worth $100. Move?',
    ctx: 'MOONCOIN/USD — $84 ▼ 80% from ATH. Portfolio: $100. Reddit: "zoom out bro"',
    opts: [
      { text: 'Cut losses. Move the $100 into something stable.',                        right: false, fb: '"Sell the dip AND miss the recovery. Two mistakes. Impressive." — Sam 😐' },
      { text: 'Sell and rotate into SafeRug 🪬 — up 900% this month.',                    right: true,  fb: '"Correct 🚀 Sell low, buy high on a different coin. Portfolio rotation." — Alice' },
      { text: 'HOLD. It has to come back eventually.',                                   right: false, fb: '"Has to." That\'s not how markets work but I appreciate the optimism." — Sam 😐' },
    ],
    quote: '"The best time to buy is when it\'s up. The second best: when it\'s down. No bad time." — Alice',
  },
];

const S = {
  current:    0,
  step1Done:  false,
  step2Done:  false,
  step3Done:  false,
  reactions:  { 0: null, 1: null, 2: null },
  activeItem: null,
  pollVotes:  [],
  pollTotal:  3,
  quizDone:   [],
  health:     100,
  notifCount: 0,
  likedPosts: {},
  following:  {},
  pymkDone:   {},
};

function containerH() {
  const el = document.getElementById('feed-container');
  return el ? Math.round(el.getBoundingClientRect().height) : window.innerHeight - 52 - 36;
}

function setSectionHeight() {
  const h = containerH();
  document.documentElement.style.setProperty('--section-h', h + 'px');
}

let isSnapping = false;

function goToSection(n, force) {
  if (n < 0 || n > 4) return;
  if (!force && !canAccess(n)) { shakeDots(); return; }

  pauseAllVideos();

  isSnapping = true;
  S.current = n;
  const h = containerH();
  document.getElementById('feed-inner').style.transform = `translateY(-${n * h}px)`;

  setTimeout(() => {
    const sec = document.getElementById('section-' + n);
    if (sec) sec.scrollTop = 0;
  }, 40);

  // start video from beginning after transition completes
  startSectionVideo(n);

  updateDots();
  setTimeout(() => { isSnapping = false; }, 720);
}

function ytCmd(step, func, args) {
  const iframe = document.getElementById('yt-iframe-' + step);
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: func,
      args: args || []
    }), '*');
  } catch(e) {}
}

function pauseAllVideos() {
  [1, 2, 3].forEach(s => ytCmd(s, 'pauseVideo'));
}

function startSectionVideo(n) {
  if (n >= 1 && n <= 3 && VIDEOS[n]) {
    setTimeout(() => {
      ytCmd(n, 'seekTo', [0, true]);
      ytCmd(n, 'unMute');
      ytCmd(n, 'setVolume', [50]);
      ytCmd(n, 'playVideo');
    }, 350);
  }
}

function resumeCurrentVideo() {
  const n = S.current;
  if (n >= 1 && n <= 3 && VIDEOS[n]) {
    ytCmd(n, 'setVolume', [50]);
    ytCmd(n, 'playVideo');
  }
}

function canAccess(n) {
  if (n <= 1)  return true;
  if (n === 2) return S.step1Done;
  if (n === 3) return S.step2Done;
  if (n === 4) return S.step3Done;
  return false;
}

function shakeDots() {
  const el = document.getElementById('section-dots');
  el.classList.add('animate__animated', 'animate__headShake');
  el.addEventListener('animationend', () => el.classList.remove('animate__animated', 'animate__headShake'), { once: true });
  toast('🔒 Locked', 'Finish the activity in this step first.', 'bad');
}

function updateDots() {
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.remove('active', 'complete', 'locked');
    if (i === S.current) d.classList.add('active');
    else if (canAccess(i) && (i < S.current)) d.classList.add('complete');
    else if (!canAccess(i)) d.classList.add('locked');
  });

  // update nav home active state
  document.querySelectorAll('.nav-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
}

function initScroll() {
  const fc = document.getElementById('feed-container');
  let touchY = 0;

  function secAtBottom(sec) {
    return sec.scrollTop + Math.round(sec.getBoundingClientRect().height) >= sec.scrollHeight - 4;
  }
  function secAtTop(sec) {
    return sec.scrollTop <= 4;
  }

  fc.addEventListener('wheel', (e) => {
    if (isSnapping) return;
    const sec = document.getElementById('section-' + S.current);
    if (e.deltaY > 0 && !secAtBottom(sec)) return;
    if (e.deltaY < 0 && !secAtTop(sec))    return;
    e.preventDefault();
    goToSection(S.current + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  fc.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  fc.addEventListener('touchend', (e) => {
    if (isSnapping) return;
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 45) return;
    const sec = document.getElementById('section-' + S.current);
    if (dy > 0 && secAtBottom(sec)) goToSection(S.current + 1);
    if (dy < 0 && secAtTop(sec))    goToSection(S.current - 1);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (isSnapping) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); goToSection(S.current + 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); goToSection(S.current - 1, true); }
  });

  window.addEventListener('resize', () => {
    setSectionHeight();
    const h = containerH();
    const fi = document.getElementById('feed-inner');
    fi.style.transition = 'none';
    fi.style.transform = `translateY(-${S.current * h}px)`;
    requestAnimationFrame(() => { fi.style.transition = ''; });
  });
}

let _tid = 0;
function toast(title, body, type) {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type || ''} animate__animated animate__slideInRight`;
  el.innerHTML = `<div class="toast-title">${title}</div>${body ? `<div class="toast-body">${body}</div>` : ''}`;
  c.prepend(el);
  if (c.children.length > 4) c.lastChild.remove();
  setTimeout(() => {
    el.classList.replace('animate__slideInRight', 'animate__slideOutRight');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3500);
}

function celebrate() {
  const cols = { colors: ['#0a66c2','#004182','#0073b1','#e8f0fe','#ffffff'] };
  confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 }, ...cols });
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 60,  spread: 55, origin: { x: 0 }, ...cols });
    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 }, ...cols });
  }, 300);
}

function damageHealth(n) {
  S.health = Math.max(0, S.health - n);
  S.notifCount++;
  const fill  = document.getElementById('health-fill');
  const score = document.getElementById('health-score');
  const badge = document.getElementById('notif-badge');
  if (fill) {
    fill.style.width = S.health + '%';
    fill.style.background = S.health < 40 ? '#cc1016' : S.health < 70 ? '#b24020' : '#057642';
  }
  if (score) {
    score.textContent = S.health + '%';
    score.style.color = S.health < 40 ? '#cc1016' : S.health < 70 ? '#b24020' : '#057642';
  }
  if (badge) badge.textContent = S.notifCount;
}

function navClick(id) {
  const msgs = {
    home:    ['Going home', 'Back to the feed.'],
    network: ['Your Network', 'You have 847 connections. Most of them are confused about you.'],
    jobs:    ['Job Search Results', '0 jobs match your current financial situation. Consider retraining.'],
    msg:     ['Messaging', 'You have 14 unread messages from your financial advisor. They seem concerned.'],
    notif:   ['Notifications', `${S.notifCount} notification${S.notifCount !== 1 ? 's' : ''} — all of them are Alice reacting 🎉 to your bad decisions.`],
    me:      ['Alice Chen', 'Certified Financial Disaster Coach · Financial Ruin Academy · $11 in savings'],
  };
  const m = msgs[id] || ['LinkedIn', 'This feature is not available in the Financial Ruin Academy demo.'];
  toast(m[0], m[1]);
}

function postHeaderHTML(name, hl, time, badge) {
  return `
    <div class="post-header">
      <div class="post-av">😎</div>
      <div class="post-author">
        <div class="post-name">${name} <span class="post-conn">• 1st</span>${badge ? ` <span style="font-size:10px;background:#e8f0fe;color:#0a66c2;padding:1px 6px;border-radius:3px;margin-left:2px;">${badge}</span>` : ''}</div>
        <div class="post-hl">${hl}</div>
        <div class="post-time">${time}</div>
      </div>
      <button class="post-follow" id="follow-${name.replace(/\s/g,'')}" onclick="toggleFollow(this)">+ Follow</button>
    </div>
  `;
}

function toggleFollow(btn) {
  const isFol = btn.classList.contains('following');
  btn.classList.toggle('following', !isFol);
  btn.textContent = isFol ? '+ Follow' : '✓ Following';
}

function postActionsHTML(id) {
  return `
    <div class="post-actions" style="border-top:1px solid var(--border);">
      <button class="pa-btn" id="like-${id}" onclick="toggleLike('${id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        Like
      </button>
      <button class="pa-btn" onclick="toast('Comments','The comment section is moderated by Alice.')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Comment
      </button>
      <button class="pa-btn" onclick="toast('Reposted! 🎉','Your followers are mildly concerned.','ok')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        Repost
      </button>
      <button class="pa-btn" onclick="toast('Sent to 0 people.','Nobody opted in to this content.','warn')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Send
      </button>
    </div>
  `;
}

function toggleLike(id) {
  S.likedPosts[id] = !S.likedPosts[id];
  const btn = document.getElementById('like-' + id);
  if (btn) btn.classList.toggle('liked', S.likedPosts[id]);
  if (S.likedPosts[id]) toast('You liked Alice\'s post', 'Alice will be thrilled. Sam will not.', 'ok');
}

function videoHTML(step) {
  const src = VIDEOS[step];
  if (src) {
    return `<div class="video-wrap">
      <iframe id="yt-iframe-${step}" src="${src}" title="YouTube video player" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>`;
  }
  return `<div class="video-wrap">
    <div class="video-placeholder">
      <div class="play-ring"><div class="play-tri"></div></div>
      <span class="video-placeholder-label">VIDEO COMING SOON — STEP ${step}</span>
    </div>
  </div>`;
}

function scrollHintHTML(locked, nextN) {
  const label = locked ? '🔒 complete the activity to continue' : 'scroll down or click to continue';
  return `<div class="scroll-hint${locked ? ' locked' : ''}" onclick="${locked ? 'shakeDots()' : `goToSection(${nextN})`}">
    <span class="scroll-hint-txt">${label}</span>
    <div class="scroll-arr">${locked ? '🔒' : '↓'}</div>
  </div>`;
}

function cmtHTML(av, name, text, extra) {
  return `<div class="cmt">
    <div class="cmt-av">${av}</div>
    <div class="cmt-bubble">
      <div class="cmt-name">${name}</div>
      <div class="cmt-text">${text}</div>
      <div class="cmt-actions"><span onclick="toast('Liked ❤️','')">Like</span><span onclick="toast('Reply','The comment form is disabled for your financial safety.')">Reply</span>${extra||''}</div>
    </div>
  </div>`;
}

// section 0 — intro

function renderS0() {
  document.getElementById('section-0').innerHTML = `
    <div class="post-card">
      ${postHeaderHTML('Alice Chen', 'Certified Financial Disaster Coach · Financial Ruin Academy', 'Pinned', '📌 Pinned')}
      <div class="post-body">
        Excited to share my 3-part financial education series 🚀<br><br>
        Over the past year I've made some truly incredible financial decisions — and I want to teach you to make them too. Three lessons, three interactions, one certificate of financial ruin.<br><br>
        Drop a 💡 if you've ever said "I deserve this." Drop a 🛒 if you've bought something you absolutely did not need.<br><br>
        <span class="ht">#PersonalFinance</span> <span class="ht">#Investing</span> <span class="ht">#YouDeserveThis</span> <span class="ht">#Blessed</span>
      </div>
      <div class="post-stats">
        <span class="post-reactions-count" onclick="toast('Reactions','❤️ 💡 🎉 and 1,247 others found this irresponsible.')">❤️ 💡 🎉  1,247</span>
        <span>47 comments · 12 reposts</span>
      </div>
      <div class="comment-zone" style="padding-top:8px;">
        ${cmtHTML('😐','Sam Ramos <span style="font-size:10px;font-weight:400;color:#666;">· 2nd · Has $47 in savings</span>','I did not consent to being tagged in this.','<span style="color:#999;">· Pinned</span>')}
      </div>
      <div class="post-actions">
        <button class="pa-btn" id="like-s0" onclick="toggleLike('s0')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          Like
        </button>
        <button class="pa-btn" onclick="toast('Comments','Moderated by Alice. Disagreements are deleted.')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Comment
        </button>
        <button class="pa-btn" onclick="toast('Reposted!','Your followers are now worried about you.','ok')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          Repost
        </button>
        <button class="pa-btn" onclick="toast('Sent','To: nobody. Your contact list has been notified.')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Send
        </button>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;padding:4px 0;">
      <button class="btn-li-primary" onclick="goToSection(1,true)">Start Learning →</button>
      <button class="btn-li-outline" onclick="goToSection(1,true)">Lesson 1: The Impulse Buy</button>
    </div>
    ${scrollHintHTML(false, 1)}
  `;
}

// section 1 — impulse buy

function renderS1() {
  const carted = ITEMS.filter(i => S.reactions[i.id] === '🛒').length;
  document.getElementById('section-1').innerHTML = `
    <div class="post-card">
      ${postHeaderHTML('Alice Chen','Certified Financial Disaster Coach · Financial Ruin Academy','4h')}
      <div class="post-body">
        Hot take: if something is on sale, you are <strong>legally obligated</strong> to buy it. 20% off? Saving money. 80% off? Making money. At 90% off, buy several. This is just math.<br><br>
        <span class="ht">#ImpulseBuying</span> <span class="ht">#YouDeserveThis</span> <span class="ht">#SaleScience</span>
      </div>
      ${videoHTML(1)}
      ${postActionsHTML('s1')}
    </div>

    <div class="activity-card">
      <button class="activity-hdr-btn" onclick="openListingsModal()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span><strong>Alice Chen</strong> featured these listings &nbsp;·&nbsp; <span class="play-cta">🛒 Click to unlock Step 2 →</span></span>
        <span class="cart-count" id="s1-cart-count">${carted}/3 carted</span>
      </button>
    </div>
  `;
}

function openListingsModal() {
  pauseAllVideos();
  const inner = document.getElementById('modal-inner');
  inner.innerHTML = listingsModalHTML();
  document.getElementById('modal-overlay').style.display = 'flex';
}

function listingsModalHTML() {
  const carted = ITEMS.filter(i => S.reactions[i.id] === '🛒').length;
  const allDone = carted === ITEMS.length;
  return `
    <div class="modal-hdr">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="cmt-av" style="width:36px;height:36px;font-size:18px;">😎</div>
        <div>
          <div style="font-size:13px;font-weight:600;">Alice Chen · Featured Listings</div>
          <div style="font-size:11px;color:var(--muted);">Financial Ruin Academy · 3 items</div>
        </div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-sub">
      React with <strong>🛒</strong> on all three items to complete Step 1 &nbsp;·&nbsp; <strong>${carted}/3</strong> carted
    </div>
    ${ITEMS.map(item => listingHTML(item)).join('')}
    <div id="modal-comments" class="comment-zone" style="display:none;padding-top:4px;"></div>
    ${allDone ? '<div class="modal-done">✓ All carted — Step 1 complete!</div>' : ''}
  `;
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  resumeCurrentVideo();
}

function overlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function listingHTML(item) {
  const r = S.reactions[item.id];
  const rightEl = r === '🛒'
    ? `<div class="carted-badge">✓ Carted</div>`
    : `<button class="react-btn ${r ? 'reacted' : ''}" onclick="openReact(${item.id}, this)">
         ${r ? r : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`}
         <span>${r || 'React'}</span>
       </button>`;
  return `
    <div class="listing-row" id="lr-${item.id}">
      <div class="listing-thumb">${item.emoji}</div>
      <div class="listing-info">
        <div class="listing-name">${item.name}</div>
        <div class="listing-desc">${item.desc}</div>
        <div class="listing-price">${item.price}<span class="orig">${item.orig}</span></div>
      </div>
      <div class="listing-right" id="lr-right-${item.id}">${rightEl}</div>
    </div>
  `;
}

function openReact(itemId, triggerEl) {
  S.activeItem = itemId;
  const popup = document.getElementById('reaction-popup');
  const rect  = triggerEl.getBoundingClientRect();
  popup.style.left = Math.min(rect.left, window.innerWidth - 270) + 'px';
  popup.style.top  = (rect.top - 72) + 'px';
  popup.style.display = 'flex';
}

function pickReaction(r) {
  const popup = document.getElementById('reaction-popup');
  popup.style.display = 'none';
  if (S.activeItem === null) return;
  const id = S.activeItem;
  S.activeItem = null;
  S.reactions[id] = r;

  // update right area in modal
  const right = document.getElementById('lr-right-' + id);
  if (right) {
    right.innerHTML = r === '🛒'
      ? `<div class="carted-badge">✓ Carted</div>`
      : `<button class="react-btn reacted" onclick="openReact(${id}, this)">${r} <span>${r}</span></button>`;
  }

  // alice comment in modal
  const zone = document.getElementById('modal-comments');
  if (zone) {
    const txt = r === '🛒'
      ? `Smart. The ${ITEMS[id].name} is an investment. You'll see.`
      : `${r} — interesting reaction. But did you add it to cart?`;
    zone.style.display = 'flex';
    zone.style.flexDirection = 'column';
    const c = document.createElement('div');
    c.className = 'animate__animated animate__fadeInUp';
    c.style.setProperty('--animate-duration', '0.3s');
    c.innerHTML = cmtHTML('😎', 'Alice Chen', txt, '<span style="color:#999;">· Just now</span>');
    zone.prepend(c);
    if (zone.children.length > 4) zone.lastChild.remove();
    if (r === '🛒') { toast('🛒 Added to cart!', `The ${ITEMS[id].name} is yours now.`, 'ok'); damageHealth(10); }
    else toast(`${r} Noted`, 'But seriously, have you tried 🛒?');
  }

  // refresh modal sub-header count
  const sub = document.querySelector('.modal-sub');
  if (sub) {
    const carted = ITEMS.filter(i => S.reactions[i.id] === '🛒').length;
    sub.innerHTML = `React with <strong>🛒</strong> on all three items to complete Step 1 &nbsp;·&nbsp; <strong>${carted}/3</strong> carted`;
  }

  checkS1();
}

function checkS1() {
  const carted = ITEMS.filter(i => S.reactions[i.id] === '🛒').length;

  // update section counter
  const cnt = document.getElementById('s1-cart-count');
  if (cnt) cnt.textContent = `${carted}/3 carted`;

  if (carted === ITEMS.length && !S.step1Done) {
    S.step1Done = true;
    // show done state in modal then close after delay
    const inner = document.getElementById('modal-inner');
    if (inner) {
      const doneBanner = document.createElement('div');
      doneBanner.className = 'modal-done animate__animated animate__fadeInUp';
      doneBanner.style.setProperty('--animate-duration', '0.3s');
      doneBanner.textContent = '✓ All carted — Step 1 complete!';
      inner.appendChild(doneBanner);
    }
    setTimeout(() => {
      closeModal();
      updateDots();
      celebrate();
      toast('🛒 Step 1 Complete!', 'All three items carted. Heading to Step 2.', 'ok');
      damageHealth(5);
      setTimeout(() => goToSection(2), 1200);
    }, 900);
  }
}

// section 2 — savings poll

function renderS2() {
  const spends = S.pollVotes.filter(i => POLL_OPTS[i].type === 'spend').length;
  document.getElementById('section-2').innerHTML = `
    <div class="post-card">
      ${postHeaderHTML('Alice Chen','Certified Financial Disaster Coach · Financial Ruin Academy','2h')}
      <div class="post-body">
        Your savings account is emotionally unavailable and you deserve better. Every dollar in savings is a dollar not out experiencing things. Getting 2%? You've lost the game. 💸<br><br>
        <span class="ht">#FinancialFreedom</span> <span class="ht">#SavingsAreFear</span>
      </div>
      ${videoHTML(2)}
      ${postActionsHTML('s2')}
    </div>

    <div class="activity-card">
      <button class="activity-hdr-btn" onclick="openPollModal()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <span><strong>Alice Chen</strong> posted a poll &nbsp;·&nbsp; <span class="play-cta">💸 Click to unlock Step 3 →</span></span>
        <span class="cart-count" id="s2-spend-count">${spends}/3 choices made</span>
      </button>
    </div>
  `;
}

function openPollModal() {
  pauseAllVideos();
  document.getElementById('modal-inner').innerHTML = pollModalHTML();
  document.getElementById('modal-overlay').style.display = 'flex';
}

function pollModalHTML() {
  const spends = S.pollVotes.filter(i => POLL_OPTS[i].type === 'spend').length;
  return `
    <div class="modal-hdr">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="cmt-av" style="width:36px;height:36px;font-size:18px;">😎</div>
        <div>
          <div style="font-size:13px;font-weight:600;">Alice Chen · Poll</div>
          <div style="font-size:11px;color:var(--muted);">Financial Ruin Academy · 6 options</div>
        </div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-sub">
      Select all 3 <strong>spending</strong> options to complete Step 2 &nbsp;·&nbsp; <strong>${spends}/3</strong> made
    </div>
    <div class="poll-wrap">
      <div class="poll-q">Where should your money go this month?</div>
      <div class="poll-sub">Select all that apply</div>
      ${POLL_OPTS.map(o => pollOptHTML(o)).join('')}
      <div class="poll-footer">
        <span><strong id="poll-total">${S.pollTotal}</strong> votes</span>
        <span id="poll-needed">${spends < 3 ? `${3 - spends} spending choice${3-spends!==1?'s':''} remaining` : '✓ All spending choices selected'}</span>
      </div>
    </div>
    <div id="s2-comments" class="comment-zone" style="${S.pollVotes.length ? '' : 'display:none;'}"></div>
    ${spends >= 3 ? '<div class="modal-done">✓ All spending choices made — Step 2 complete!</div>' : ''}
  `;
}

function pollOptHTML(o) {
  const voted = S.pollVotes.includes(o.id);
  const pct   = voted ? (o.type === 'spend' ? 84 : 16) : 0;
  return `
    <div class="poll-opt ${voted ? 'voted ' + o.type : ''}" id="po-${o.id}" onclick="votePoll(${o.id})">
      <div class="poll-bar ${o.type}" style="width:${pct}%"></div>
      <div class="poll-opt-inner">
        <span class="poll-opt-text">${o.label}</span>
        ${voted ? `<span class="poll-opt-chk">${o.type==='spend' ? '✅' : '🟢'}</span>` : ''}
        <span class="poll-opt-pct">${voted ? pct+'%' : ''}</span>
      </div>
    </div>
  `;
}

function votePoll(id) {
  if (S.pollVotes.includes(id)) return;
  S.pollVotes.push(id);
  S.pollTotal++;
  const opt = POLL_OPTS[id];

  // animate bar
  const el = document.getElementById('po-' + id);
  if (el) {
    const pct = opt.type === 'spend' ? 84 : 16;
    el.classList.add('voted', opt.type);
    el.querySelector('.poll-bar').style.width = pct + '%';
    const inner = el.querySelector('.poll-opt-inner');
    if (inner) {
      inner.querySelector('.poll-opt-pct').textContent = pct + '%';
      const txt = inner.querySelector('.poll-opt-text');
      if (!inner.querySelector('.poll-opt-chk')) {
        const chk = document.createElement('span');
        chk.className = 'poll-opt-chk';
        chk.textContent = opt.type === 'spend' ? '✅' : '🟢';
        txt.after(chk);
      }
    }
  }

  // update poll footer
  const tot = document.getElementById('poll-total');
  const ned = document.getElementById('poll-needed');
  if (tot) tot.textContent = S.pollTotal;
  const spendsLeft = 3 - S.pollVotes.filter(i => POLL_OPTS[i].type === 'spend').length;
  if (ned) ned.textContent = spendsLeft > 0
    ? `${spendsLeft} spending choice${spendsLeft!==1?'s':''} remaining`
    : '✓ All spending choices selected';

  // alice comment in modal
  const zone = document.getElementById('s2-comments');
  if (zone) {
    zone.style.display = 'flex';
    zone.style.flexDirection = 'column';
    const c = document.createElement('div');
    c.className = 'animate__animated animate__fadeInUp';
    c.style.setProperty('--animate-duration', '0.3s');
    c.innerHTML = cmtHTML('😎', 'Alice Chen', opt.comment, '<span style="color:#999;">· Just now</span>');
    zone.prepend(c);
    if (zone.children.length > 5) zone.lastChild.remove();
    if (opt.type === 'spend') { toast('💸 Voted!', opt.comment.replace('— Alice 🎉',''), 'ok'); damageHealth(8); }
    else toast('🟢 Bold choice.', opt.comment.replace('— Alice',''), 'warn');
  }

  // update modal sub header
  const spends = S.pollVotes.filter(i => POLL_OPTS[i].type === 'spend').length;
  const sub = document.querySelector('.modal-sub');
  if (sub) sub.innerHTML = `Select all 3 <strong>spending</strong> options to complete Step 2 &nbsp;·&nbsp; <strong>${spends}/3</strong> made`;

  // update section counter
  const cnt = document.getElementById('s2-spend-count');
  if (cnt) cnt.textContent = `${spends}/3 choices made`;

  checkS2();
}

function checkS2() {
  const spends = S.pollVotes.filter(i => POLL_OPTS[i].type === 'spend').length;
  if (spends >= 3 && !S.step2Done) {
    S.step2Done = true;
    const inner = document.getElementById('modal-inner');
    if (inner) {
      const banner = document.createElement('div');
      banner.className = 'modal-done animate__animated animate__fadeInUp';
      banner.style.setProperty('--animate-duration', '0.3s');
      banner.textContent = '✓ All spending choices made — Step 2 complete!';
      inner.appendChild(banner);
    }
    setTimeout(() => {
      closeModal();
      updateDots();
      celebrate();
      toast('💸 Step 2 Complete!', 'Savings: $0. Heading to Step 3.', 'ok');
      damageHealth(5);
      setTimeout(() => goToSection(3), 1200);
    }, 900);
  }
}

// section 3 — quiz

function renderS3() {
  document.getElementById('section-3').innerHTML = `
    <div class="post-card">
      ${postHeaderHTML('Alice Chen','Certified Financial Disaster Coach · Financial Ruin Academy','1h')}
      <div class="post-body">
        Stop asking "is this a good investment." Start asking "does this feel right." Thread 🧵<br><br>
        Traditional advice: diversify, think long term, don't put rent money into crypto at 2am. Boring. All of it. What speaks to you? What has good energy?<br><br>
        <span class="ht">#Crypto</span> <span class="ht">#MOONCOIN</span> <span class="ht">#InvestWithVibes</span>
      </div>
      ${videoHTML(3)}
      ${postActionsHTML('s3')}
    </div>

    <div class="activity-card">
      <button class="activity-hdr-btn" onclick="openQuizModal()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <span><strong>Alice Chen</strong> posted 3 polls &nbsp;·&nbsp; <span class="play-cta">📉 Click to unlock Certificate →</span></span>
        <span class="cart-count" id="s3-quiz-count">${S.quizDone.length}/3 answered</span>
      </button>
    </div>
  `;
}

function openQuizModal() {
  pauseAllVideos();
  document.getElementById('modal-inner').innerHTML = quizModalHTML();
  document.getElementById('modal-overlay').style.display = 'flex';
}

function quizModalHTML() {
  return `
    <div class="modal-hdr">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="cmt-av" style="width:36px;height:36px;font-size:18px;">😎</div>
        <div>
          <div style="font-size:13px;font-weight:600;">Alice Chen · Investment Quiz</div>
          <div style="font-size:11px;color:var(--muted);">Financial Ruin Academy · ${QUIZ.length} scenarios</div>
        </div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-sub">
      Answer all ${QUIZ.length} scenarios the Alice way to complete Step 3 &nbsp;·&nbsp; <strong id="quiz-modal-count">${S.quizDone.length}/${QUIZ.length}</strong> answered
    </div>
    <div class="quiz-wrap" id="quiz-wrap">
      ${quizCardsHTML()}
    </div>
    ${S.step3Done ? '<div class="modal-done">✓ All scenarios answered — Step 3 complete!</div>' : ''}
  `;
}

function quizCardsHTML() {
  let html = `
    <div style="padding:10px 14px 6px;">
      <div class="quiz-prog-label">
        <span>Investment Assessment</span>
        <span id="quiz-count">${S.quizDone.length}/${QUIZ.length} answered</span>
      </div>
      <div class="quiz-prog-bar">
        <div class="quiz-prog-fill" id="quiz-fill" style="width:${(S.quizDone.length/QUIZ.length)*100}%"></div>
      </div>
    </div>
  `;
  QUIZ.forEach((q, qi) => {
    if (qi > S.quizDone.length) return;
    const done = S.quizDone.includes(qi);
    html += `
      <div class="quiz-q ${done ? 'done' : ''} animate__animated animate__fadeInUp" id="qq-${qi}" style="--animate-duration:0.35s;margin:0 10px 10px;">
        <div class="quiz-q-hdr">
          <div class="quiz-q-av">😎</div>
          <span><strong>Alice Chen</strong> posted a poll${done ? ' &nbsp;·&nbsp; ✓ answered' : ' &nbsp;·&nbsp; Just now'}</span>
        </div>
        <div class="quiz-q-prompt">${q.prompt}</div>
        <div class="quiz-q-context">${q.ctx}</div>
        ${q.opts.map((o, oi) => `
          <div class="quiz-opt${done ? ' disabled' : ''}" id="qo-${qi}-${oi}"
            onclick="${done ? '' : `quizAnswer(${qi},${oi})`}"
            style="${done && o.right ? 'background:rgba(10,102,194,0.07);' : ''}">
            <div class="quiz-opt-bg${done && o.right ? ' right' : ''}" style="width:${done && o.right ? '100%' : '0%'}"></div>
            <div class="quiz-opt-letter">${String.fromCharCode(65+oi)}</div>
            <div class="quiz-opt-text">${o.text}</div>
            <div class="quiz-opt-icon">${done && o.right ? '✅' : ''}</div>
          </div>
        `).join('')}
        ${done
          ? `<div class="quiz-alice-cmt">${cmtHTML('😎','Alice Chen',q.opts.find(o=>o.right).fb,'')}</div>`
          : `<div style="padding:8px 12px;font-size:11px;color:#999;font-style:italic;">${q.quote}</div>`
        }
      </div>
    `;
  });
  return html;
}

function quizAnswer(qi, oi) {
  if (S.quizDone.includes(qi)) return;
  const opt = QUIZ[qi].opts[oi];

  if (!opt.right) {
    const el = document.getElementById('qo-' + qi + '-' + oi);
    if (el) {
      el.style.background = 'rgba(204,16,22,0.06)';
      el.classList.add('animate__animated', 'animate__headShake');
      el.addEventListener('animationend', () => {
        el.classList.remove('animate__animated', 'animate__headShake');
        el.style.background = '';
      }, { once: true });
    }
    toast('😐 Sam Ramos commented:', opt.fb, 'bad');
    return;
  }

  // correct
  S.quizDone.push(qi);
  toast('🎉 Alice Chen reacted to your answer', opt.fb, 'ok');
  damageHealth(7);

  // re-render quiz inside modal
  const wrap = document.getElementById('quiz-wrap');
  if (wrap) wrap.innerHTML = quizCardsHTML();

  // update modal counters
  const modalCount = document.getElementById('quiz-modal-count');
  if (modalCount) modalCount.textContent = `${S.quizDone.length}/${QUIZ.length}`;

  // update section counter
  const secCount = document.getElementById('s3-quiz-count');
  if (secCount) secCount.textContent = `${S.quizDone.length}/3 answered`;

  checkS3();
}

function checkS3() {
  if (S.quizDone.length >= QUIZ.length && !S.step3Done) {
    S.step3Done = true;
    const inner = document.getElementById('modal-inner');
    if (inner) {
      const banner = document.createElement('div');
      banner.className = 'modal-done animate__animated animate__fadeInUp';
      banner.style.setProperty('--animate-duration', '0.3s');
      banner.textContent = '✓ All scenarios answered — Step 3 complete!';
      inner.appendChild(banner);
    }
    setTimeout(() => {
      closeModal();
      updateDots();
      celebrate();
      toast('📉 Step 3 Complete!', 'Alice is proud. Your certificate awaits.', 'ok');
      damageHealth(5);
      setTimeout(() => goToSection(4), 1200);
    }, 900);
  }
}

// section 4 — finale

function renderS4() {
  const rank = S.health < 25 ? 'Financially Obliterated'
             : S.health < 45 ? 'Professionally Broke'
             : S.health < 65 ? 'Casually Irresponsible'
             : 'Irresponsibility In Progress';
  const ordNum = 'FRA-' + String(Date.now()).slice(-8);
  const today  = new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});

  document.getElementById('section-4').innerHTML = `
    <div class="post-card">
      ${postHeaderHTML('Alice Chen','Certified Financial Disaster Coach · Financial Ruin Academy','Just now','🎓 New')}
      <div class="post-body" style="padding-bottom:6px;">
        Thrilled to announce I've officially completed my financial education curriculum 🎓 My portfolio is down 62% and I've never felt more alive. Open to new opportunities. Fondue set also available.<br>
        <span class="ht">#Blessed</span> <span class="ht">#OpenToWork</span> <span class="ht">#NeverFeltMoreAlive</span>
      </div>
    </div>

    <div class="li-card cert-card">
      <div class="cert-top-bar"></div>
      <div class="cert-body" style="padding:14px 16px 12px;">
        <div class="cert-issuer" style="margin-bottom:10px;">
          <div class="cert-issuer-logo">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
          </div>
          <div>
            <div class="cert-issuer-name">Financial Ruin Academy</div>
            <div class="cert-issuer-sub">Issued via Linked Out Learning (not really)</div>
          </div>
        </div>
        <div class="cert-title" style="font-size:17px;margin-bottom:2px;">Certificate of Financial Ruin</div>
        <div class="cert-rank" style="margin-bottom:10px;">${rank}</div>
        <div class="cert-meta" style="margin-bottom:8px;gap:14px;">
          <div class="cert-meta-item"><strong>Issued ${today}</strong><span>Date</span></div>
          <div class="cert-meta-item"><strong>${ordNum}</strong><span>Credential ID</span></div>
          <div class="cert-meta-item"><strong>${S.health}%</strong><span>Health remaining</span></div>
        </div>
        <div class="cert-cta" style="margin-top:10px;">
          <button class="btn-cert" onclick="shareCert()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Share on LinkedIn
          </button>
          <button class="btn-cert-outline" onclick="resetAll()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Lose more money
          </button>
        </div>
      </div>
    </div>

    <div class="li-card skills-card" style="padding:12px 16px;">
      <div class="skills-title" style="margin-bottom:8px;">Skills &amp; Endorsements</div>
      ${[
        ['Impulse Buying','Endorsed by 847 connections','847'],
        ['Savings Destruction','Endorsed by 1,203 connections','1,203'],
        ['Crypto Intuition','Endorsed by 312 connections','312'],
        ['Buy High, Sell Low','Endorsed by Alice Chen','1'],
      ].map(([n,e,b]) => `
        <div class="skill-row" style="padding:5px 0;">
          <div><div class="skill-name">${n}</div><div class="skill-end">${e}</div></div>
          <div class="skill-badge">${b}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function shareCert() {
  const text = `Excited to share that I've officially completed the Financial Ruin Academy curriculum! 🎓\n\nMy portfolio is down 62% and I've never felt more alive.\n\n#FinancialRuin #Blessed #OpenToBankruptcy`;
  navigator.clipboard.writeText(text)
    .then(()  => toast('🔗 Copied!', 'Paste it into LinkedIn. Alice would want that.', 'ok'))
    .catch(()  => toast('Share:', text));
}

function resetAll() {
  S.current = 0; S.step1Done = false; S.step2Done = false; S.step3Done = false;
  S.reactions = {0:null,1:null,2:null}; S.activeItem = null;
  S.pollVotes = []; S.pollTotal = 3;
  S.quizDone = []; S.health = 100; S.notifCount = 0;
  S.likedPosts = {}; S.following = {}; S.pymkDone = {};
  renderAll();
  damageHealth(0); // reset display
  const fill  = document.getElementById('health-fill');
  const score = document.getElementById('health-score');
  const badge = document.getElementById('notif-badge');
  if (fill)  { fill.style.width = '100%'; fill.style.background = '#057642'; }
  if (score) { score.textContent = '100%'; score.style.color = '#057642'; }
  if (badge)  badge.textContent = '0';
  goToSection(0, true);
}

// sidebars

function renderLeft() {
  document.getElementById('left-sidebar').innerHTML = `
    <div class="li-card" style="overflow:visible;">
      <div class="profile-banner"></div>
      <div class="profile-avatar-outer"><div class="profile-avatar">😎</div></div>
      <div class="profile-body">
        <div class="profile-name">Alice Chen</div>
        <div class="profile-hl">Certified Financial Disaster Coach · Financial Ruin Academy</div>
        <hr class="profile-divider">
        <div class="profile-stat" onclick="toast('Connections','847 people are following Alice\'s advice. Prayers for all of them.')">
          <span class="profile-stat-label">Connections</span>
          <span class="profile-stat-val">847</span>
        </div>
        <div class="profile-stat" onclick="toast('Profile views','Down 23% since Alice posted the savings video.')">
          <span class="profile-stat-label">Profile views</span>
          <span class="profile-stat-val">23</span>
        </div>
        <div class="health-wrap">
          <div class="health-top">
            <span>Financial Health</span>
            <span class="health-score" id="health-score">100%</span>
          </div>
          <div class="health-bar"><div class="health-fill" id="health-fill" style="width:100%"></div></div>
        </div>
        <div class="otw-tag" onclick="toast('#OpenToBankruptcy','Alice is open to new opportunities. Particularly any involving meme coins.')">
          #OpenToBankruptcy
        </div>
      </div>
    </div>

    <div class="li-card sidebar-link-list">
      <div class="sidebar-link-title">Recent</div>
      <div class="sidebar-link" onclick="toast('📊 Personal Finance','Your financial health is at ' + S.health + '%. You are doing great.')">📊 Personal Finance</div>
      <div class="sidebar-link" onclick="toast('💸 Impulse Buying','You have added 3 items to your cart. Alice is proud.')">💸 Impulse Buying</div>
      <div class="sidebar-link" onclick="toast('🌙 MOONCOIN','Currently down 94%. This is fine.')">🌙 MOONCOIN</div>
      <div class="sidebar-link" onclick="toast('📉 Portfolio','Value: $11. Alice says zoom out.')">📉 Portfolio Recovery</div>
    </div>
  `;
}

function renderRight() {
  document.getElementById('right-sidebar').innerHTML = `
    <div class="li-card">
      <div class="pymk-title">People you may know</div>
      ${[
        { av:'😐', name:'Sam Ramos',          sub:'Has $47 in savings · 2nd', btn:'Connect'  },
        { av:'🏦', name:'Your Bank',           sub:'14 unread messages · 3rd', btn:'Follow'   },
        { av:'📊', name:'A Financial Advisor', sub:'Deeply concerned · 3rd',   btn:'Connect'  },
      ].map((p,i) => `
        <div class="pymk-person">
          <div class="pymk-avatar">${p.av}</div>
          <div class="pymk-info">
            <div class="pymk-name">${p.name}</div>
            <div class="pymk-sub">${p.sub}</div>
          </div>
          <button class="pymk-btn" id="pymk-${i}" onclick="pymkClick(${i},'${p.name}','${p.btn}')">${p.btn}</button>
        </div>
      `).join('')}
    </div>

    <div class="li-card news-card">
      <div class="news-title">Linked Out News</div>
      ${[
        { h:'Man buys kayak, lives in studio apartment',             m:'Top story · 2h ago' },
        { h:'MOONCOIN down 94%, investor "never felt more alive"',   m:'Finance · 45 min ago' },
        { h:'Area woman empties savings account, "feels free"',      m:'Personal Finance · 1h ago' },
        { h:'Fondue sets outsell index funds for first time',         m:'Markets · 3h ago' },
      ].map(n => `
        <div class="news-item" onclick="toast('${n.h}','${n.m}')">
          <div class="news-head">${n.h}</div>
          <div class="news-meta">${n.m}</div>
        </div>
      `).join('')}
    </div>

    <div class="li-card footer-links">
      About · Accessibility · Help Center<br>
      Privacy &amp; Terms · Ad Choices<br>
      Advertising · Business Services<br><br>
      Financial Ruin Academy © 2026<br>
      <em>Linked Out is a parody. No financial advice given.</em>
    </div>
  `;
}

function pymkClick(i, name, type) {
  const btn = document.getElementById('pymk-' + i);
  if (!btn || S.pymkDone[i]) return;
  S.pymkDone[i] = true;
  btn.textContent = type === 'Connect' ? '✓ Connected' : '✓ Following';
  btn.classList.add('done');
  toast(type === 'Connect' ? `Connected with ${name}` : `Following ${name}`, 'They have been notified. They seem surprised.', 'ok');
}

// init

function renderAll() {
  renderLeft();
  renderRight();
  renderS0();
  renderS1();
  renderS2();
  renderS3();
  renderS4();
}

function init() {
  renderAll();

  // set section height from actual container size
  requestAnimationFrame(() => {
    setSectionHeight();
    goToSection(0, true);
    initScroll();
  });

  // close reaction popup on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#reaction-popup') && !e.target.closest('.react-btn')) {
      document.getElementById('reaction-popup').style.display = 'none';
      S.activeItem = null;
    }
  });

  // dot clicks already handled via onclick in html
}

document.addEventListener('DOMContentLoaded', init);
