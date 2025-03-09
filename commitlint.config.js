export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'never'],
    'body-max-line-length': [0, 'always']
  }
};
