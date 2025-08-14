import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
	// Ignore build artifacts and this config file
	{ ignores: ['node_modules', '.next', 'dist', 'coverage', 'eslint.config.mjs'] },

	// Base JS rules
	js.configs.recommended,

	// TypeScript (non type-aware to avoid parserOptions requirement for every file)
	...tseslint.configs.recommended,

	// Explicitly register Next.js plugin so Next detection can find it in flat config
	{ plugins: { '@next/next': nextPlugin } },

	// Next.js core web vitals ruleset via plugin
	{ rules: { ...nextPlugin.configs['core-web-vitals'].rules } },

	// Project-specific overrides
	{ rules: { 'react/no-unescaped-entities': 'off' } },

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
