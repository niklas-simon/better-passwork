import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
    manifest_version: 3,
    name: pkg.name,
    version: pkg.version,
    description: "Does the same as Passwork, but better",
    icons: {
        128: 'public/logo.png',
    },
    action: {
        default_icon: {
            128: 'public/logo.png',
        },
        default_popup: 'src/popup/index.html',
    },
    permissions: [
        "tabs", "storage"
    ],
    content_scripts: [{
        js: ['src/content/main.ts'],
        matches: ['https://*/*'],
    }],
    host_permissions: ["<all_urls>"],
    background: {
        scripts: ["src/background/main.ts"],
        service_worker: "src/background/main.ts"
    },
    commands: {
        fill: {
            suggested_key: {
                default: "Ctrl+Space"
            },
            description: "Fills the detected form using the first password found"
        }
    },
    options_ui: {
        page: "src/options/index.html"
    },
    web_accessible_resources: [
        {
            matches: ["https://*/*"],
            resources: ["public/logo.png"]
        }
    ]
})
