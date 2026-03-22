'use strict';

const $ = id => document.getElementById(id);

const setError = (groupId, msgId, msg) => {
  const group = $(groupId);
  const span  = $(msgId);
  if (group) { group.classList.add('has-error'); group.classList.remove('has-success'); }
  if (span)  span.textContent = msg;
};

const setSuccess = (groupId, msgId) => {
  const group = $(groupId);
  const span  = $(msgId);
  if (group) { group.classList.remove('has-error'); group.classList.add('has-success'); }
  if (span)  span.textContent = '';
};

const clearState = (groupId, msgId) => {
  const group = $(groupId);
  const span  = $(msgId);
  if (group) group.classList.remove('has-error', 'has-success');
  if (span)  span.textContent = '';
};

const RULES = {
  studentName(v) {
    const t = v.trim();
    if (!t)                            return 'Student name is required.';
    if (t.length < 2)                  return 'Name must be at least 2 characters.';
    if (t.length > 100)                return 'Name must not exceed 100 characters.';
    if (!/^[A-Za-z\s'.'-]+$/.test(t)) return 'Name may only contain letters and spaces.';
    return null;
  },
  emailId(v) {
    const t = v.trim();
    if (!t)          return 'Email ID is required.';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(t)) return 'Enter a valid email address (e.g. student@college.edu).';
    return null;
  },
  mobileNumber(v) {
    const t = v.trim();
    if (!t) return 'Mobile number is required.';
    const digits = t.replace(/[\s\-().+]/g, '');
    if (!/^\d+$/.test(digits)) return 'Mobile number must contain valid digits only.';
    if (digits.length < 7)     return 'Mobile number must have at least 7 digits.';
    if (digits.length > 15)    return 'Mobile number must not exceed 15 digits.';
    return null;
  },
  department(v) {
    return v ? null : 'Please select your department.';
  },
  gender() {
    const checked = document.querySelector('input[name="gender"]:checked');
    return checked ? null : 'Please select your gender.';
  },
  feedbackComments(v) {
    const t = v.trim();
    if (!t) return 'Feedback comments are required.';
    const wordCount = countWords(t);
    if (wordCount < 10) return `Comments must be at least 10 words (currently ${wordCount} word${wordCount === 1 ? '' : 's'}).`;
    return null;
  },
};

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function updateWordCount(text) {
  const count  = countWords(text.trim());
  const el     = $('feedback-wordcount');
  if (!el) return;
  const needed = Math.max(0, 10 - count);
  if (count >= 10) {
    el.textContent = `✔ ${count} words — minimum met`;
    el.className   = 'ok';
  } else if (count === 0) {
    el.textContent = `0 / 10 words minimum`;
    el.className   = 'bad';
  } else {
    el.textContent = `${count} / 10 — ${needed} more word${needed === 1 ? '' : 's'} needed`;
    el.className   = 'bad';
  }
}

function validateName(live) {
  const val = $('studentName').value;
  const err = RULES.studentName(val);
  if (live && !val.trim()) { clearState('group-name', 'name-error'); return true; }
  if (err) { setError('group-name', 'name-error', err); return false; }
  setSuccess('group-name', 'name-error'); return true;
}

function validateEmail(live) {
  const val = $('emailId').value;
  const err = RULES.emailId(val);
  if (live && !val.trim()) { clearState('group-email', 'email-error'); return true; }
  if (err) { setError('group-email', 'email-error', err); return false; }
  setSuccess('group-email', 'email-error'); return true;
}

function validateMobile(live) {
  const val = $('mobileNumber').value;
  const err = RULES.mobileNumber(val);
  if (live && !val.trim()) { clearState('group-mobile', 'mobile-error'); return true; }
  if (err) { setError('group-mobile', 'mobile-error', err); return false; }
  setSuccess('group-mobile', 'mobile-error'); return true;
}

function validateDepartment() {
  const val = $('department').value;
  const err = RULES.department(val);
  if (err) { setError('group-department', 'department-error', err); return false; }
  setSuccess('group-department', 'department-error'); return true;
}

function validateGender() {
  const err = RULES.gender();
  if (err) { setError('group-gender', 'gender-error', err); return false; }
  setSuccess('group-gender', 'gender-error'); return true;
}

function validateFeedback(live) {
  const val = $('feedbackComments').value;
  const err = RULES.feedbackComments(val);
  if (live && !val.trim()) { clearState('group-feedback', 'feedback-error'); return true; }
  if (err) { setError('group-feedback', 'feedback-error', err); return false; }
  setSuccess('group-feedback', 'feedback-error'); return true;
}

function validateAll() {
  const n = validateName(false);
  const e = validateEmail(false);
  const m = validateMobile(false);
  const d = validateDepartment();
  const g = validateGender();
  const f = validateFeedback(false);
  return n && e && m && d && g && f;
}

function setupStarRating() {
  const stars      = document.querySelectorAll('#starRow i');
  const ratingInput = $('rating');
  let current = 0;

  function highlight(n) {
    stars.forEach((s, i) => s.classList.toggle('active', i < n));
  }

  stars.forEach((star, idx) => {
    star.addEventListener('mouseover', () => highlight(idx + 1));
    star.addEventListener('mouseleave', () => highlight(current));
    star.addEventListener('click', () => {
      current = idx + 1;
      ratingInput.value = current;
      highlight(current);
    });
    star.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        current = idx + 1;
        ratingInput.value = current;
        highlight(current);
      }
    });
  });
}

function triggerReset() {
  $('feedbackForm').reset();

  ['group-name','group-email','group-mobile','group-department','group-gender','group-feedback']
    .forEach(id => {
      const el = $(id);
      if (el) el.classList.remove('has-error', 'has-success');
    });

  ['name-error','email-error','mobile-error','department-error','gender-error','feedback-error']
    .forEach(id => {
      const el = $(id);
      if (el) el.textContent = '';
    });

  updateWordCount('');

  document.querySelectorAll('#starRow i').forEach(s => s.classList.remove('active'));
  if ($('rating')) $('rating').value = '';

  $('successMsg').classList.add('hidden');
  $('feedbackForm').classList.remove('hidden');
}
window.triggerReset = triggerReset;

document.addEventListener('DOMContentLoaded', () => {

  $('studentName').addEventListener('input',  () => validateName(true));
  $('studentName').addEventListener('blur',   () => validateName(false));

  $('emailId').addEventListener('input', () => validateEmail(true));
  $('emailId').addEventListener('blur',  () => validateEmail(false));

  $('mobileNumber').addEventListener('input', () => validateMobile(true));
  $('mobileNumber').addEventListener('blur',  () => validateMobile(false));

  $('department').addEventListener('change', validateDepartment);

  document.querySelectorAll('input[name="gender"]')
    .forEach(r => r.addEventListener('change', validateGender));

  $('feedbackComments').addEventListener('input', () => {
    updateWordCount($('feedbackComments').value);
    validateFeedback(true);
  });
  $('feedbackComments').addEventListener('blur', () => validateFeedback(false));

  setupStarRating();

  $('resetBtn').addEventListener('click', () => {
    setTimeout(triggerReset, 0);
  });

  $('feedbackForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll()) {
      const firstErr = document.querySelector('.form-group.has-error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const btn = $('submitBtn');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Submitting…';
    setTimeout(() => {
      $('feedbackForm').classList.add('hidden');
      $('successMsg').classList.remove('hidden');
      $('successMsg').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1000);
  });

  updateWordCount('');
});
