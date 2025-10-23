import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig(({ mode }) => {
    const entryDir = mode ? `src/${mode}` : 'src';
    const publicDir = mode ? `src/${mode}/public` : 'assets';
    const outDir = mode ? path.resolve(__dirname, `extension/${mode}`) : './dist';

    return {
        root: path.resolve(__dirname, entryDir),
        publicDir: path.resolve(__dirname, publicDir),
        plugins: [
            react(),
            {
                name: "html-prefix-assets",
                apply: "build",
                transformIndexHtml: {
                    order: "post",
                    handler(html) {
                        return mode ? html.replace(/(\s(?:src|href)=["'])\/assets\//g, `$1/${mode}/assets/`) : html
                    }
                }
            }
        ],
        resolve: {
            alias: {
                '@rocketbox-react': path.resolve(__dirname, './src'), // Maps to current shared directory for future package migration 
            },
        },
        build: {
            outDir,
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, `${entryDir}/index.html`),
                },
                output: {
                    entryFileNames: 'assets/[name].js',
                    chunkFileNames: 'assets/[name].js',
                    assetFileNames: 'assets/[name].[ext]',
                    plugins: [
                        {
                            name: 'html-path-rewrite',
                            generateBundle(_, bundle) {
                                for (const key in bundle) {
                                    if (bundle[key].type === 'asset' && bundle[key].fileName.endsWith('.html')) {
                                        // Rewrite the path for the HTML file 
                                        bundle[key].fileName = 'index.html';
                                    }
                                }
                            },
                        }
                    ],
                },
            },
        },
    };
});
