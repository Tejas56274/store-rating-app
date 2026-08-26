const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 8-16 chars, at least one uppercase letter, at least one special character
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`;']).{8,16}$/;

function validateName(name) {
  if (typeof name !== 'string') return 'Name is required';
  if (name.length < 20 || name.length > 60) {
    return 'Name must be between 20 and 60 characters';
  }
  return null;
}

function validateAddress(address) {
  if (typeof address !== 'string' || address.length === 0) {
    return 'Address is required';
  }
  if (address.length > 400) {
    return 'Address must be at most 400 characters';
  }
  return null;
}

function validateEmail(email) {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return 'A valid email address is required';
  }
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    return 'Password must be 8-16 characters and include at least one uppercase letter and one special character';
  }
  return null;
}

function validateRatingValue(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    return 'Rating must be an integer between 1 and 5';
  }
  return null;
}

// Runs a list of {field, error} checks and returns the first set of errors found (or null)
function collectErrors(checks) {
  const errors = {};
  for (const [field, error] of checks) {
    if (error) errors[field] = error;
  }
  return Object.keys(errors).length ? errors : null;
}

module.exports = {
  validateName,
  validateAddress,
  validateEmail,
  validatePassword,
  validateRatingValue,
  collectErrors,
};
