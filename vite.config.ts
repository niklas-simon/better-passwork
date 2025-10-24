import path from 'node:path'
import { crx, CrxPlugin } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import manifest from './manifest.config.js'
import { name, version } from './package.json'

export default configurate();

function addFirefoxExclusives(): CrxPlugin {
    return {
        name: "crx:add-firefox-exclusives",
        renderCrxManifest(m) {
            return {
                ...m,
                browser_specific_settings: {
                    gecko: {
                        id: "@better-passwork"
                    }
                }
            }
        }
    }
}

export function configurate(browser?: 'firefox' | 'chrome') {
    return defineConfig({
        resolve: {
            alias: {
                '@': `${path.resolve(__dirname, 'src')}`,
            },
        },
        plugins: [
            react(),
            crx({ manifest, browser }),
            addFirefoxExclusives(),
            zip({
                outDir: 'release',
                outFileName: `crx-${name}-${version}${browser ? `-${browser}` : ""}.zip`,
                inDir: browser ? `dist/${browser}` : "dist"
            }),
        ],
        server: {
            cors: {
                origin: [
                    /chrome-extension:\/\//,
                ],
            },
        },
        build: {
            outDir: browser ? `dist/${browser}` : "dist"
        }
    })
}
