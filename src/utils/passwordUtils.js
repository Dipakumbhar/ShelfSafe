export const PASSWORD_RULES = [
  {
    key: 'minLength',
    label: 'At least 6 characters',
    test: (password) => password.length >= 6,
  },
  {
    key: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    key: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    key: 'number',
    label: 'One number',
    test: (password) => /\d/.test(password),
  },
  {
    key: 'special',
    label: 'One special character',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export const getPasswordChecks = (password = '') => {
  return PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    passed: rule.test(password),
  }));
};

export const validatePasswordStrength = (password = '') => {
  const checks = getPasswordChecks(password);
  const failedChecks = checks.filter((check) => !check.passed);

  return {
    checks,
    isValid: failedChecks.length === 0,
    message: failedChecks.length
      ? 'Password must include at least 6 characters, uppercase, lowercase, number, and special character.'
      : '',
  };
};
