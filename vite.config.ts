import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from './adapter-bun.ts';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

type CompileOption = NonNullable<
	NonNullable<Parameters<typeof adapter>[0]>['buildOptions']
>['compile'];

const compile: CompileOption =
	process.env.COMPILE === '1'
		? ({
				outfile: 'marketo-web',
				...(process.env.COMPILE_TARGET ? { target: process.env.COMPILE_TARGET } : {})
			} as CompileOption)
		: undefined;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({
				out: compile ? 'dist' : 'build',
				buildOptions: compile ? { compile, minify: true, sourcemap: 'none' } : {}
			}),

			typescript: {
				config: (config) => {
					config.include.push('../drizzle.config.ts');
				}
			}
		}),

		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true
		})
	]
});
