/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: ['standard-with-typescript', 'plugin:unicorn/recommended'],
    env: {
        es2024: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
    },
    rules: {
        '@typescript-eslint/brace-style': ['warn', 'stroustrup', { allowSingleLine: true }],
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/indent': ['warn', 4],
        '@typescript-eslint/member-delimiter-style': ['warn', { multiline: { delimiter: 'semi' } }],
        '@typescript-eslint/prefer-nullish-coalescing': 0,
        '@typescript-eslint/return-await': 0,
        '@typescript-eslint/space-before-function-paren': ['warn', {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'always'
        }],
        '@typescript-eslint/semi': ['warn', 'always'],
        '@typescript-eslint/strict-boolean-expressions': 0,
        'arrow-body-style': ['warn', 'as-needed'],
        'arrow-parens': ['warn', 'as-needed'],
        'brace-style': ['warn', 'stroustrup', { allowSingleLine: true }],
        'consistent-return': ['warn'],
        'import/extensions': ['warn', 'always'],
        'indent': ['warn', 4],
        'linebreak-style': ['warn', 'windows'],
        'max-len': ['error', 100, 4, {
            ignoreComments: true,
            ignoreRegExpLiterals: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreUrls: true
        }],
        'no-multiple-empty-lines': ['warn', { max: 3, maxBOF: 0, maxEOF: 1 }],
        'no-param-reassign': ['warn', { props: false }],
        'object-curly-newline': ['warn', { consistent: true }],
        'semi': ['warn', 'always'],
        'unicorn/no-null': 0,
        'unicorn/prefer-query-selector': 0,
        'unicorn/prevent-abbreviations': 0,
        'quote-props': ['warn', 'consistent-as-needed']
    }
};
