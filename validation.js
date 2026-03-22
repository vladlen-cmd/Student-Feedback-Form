/**
 * validation.js — Symbiosis Admission Registration Form
 * Handles: real-time validation, password strength, toggle visibility,
 *          full form submit validation, success screen.
 */

'use strict';

/* ── Helpers ── */
const $ = id => document.getElementById(id);
const setError = (groupId, msgId, msg) => {
  const group = $(groupId);
  const span  = $(msgId);
  group.classList.add('has-error');
  group.classList.remove('has-success');
  span.textContent = msg;
};
const setSuccess = (groupId, msgId) => {
  const group = $(groupId);
  const span  = $(msgId);
  group.classList.remove('has-error');
  group.classList.add('has-success');
  span.textContent = '';
};
const clearState = (groupId, msgId) => {
  const group = $(groupId);
  const span  = $(msgId);
  group.classList.remove('has-error', 'has-success');
  span.textContent = '';
};

/* ── Validation Rules ── */
const RULES = {
  name(v) {
    const trimmed = v.trim();
    if (!trimmed)                        return 'Full name is required.';
    if (trimmed.length < 3)              return 'Name must be at least 3 characters.';
    if (trimmed.length > 80)             return 'Name must not exceed 80 characters.';
    if (!/^[A-Za-z\s'.'-]+$/.test(trimmed)) return 'Name may only contain letters and spaces.';
    return null;
  },
  email(v) {
    const trimmed = v.trim();
    if (!trimmed)          return 'Email address is required.';
    // RFC-5322 simplified regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(trimmed)) return 'Enter a valid email address (e.g. user@domain.com).';
    return null;
  },
  password(v) {
    if (!v)         return 'Password is required.';
    if (v.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter.';
    if (!/[a-z]/.test(v)) return 'Include at least one lowercase letter.';
    if (!/\d/.test(v))    return 'Include at least one digit (0-9).';
    if (!/[^A-Za-z0-9]/.test(v)) return 'Include at least one special character (!@#$…).';
    return null;
  },
  confirm(v, pw) {
    if (!v)     return 'Please confirm your password.';
    if (v !== pw) return 'Passwords do not match.';
    return null;
  },
  gender() {
    const checked = document.querySelector('input[name="gender"]:checked');
    return checked ? null : 'Please select your gender.';
  },
  course(v) {
    return v ? null : 'Please select a programme / course.';
  },
  terms() {
    return $('terms').checked ? null : 'You must agree to the Terms & Conditions.';
  }
};

/* ── Password Strength ── */
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)                  score++;
  if (pw.length >= 12)                 score++;
  if (/[A-Z]/.test(pw))               score++;
  if (/[a-z]/.test(pw))               score++;
  if (/\d/.test(pw))                  score++;
  if (/[^A-Za-z0-9]/.test(pw))        score++;
  return score; // 0-6
}
function renderStrength(pw) {
  const bar   = $('strength-bar');
  const label = $('strength-label');
  if (!pw) { bar.style.width = '0%'; label.textContent = ''; return; }
  const score = getStrength(pw);
  const pct   = Math.round((score / 6) * 100) + '%';
  const map   = [
    { w: '16%', c: '#475569', t: '⚠ Very Weak' },
    { w: '30%', c: '#64748b', t: '⚠ Weak' },
    { w: '48%', c: '#94a3b8', t: '◐ Fair' },
    { w: '65%', c: '#b0bec5', t: '✔ Good' },
    { w: '82%', c: '#cbd5e1', t: '✔ Strong' },
    { w: '100%',c: '#e2e8f0', t: '✔✔ Very Strong' },
  ];
  const idx = Math.max(0, Math.min(score - 1, 5));
  bar.style.width      = map[idx].w;
  bar.style.background = map[idx].c;
  label.textContent    = map[idx].t;
  label.style.color    = map[idx].c;
}

/* ── Toggle Password Visibility ── */
function setupToggle(btnId, inputId) {
  const btn   = $(btnId);
  const input = $(inputId);
  if (!btn || !input) return;
  const toggle = () => {
    const shown = input.type === 'text';
    input.type  = shown ? 'password' : 'text';
    const icon  = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-lock',      shown);
      icon.classList.toggle('fa-lock-open', !shown);
    }
    btn.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
  };
  btn.addEventListener('click', toggle);
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') toggle(); });
}

/* ── Field Validators (called on blur / input) ── */
function validateName(live) {
  const val = $('name').value;
  const err = RULES.name(val);
  if (live && !val) { clearState('group-name', 'name-error'); return true; }
  if (err) { setError('group-name', 'name-error', err); return false; }
  setSuccess('group-name', 'name-error'); return true;
}
function validateEmail(live) {
  const val = $('email').value;
  const err = RULES.email(val);
  if (live && !val) { clearState('group-email', 'email-error'); return true; }
  if (err) { setError('group-email', 'email-error', err); return false; }
  setSuccess('group-email', 'email-error'); return true;
}
function validatePassword(live) {
  const val = $('password').value;
  renderStrength(val);
  const err = RULES.password(val);
  if (live && !val) { clearState('group-password', 'password-error'); return true; }
  if (err) { setError('group-password', 'password-error', err); return false; }
  setSuccess('group-password', 'password-error'); return true;
}
function validateConfirm(live) {
  const val = $('confirmPassword').value;
  const pw  = $('password').value;
  const err = RULES.confirm(val, pw);
  if (live && !val) { clearState('group-confirm', 'confirm-error'); return true; }
  if (err) { setError('group-confirm', 'confirm-error', err); return false; }
  setSuccess('group-confirm', 'confirm-error'); return true;
}
function validateGender() {
  const err = RULES.gender();
  if (err) { setError('group-gender', 'gender-error', err); return false; }
  setSuccess('group-gender', 'gender-error'); return true;
}
function validateCourse() {
  const err = RULES.course($('course').value);
  if (err) { setError('group-course', 'course-error', err); return false; }
  setSuccess('group-course', 'course-error'); return true;
}
function validateTerms() {
  const err = RULES.terms();
  if (err) { setError('terms-row', 'terms-error', err); return false; }
  $('terms-error').textContent = ''; return true;
}

/* ── Full Form Validation ── */
function validateAll() {
  const n  = validateName(false);
  const e  = validateEmail(false);
  const p  = validatePassword(false);
  const c  = validateConfirm(false);
  const g  = validateGender();
  const cu = validateCourse();
  const t  = validateTerms();
  return n && e && p && c && g && cu && t;
}

/* ── Reset ── */
function resetForm() {
  $('registrationForm').reset();
  ['group-name','group-email','group-password','group-confirm','group-gender','group-course']
    .forEach(id => { const el = $(id); if(el) el.classList.remove('has-error','has-success'); });
  ['name-error','email-error','password-error','confirm-error','gender-error','course-error','terms-error']
    .forEach(id => { const el = $(id); if(el) el.textContent = ''; });
  $('strength-bar').style.width = '0%';
  $('strength-label').textContent = '';
  $('successMsg').classList.add('hidden');
  $('registrationForm').classList.remove('hidden');
}
window.resetForm = resetForm;

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {

  /* Real-time listeners */
  $('name').addEventListener('input',  () => validateName(true));
  $('name').addEventListener('blur',   () => validateName(false));

  $('email').addEventListener('input', () => validateEmail(true));
  $('email').addEventListener('blur',  () => validateEmail(false));

  $('password').addEventListener('input', () => {
    validatePassword(true);
    if ($('confirmPassword').value) validateConfirm(true);
  });
  $('password').addEventListener('blur', () => validatePassword(false));

  $('confirmPassword').addEventListener('input', () => validateConfirm(true));
  $('confirmPassword').addEventListener('blur',  () => validateConfirm(false));

  document.querySelectorAll('input[name="gender"]')
    .forEach(r => r.addEventListener('change', validateGender));

  $('course').addEventListener('change', validateCourse);

  /* Password toggles */
  setupToggle('togglePw',  'password');
  setupToggle('toggleCpw', 'confirmPassword');

  /* Form submit */
  $('registrationForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll()) {
      /* Scroll to first error */
      const firstErr = document.querySelector('.has-error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    /* Animate button */
    const btn = $('submitBtn');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Processing…';

    setTimeout(() => {
      $('registrationForm').classList.add('hidden');
      $('successMsg').classList.remove('hidden');
    }, 1200);
  });
});
