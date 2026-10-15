/* Shared Supabase authentication UI for Research Toolkit.
 * Publishable key is intended for browser use; database access remains protected by RLS.
 * This enables sign-in only. Data synchronization is implemented separately.
 */
(function () {
  'use strict';
  const SUPABASE_URL = 'https://zvhknguwpbgjiltgswip.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xMFFEDyMSiriZ1FNCTqlzg_PWSpvrqL';
  const css = `
  #rt-auth-bar{position:sticky;top:0;z-index:9998;min-height:64px;background:#173F35;color:#fff;padding:10px clamp(14px,2.5vw,32px);display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:2px solid #D96C4F;font:14px Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  #rt-auth-bar [hidden]{display:none!important}
  #rt-auth-bar .rt-brand-wrap{display:flex;align-items:center;gap:11px;min-width:0}
  #rt-auth-bar .rt-logo{display:grid;place-items:center;width:36px;height:36px;flex:0 0 36px;border-radius:9px;background:#245B49;color:#fff;font-weight:850;font-size:13px;letter-spacing:-.04em;border:1px solid #477663}
  #rt-auth-bar .rt-brand{font-weight:780;font-size:16px;letter-spacing:-.02em;color:#fff;white-space:nowrap}
  #rt-auth-bar .rt-brand-sub{font-size:11px;color:#cbded4;margin-top:2px}
  #rt-auth-bar .rt-controls{display:flex;align-items:center;justify-content:flex-end;gap:10px;min-width:0}
  #rt-auth-bar .rt-status{font-size:12px;color:#e2eee7}
  #rt-auth-bar .rt-sync-state{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 10px;border:1px solid #477663;border-radius:7px;color:#e2eee7;font-size:12px;white-space:nowrap}
  #rt-auth-bar .rt-sync-dot{width:7px;height:7px;border-radius:50%;background:#d7b77b;flex:0 0 7px}
  #rt-auth-bar .rt-sync-state[data-state="synced"] .rt-sync-dot{background:#9ed5ad}
  #rt-auth-bar .rt-sync-state[data-state="error"] .rt-sync-dot{background:#ff9e88}
  #rt-auth-bar button{min-height:36px;border:1px solid #477663;border-radius:7px;padding:8px 12px;font:inherit;font-size:12px;font-weight:650;cursor:pointer;background:#245B49;color:#fff}
  #rt-auth-bar button:hover{background:#2d6a54}
  #rt-auth-bar button:focus-visible,#rt-auth-bar a:focus-visible{outline:3px solid #F0B49C;outline-offset:3px}
  #rt-auth-bar button.rt-light{background:#f7f5ef;color:#173F35;border-color:#f7f5ef}
  #rt-auth-bar .rt-profile{position:relative}
  #rt-auth-bar .rt-profile-trigger{display:flex;align-items:center;gap:9px;background:transparent;border-color:#477663;text-align:left;max-width:260px}
  #rt-auth-bar .rt-avatar{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#d9e8dc;color:#173F35;font-weight:800;flex:0 0 26px}
  #rt-auth-bar .rt-profile-copy{min-width:0;display:grid;gap:1px}
  #rt-auth-bar .rt-profile-name{font-size:12px;font-weight:750;max-width:175px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #rt-auth-bar .rt-profile-caption{font-size:10px;color:#d4e3d9;font-weight:500}
  #rt-auth-bar .rt-chevron{font-size:11px;color:#d4e3d9}
  #rt-auth-bar .rt-profile-menu{position:absolute;right:0;top:calc(100% + 9px);z-index:10001;width:min(290px,calc(100vw - 28px));padding:8px;background:#fff;border:1px solid #e2e6df;border-radius:10px;box-shadow:0 12px 30px #10251d20;color:#172334}
  #rt-auth-bar .rt-profile-menu[hidden]{display:none}
  #rt-auth-bar .rt-menu-identity{padding:10px 11px 12px;border-bottom:1px solid #edf0eb;margin-bottom:5px;overflow-wrap:anywhere}
  #rt-auth-bar .rt-menu-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748B;font-weight:750;margin-bottom:5px}
  #rt-auth-bar .rt-menu-email{font-size:12px;color:#172334;font-weight:650;line-height:1.5}
  #rt-auth-bar .rt-menu-item{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;text-align:left;background:transparent;color:#172334;border:0;border-radius:6px;padding:9px 11px;font-size:13px;font-weight:650}
  #rt-auth-bar .rt-menu-item:hover,#rt-auth-bar .rt-menu-item:focus-visible{background:#edf4ee;color:#173F35}
  #rt-auth-bar .rt-menu-item .rt-menu-icon{width:18px;text-align:center;font-size:15px}
  #rt-auth-bar .rt-signin{white-space:nowrap}
  #rt-auth-modal{color:#172334}
  @media(max-width:720px){#rt-auth-bar{min-height:58px;gap:10px;padding:9px 12px}#rt-auth-bar .rt-brand{font-size:14px}#rt-auth-bar .rt-brand-sub{display:none}#rt-auth-bar .rt-controls{gap:6px}#rt-auth-bar .rt-sync-state{padding:0 8px;font-size:11px}#rt-auth-bar .rt-profile-trigger{padding:5px 7px;gap:6px}#rt-auth-bar .rt-profile-caption{display:none}#rt-auth-bar .rt-profile-name{max-width:100px}}
  @media(max-width:460px){#rt-auth-bar{align-items:center}#rt-auth-bar .rt-logo{width:32px;height:32px;flex-basis:32px}#rt-auth-bar .rt-brand{font-size:13px}#rt-auth-bar .rt-brand-wrap{gap:7px}#rt-auth-bar .rt-controls{gap:5px}#rt-auth-bar .rt-sync-state{min-height:32px;font-size:0;gap:0;padding:0 9px}#rt-auth-bar .rt-sync-dot{width:8px;height:8px;flex-basis:8px}#rt-auth-bar .rt-profile-trigger{min-height:32px}#rt-auth-bar .rt-profile-name{max-width:75px}#rt-auth-bar .rt-chevron{display:none}#rt-auth-bar .rt-signin{font-size:11px;padding:7px 9px}}
  @media(prefers-reduced-motion:reduce){#rt-auth-bar *{scroll-behavior:auto!important;transition:none!important}}
  #rt-auth-modal{position:fixed;inset:0;z-index:10000;background:#071827aa;display:none;align-items:center;justify-content:center;padding:18px;font:14px system-ui,sans-serif}
  #rt-auth-modal.rt-open{display:flex}#rt-auth-modal .rt-card{width:min(430px,100%);background:#fff;color:#17202a;border-radius:16px;padding:24px;box-shadow:0 20px 70px #0004}
  #rt-auth-modal h2{margin:0 0 6px;font-size:23px}#rt-auth-modal p{color:#5e6d79;line-height:1.5}
  #rt-auth-modal label{display:block;font-weight:700;margin:12px 0 5px}
  #rt-auth-modal input{width:100%;padding:11px;border:1px solid #cbd6df;border-radius:8px;box-sizing:border-box;font:inherit}
  #rt-auth-modal .rt-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
  #rt-auth-modal .rt-message{font-size:13px;white-space:pre-wrap;margin-top:12px;color:#225d4a}
  #rt-auth-modal .rt-message.rt-error{color:#a12d2d}#rt-auth-modal .rt-link{background:none;color:#176c72;padding:8px 0;text-decoration:underline}
  @media(max-width:520px){#rt-auth-bar{align-items:flex-start}#rt-auth-bar .rt-brand{font-size:12px}#rt-auth-bar .rt-status{max-width:180px}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const bar = document.createElement('div');
  bar.id = 'rt-auth-bar';
  bar.setAttribute('aria-label','Research Toolkit account bar');
  bar.innerHTML = '<div class="rt-brand-wrap"><div class="rt-logo" aria-hidden="true">RT</div><div><div class="rt-brand">Research Toolkit</div><div class="rt-brand-sub">Your research workspace</div></div></div><div class="rt-controls"><div id="rt-cloud-state" class="rt-sync-state" data-state="unknown" role="status" aria-live="polite" title="Cloud synchronization status" hidden><span class="rt-sync-dot" aria-hidden="true"></span><span id="rt-cloud-state-label">Sync not confirmed</span></div><button id="rt-cloud-sync" type="button" hidden disabled aria-label="Sync projects and tasks to your account" title="Sign in to enable cloud sync">Sync</button><button id="rt-signin-open" class="rt-light rt-signin" type="button">Sign in</button><div class="rt-profile" id="rt-profile" hidden><button id="rt-profile-trigger" class="rt-profile-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="rt-profile-menu"><span class="rt-avatar" id="rt-profile-avatar" aria-hidden="true">U</span><span class="rt-profile-copy"><span class="rt-profile-name" id="rt-profile-name">Account</span><span class="rt-profile-caption">Account menu</span></span><span class="rt-chevron" aria-hidden="true">▾</span></button><div class="rt-profile-menu" id="rt-profile-menu" role="menu" aria-labelledby="rt-profile-trigger" hidden><div class="rt-menu-identity"><div class="rt-menu-label">Signed in as</div><div class="rt-menu-email" id="rt-profile-email"></div></div><button class="rt-menu-item" id="rt-signout" type="button" role="menuitem"><span class="rt-menu-icon" aria-hidden="true">↪</span><span>Sign out</span></button></div></div></div><span class="rt-status" id="rt-auth-status" hidden>Not signed in</span>';
  document.body.insertBefore(bar, document.body.firstChild);
  const modal = document.createElement('div');
  modal.id = 'rt-auth-modal';
  modal.innerHTML = '<section class="rt-card" role="dialog" aria-modal="true" aria-labelledby="rt-auth-title"><h2 id="rt-auth-title">Sign in to Research Toolkit</h2><p id="rt-auth-subtitle">Use your email to create an account or sign in. Your existing browser data will not be deleted.</p><form id="rt-auth-form"><label for="rt-auth-email">Email</label><input id="rt-auth-email" type="email" autocomplete="email" required><label for="rt-auth-password">Password</label><input id="rt-auth-password" type="password" autocomplete="current-password" minlength="6" required><div class="rt-actions"><button id="rt-auth-submit" type="submit">Sign in</button><button id="rt-auth-switch" type="button" class="rt-light">Create account</button><button id="rt-auth-close" type="button" class="rt-light">Close</button></div></form><button id="rt-auth-reset" class="rt-link" type="button">Forgot password?</button><div id="rt-auth-message" class="rt-message" role="status"></div></section>';
  document.body.appendChild(modal);
  const $ = id => document.getElementById(id);
  let mode = 'signin';
  let supabase = null;
  function message(text, isError) { $('rt-auth-message').textContent = text || ''; $('rt-auth-message').classList.toggle('rt-error', !!isError); }
  function openModal(nextMode) { if (nextMode) mode = nextMode; updateMode(); modal.classList.add('rt-open'); message(''); }
  function closeModal() { modal.classList.remove('rt-open'); }
  function updateMode() {
    $('rt-auth-title').textContent = mode === 'signup' ? 'Create your account' : 'Sign in to Research Toolkit';
    $('rt-auth-submit').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    $('rt-auth-switch').textContent = mode === 'signup' ? 'I already have an account' : 'Create account';
    $('rt-auth-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  }
  function showSession(session) {
    const user = session && session.user;
    const email = user && user.email ? user.email : 'Account';
    const initial = email === 'Account' ? 'U' : email.trim().charAt(0).toUpperCase();
    $('rt-auth-status').textContent = user ? 'Signed in as ' + email : 'Not signed in';
    $('rt-signin-open').hidden = !!user;
    $('rt-profile').hidden = !user;
    $('rt-profile-name').textContent = email;
    $('rt-profile-email').textContent = email;
    $('rt-profile-avatar').textContent = initial;
    if (!user) closeProfileMenu();
  }
  function closeProfileMenu(focusTrigger) {
    const menu = $('rt-profile-menu'), trigger = $('rt-profile-trigger');
    if (!menu || !trigger) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focusTrigger) trigger.focus();
  }
  function openProfileMenu() {
    const menu = $('rt-profile-menu'), trigger = $('rt-profile-trigger');
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const first = menu.querySelector('[role="menuitem"]');
    if (first) first.focus();
  }
  $('rt-profile-trigger').addEventListener('click', () => {
    const open = $('rt-profile-trigger').getAttribute('aria-expanded') === 'true';
    if (open) closeProfileMenu(); else openProfileMenu();
  });
  $('rt-profile-menu').addEventListener('keydown', e => {
    const items = Array.from($('rt-profile-menu').querySelectorAll('[role="menuitem"]:not([disabled])'));
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    } else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeProfileMenu(true); }
    else if (e.key === 'Tab') closeProfileMenu();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#rt-profile')) closeProfileMenu();
  });
  $('rt-profile-trigger').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      if (e.key === 'ArrowDown') { e.preventDefault(); openProfileMenu(); }
    } else if (e.key === 'Escape') closeProfileMenu();
  });
  $('rt-signin-open').addEventListener('click', () => openModal('signin'));
  $('rt-auth-close').addEventListener('click', closeModal);
  $('rt-auth-switch').addEventListener('click', () => { mode = mode === 'signin' ? 'signup' : 'signin'; updateMode(); message(''); });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  $('rt-auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!supabase) { message('Authentication library did not load. Refresh this page and try again.', true); return; }
    const email = $('rt-auth-email').value.trim();
    const password = $('rt-auth-password').value;
    const submit = $('rt-auth-submit'); submit.disabled = true;
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href.split('#')[0] } });
        if (error) throw error;
        message(data.session ? 'Account created and signed in.' : 'Account created. Check your email for a confirmation link, then return here to sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        message('Signed in successfully.');
        setTimeout(closeModal, 700);
      }
    } catch (err) { message(err.message || 'Authentication failed.', true); }
    finally { submit.disabled = false; }
  });
  $('rt-auth-reset').addEventListener('click', async () => {
    if (!supabase) { message('Authentication library did not load. Refresh this page and try again.', true); return; }
    const email = $('rt-auth-email').value.trim();
    if (!email) { message('Enter your email above first, then select Forgot password.', true); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.href.split('#')[0] });
      if (error) throw error;
      message('If this email is registered, password-reset instructions will be sent.');
    } catch (err) { message(err.message || 'Could not request password reset.', true); }
  });
  $('rt-signout').addEventListener('click', async () => {
    if (!supabase) return;
    const button = $('rt-signout');
    button.disabled = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      closeProfileMenu();
      showSession(null);
      $('rt-auth-status').textContent = 'Signed out successfully';
    } catch (err) {
      openModal('signin');
      message('Sign-out failed: ' + (err.message || String(err)), true);
    } finally { button.disabled = false; }
  });
  function init() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      $('rt-auth-status').textContent = 'Authentication library did not load · check connection and refresh';
      return;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.rtSupabase = supabase;
    window.dispatchEvent(new CustomEvent('rt-supabase-ready', { detail: { client: supabase } }));
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) { $('rt-auth-status').textContent = 'Session check failed: ' + error.message; return; }
      showSession(data.session);
    });
    supabase.auth.onAuthStateChange((_event, session) => { showSession(session); window.dispatchEvent(new CustomEvent('rt-auth-state', { detail: { session } })); });
  }
  const lib = document.createElement('script');
  lib.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  lib.onload = init;
  lib.onerror = () => { $('rt-auth-status').textContent = 'Could not load Supabase client library'; };
  document.head.appendChild(lib);
})();