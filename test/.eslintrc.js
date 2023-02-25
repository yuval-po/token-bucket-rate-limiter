module.exports = {
	root: true,
	env: {
		"es6": true,
		node: true,
	},
	extends: [
		'airbnb-base',
		'airbnb-typescript/base',
		"eslint:recommended",

	],
	parserOptions: {
		ecmaVersion: 2021,
		project: './tsconfig.json'
	},
	rules: {
		"import/prefer-default-export": "off",
		"arrow-body-style": "off",
		"class-methods-use-this": "off",
		"no-restricted-syntax": "off",
		"no-continue": "off",
		"no-console": "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		"import/no-unresolved": "off",
		"max-len": ["error", { "code": 135}],
		"no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1}],
		"no-tabs": "off",
		  "@typescript-eslint/indent": "off",
		"@typescript-eslint/comma-dangle": "off",
		"comma-dangle": ["error", {
			"arrays": "never",
			"objects": "never",
			"imports": "never",
			"exports": "never",
			"functions": "never"
		}],
		"padded-blocks": "off",
		"no-lonely-if": "off"
	},
	overrides: [
		{
			// TypeScript
			files: ["**/*.ts"],
			parser: '@typescript-eslint/parser',
			extends: [
				'airbnb-base',
				'airbnb-typescript/base',
			],
			"env": {
				"es6": true,
				"node": true
			},
			parserOptions: {
				project: './tsconfig.json'
			},
			rules: {
				"import/prefer-default-export": "off",
				"arrow-body-style": "off",
				"class-methods-use-this": "off",
				"no-restricted-syntax": "off",
				"no-continue": "off",
				"no-plusplus": "off",
				"no-console": "off",
				"no-underscore-dangle": ["error", { "allowAfterThis": true }],
				"no-trailing-spaces": "error",
				"spaced-comment": ["error", "always", {
					"line": {
						"markers": ["#region", "#endregion"]
					}
				}],
				"max-len": ["error", { "code": 135 }],
				"no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1}],
				"no-tabs": "off",
				"@typescript-eslint/indent": "off",
				"@typescript-eslint/comma-dangle": "off",
				"comma-dangle": ["error", {
					"arrays": "never",
					"objects": "never",
					"imports": "never",
					"exports": "never",
					"functions": "never"
				}],
				"padded-blocks": "off",
				"no-lonely-if": "off",
				"object-curly-newline": ["error", { "ImportDeclaration": { "minProperties": 6 } }]
			}
		},
		{
			files: [
				"**/__test__/*.{j,t}s?(x)",
				"**/test/unit/**/*.spec.{j,t}s?(x)",
			],
			env: {
				mocha: true,
			},
		},
		{
			files: ["**/*.js"],
			extends: [
				"eslint:recommended",
			],
			"env": {
				"es6": true,
				"node": true
			},
		},
	],
	settings: {
		'import/core-modules': ['express'],
	  },
};
