module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base'
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    project: 'tsconfig.json',
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [ 'error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
    }],
  },
};
