/* Shared Supabase authentication UI for Research Toolkit.
 * Publishable key is intended for browser use; database access remains protected by RLS.
 * This enables sign-in only. Data synchronization is implemented separately.
 */
(function () {
  'use strict';
  const SUPABASE_URL = 'https://zvhknguwpbgjiltgswip.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xMFFEDyMSiriZ1FNCTqlzg_PWSpvrqL';
  const css = `
  #rt-auth-bar{position:sticky;top:0;z-index:9998;background:#10283f;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 8px #0002;font:14px system-ui,sans-serif}
  #rt-auth-bar .rt-brand{font-weight:800}#rt-auth-bar .rt-status{font-size:12px;color:#d6e5ec}
  #rt-auth-bar button{border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;background:#176c72;color:#fff}
  #rt-auth-bar button.rt-light{background:#fff;color:#10283f}
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
  bar.innerHTML = '<div><div class="rt-brand">Research Toolkit · Cloud account</div><div class="rt-status" id="rt-auth-status">Not signed in</div></div><div style="display:flex;gap:8px;align-items:center"><button id="rt-signin-open" class="rt-light" type="button">Sign in / Create account</button><button id="rt-signout" type="button" style="display:none">Sign out</button></div>';
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
    $('rt-auth-status').textContent = user ? 'Signed in as ' + user.email : 'Not signed in · cloud sync not yet connected';
    $('rt-signin-open').style.display = user ? 'none' : '';
    $('rt-signout').style.display = user ? '' : 'none';
  }
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
    const { error } = await supabase.auth.signOut();
    if (error) { $('rt-auth-status').textContent = 'Sign-out failed: ' + error.message; return; }
    showSession(null);
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