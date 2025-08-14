import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import tseslint from 'typescript-eslint'

export default [
	// Ignore build artifacts and this config file
	{ ignores: ['node_modules', '.next', 'dist', 'coverage', 'eslint.config.mjs'] },

	// Base JS rules
	js.configs.recommended,

	// TypeScript (non type-aware to avoid parserOptions requirement for every file)
	...tseslint.configs.recommended,

	// Next.js core web vitals
	{ plugins: { '@next/next': nextPlugin }, rules: nextPlugin.configs['core-web-vitals'].rules },

	// TS-specific tweaks
	{
		files: ['**/*.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/ban-ts-comment': [
				'error',
				{ 'ts-ignore': 'allow-with-description' },
			],
		},
	},

	// Node/CommonJS context for config files
	{
		files: ['postcss.config.js'],
		languageOptions: {
			globals: {
				module: 'readonly',
				require: 'readonly',
				__dirname: 'readonly',
				process: 'readonly',
				exports: 'readonly',
			},
			sourceType: 'script',
		},
	},
]
