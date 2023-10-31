module.exports = {
	env: {
		browser: true,
		node: true,
		es2021: true,
	},
	extends: ['prettier', 'eslint:recommended'],
	plugins: ['prettier'],
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
	},
	rules: {
		'linebreak-style': ['error', 'unix'],
		semi: ['error', 'always'],
	},
};
