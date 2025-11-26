// vite.config.ts
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/vite@5.0.0-beta.0_@types+node@20.4.5_sass-embedded@1.66.1_terser@5.19.2/node_modules/vite/dist/node/index.js";
import Vue from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/@vitejs+plugin-vue@4.3.3_vite@5.0.0-beta.0_@types+node@20.4.5_sass-embedded@1.66.1_terser@5.19.2__vue@3.3.4/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import VueRouter from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/unplugin-vue-router@0.6.4_rollup@2.79.1_vue-router@4.2.4_vue@3.3.4__vue@3.3.4/node_modules/unplugin-vue-router/dist/vite.mjs";
import { VueRouterAutoImports } from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/unplugin-vue-router@0.6.4_rollup@2.79.1_vue-router@4.2.4_vue@3.3.4__vue@3.3.4/node_modules/unplugin-vue-router/dist/index.mjs";
import Components from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/unplugin-vue-components@0.25.1_@babel+parser@7.22.11_rollup@2.79.1_vue@3.3.4/node_modules/unplugin-vue-components/dist/vite.mjs";
import AutoImport from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/unplugin-auto-import@0.16.6_@vueuse+core@10.4.0_vue@3.3.4__rollup@2.79.1/node_modules/unplugin-auto-import/dist/vite.js";
import Unfonts from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/unplugin-fonts@1.0.3_vite@5.0.0-beta.0_@types+node@20.4.5_sass-embedded@1.66.1_terser@5.19.2_/node_modules/unplugin-fonts/dist/vite.mjs";
import { VitePluginRadar } from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/vite-plugin-radar@0.9.1_vite@5.0.0-beta.0_@types+node@20.4.5_sass-embedded@1.66.1_terser@5.19.2_/node_modules/vite-plugin-radar/dist/index.js";
import PurgeIcons from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/vite-plugin-purge-icons@0.9.2_vite@5.0.0-beta.0_@types+node@20.4.5_sass-embedded@1.66.1_terser@5.19.2_/node_modules/vite-plugin-purge-icons/dist/index.mjs";
import ImageMin from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/vite-plugin-imagemin@0.6.1_vite@5.0.0-beta.0_@types+node@20.4.5_sass-embedded@1.66.1_terser@5.19.2_/node_modules/vite-plugin-imagemin/dist/index.mjs";
import VueI18nPlugin from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/@intlify+unplugin-vue-i18n@0.12.3_rollup@2.79.1_vue-i18n@9.3.0-beta.25_vue@3.3.4_/node_modules/@intlify/unplugin-vue-i18n/lib/vite.mjs";
import { VitePWA } from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/vite-plugin-pwa@0.16.4_vite@5.0.0-beta.0_@types+node@20.4.5_sass-embedded@1.66.1_terser@5.19._o5wklnpvam5vutmmqt63s3y36u/node_modules/vite-plugin-pwa/dist/index.js";
import purgecss from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/rollup-plugin-purgecss@5.0.0/node_modules/rollup-plugin-purgecss/lib/rollup-plugin-purgecss.js";
import UnheadVite from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/@unhead+addons@1.3.7_rollup@2.79.1/node_modules/@unhead/addons/dist/vite.mjs";
import { unheadVueComposablesImports } from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/@unhead+vue@1.3.7_vue@3.3.4/node_modules/@unhead/vue/dist/index.mjs";

// vite-plugin-purge-comments/index.ts
import MagicString from "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/node_modules/.pnpm/magic-string@0.30.3/node_modules/magic-string/dist/magic-string.es.mjs";
function parseId(id) {
  const index = id.indexOf("?");
  if (index < 0)
    return id;
  else
    return id.slice(0, index);
}
function VitePluginPurgeComments({ sourcemap = false } = {}) {
  return {
    name: "purge-comments",
    enforce: "pre",
    transform: (code, id) => {
      const parsedId = parseId(id);
      if (!(parsedId.endsWith(".vue") || parsedId.endsWith(".html") || parsedId.endsWith(".svg"))) {
        return;
      }
      if (!code.includes("<!--")) {
        return;
      }
      const s = new MagicString(code);
      s.replace(/<!--[\w\W\s]*?-->/g, "");
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: sourcemap && s.generateMap({ source: id, includeContent: true })
        };
      }
    }
  };
}

// vite.config.ts
var __vite_injected_original_import_meta_url = "file:///C:/Users/Omnifish/Documents/GitHub/LightHouseStandalone/vite.config.ts";
var VitePluginVueroDoc = (options) => {
};
var MINIFY_IMAGES = process.env.MINIFY ? process.env.MINIFY === "true" : false;
var isProd = process.env.NODE_ENV === "production";
var vite_config_default = defineConfig({
  // Project root directory (where index.html is located).
  root: process.cwd(),
  // Base public path when served in development or production.
  // You also need to add this base like `history: createWebHistory('my-subdirectory')`
  // in ./src/router.ts
  // base: '/my-subdirectory/',
  base: "/",
  // Directory to serve as plain static assets.
  publicDir: "public",
  // Adjust console output verbosity.
  logLevel: "info",
  // development server configuration
  server: {
    // Vite 4 defaults to 5173, but you can override it with the port option.
    port: 3e3
  },
  /**
   * Define allow to replace string in the code at build time.
   */
  define: {
    // VSCODE_TEXTMATE_DEBUG is used in shiki, but it's not defined in the browser
    "process.env.VSCODE_TEXTMATE_DEBUG": "false"
  },
  /**
   * By default, Vite will crawl your index.html to detect dependencies that
   * need to be pre-bundled. If build.rollupOptions.input is specified,
   * Vite will crawl those entry points instead.
   *
   * @see https://vitejs.dev/config/#optimizedeps-entries
   */
  optimizeDeps: {
    include: [
      "@ckeditor/ckeditor5-vue",
      "@ckeditor/ckeditor5-build-classic",
      "@iconify/iconify",
      "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.min.js",
      "@vee-validate/zod",
      "@vueuse/core",
      "@vueform/multiselect",
      "@vueform/slider",
      "billboard.js",
      "dayjs",
      "dropzone",
      "dragula",
      "defu",
      "filepond",
      "filepond-plugin-file-validate-size",
      "filepond-plugin-file-validate-type",
      "filepond-plugin-image-exif-orientation",
      "filepond-plugin-image-crop",
      "filepond-plugin-image-edit",
      "filepond-plugin-image-preview",
      "filepond-plugin-image-resize",
      "filepond-plugin-image-transform",
      "focus-trap-vue",
      "imask",
      "nprogress",
      "notyf",
      "mapbox-gl",
      "photoswipe/lightbox",
      "photoswipe",
      "plyr",
      "v-calendar",
      "vee-validate",
      "vue",
      "vue-scrollto",
      "vue3-apexcharts",
      "vue-tippy",
      "vue-i18n",
      "vue-router",
      "unplugin-vue-router/runtime",
      "simplebar",
      "tiny-slider/src/tiny-slider",
      "vue-accessible-color-picker",
      "zod",
      "@stefanprobst/remark-shiki",
      "rehype-external-links",
      "rehype-raw",
      "rehype-sanitize",
      "rehype-stringify",
      "rehype-slug",
      "rehype-autolink-headings",
      "remark-gfm",
      "remark-parse",
      "remark-rehype",
      "shiki",
      "unified",
      "workbox-window",
      "textarea-markdown-editor/dist/esm/bootstrap"
    ]
    // disabled: false,
  },
  // Will be passed to @rollup/plugin-alias as its entries option.
  resolve: {
    alias: [
      {
        find: "/@src/",
        replacement: `/src/`
      }
    ]
  },
  build: {
    target: "esnext",
    minify: "terser",
    // Do not warn about large chunks
    // chunkSizeWarningLimit: Infinity,
    // Double the default size threshold for inlined assets
    // https://vitejs.dev/config/build-options.html#build-assetsinlinelimit
    assetsInlineLimit: 4096 * 2
    // commonjsOptions: { include: [] },
  },
  plugins: [
    /**
     * plugin-vue plugin inject vue library and allow sfc files to work (*.vue)
     *
     * @see https://github.com/vitejs/vite/tree/main/packages/plugin-vue
     */
    Vue({
      include: [/\.vue$/],
      script: {
        defineModel: true,
        propsDestructure: true
      }
    }),
    /**
     * unplugin-vue-i18n plugin does i18n resources pre-compilation / optimizations
     *
     * @see https://github.com/intlify/bundle-tools/blob/main/packages/unplugin-vue-i18n/README.md
     */
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(__vite_injected_original_import_meta_url)), "./src/locales/**"),
      fullInstall: false,
      compositionOnly: true
    }),
    /**
     * unplugin-vue-router plugin generate routes based on file system
     * allow to use typed routes and usage of defineLoader
     *
     * @see https://github.com/posva/unplugin-vue-router
     * @see https://github.com/vuejs/rfcs/blob/ad69da2aee9242ef88f036713db68f3ef274bb1b/active-rfcs/0000-router-use-loader.md
     */
    VueRouter({
      routesFolder: "src/pages",
      dts: "./types/router.d.ts",
      /**
       * Data Fetching is an experimental feature from vue & vue-router
       *
       * @see https://github.com/vuejs/rfcs/discussions/460
       * @see https://github.com/posva/unplugin-vue-router/tree/main/src/data-fetching
       */
      dataFetching: true
    }),
    /**
     * Unhead provides a Vite plugin to optimise your builds, by removing composables that aren't needed and simplifying your code.
     *
     * @see https://unhead.harlanzw.com/guide/getting-started/vite-plugin
     */
    UnheadVite(),
    /**
     * unplugin-auto-import allow to automaticaly import modules/components
     *
     * @see https://github.com/antfu/unplugin-auto-import
     */
    AutoImport({
      dts: "./types/imports.d.ts",
      imports: ["vue", "@vueuse/core", VueRouterAutoImports, unheadVueComposablesImports]
    }),
    /**
     * This is an internal vite plugin that load markdown files as vue components.
     *
     * @see /documentation
     * @see /vite-plugin-vuero-doc
     * @see /src/components/partials/documentation/DocumentationItem.vue
     * @see /src/composable/useMarkdownToc.ts
     */
    VitePluginVueroDoc({
      pathPrefix: "documentation",
      wrapperComponent: "DocumentationItem",
      shiki: {
        theme: {
          light: "min-light",
          dark: "github-dark"
        }
      },
      sourceMeta: {
        enabled: true,
        editProtocol: "vscode://vscode-remote/wsl+Ubuntu"
        // or 'vscode://file'
      }
    }),
    /**
     * This is an internal vite plugin that remove html comments from code.
     *
     * @see /vite-plugin-purge-comments
     */
    VitePluginPurgeComments(),
    /**
     * unplugin-vue-components plugin is responsible of autoloading components
     * documentation and md file are loaded for elements and components sections
     *
     * @see https://github.com/antfu/unplugin-vue-components
     */
    Components({
      dirs: ["documentation", "src/components", "src/layouts"],
      extensions: ["vue", "md"],
      dts: "./types/components.d.ts",
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/]
    }),
    /**
     * vite-plugin-purge-icons plugin is responsible of autoloading icones from multiples providers
     *
     * @see https://icones.netlify.app/
     * @see https://github.com/antfu/purge-icons/tree/main/packages/vite-plugin-purge-icons
     */
    PurgeIcons(),
    /**
     * vite-plugin-fonts plugin inject webfonts from differents providers
     *
     * @see https://github.com/stafyniaksacha/vite-plugin-fonts
     */
    Unfonts({
      google: {
        families: [
          {
            name: "Fira Code",
            styles: "wght@400;600"
          },
          {
            name: "Montserrat",
            styles: "wght@500;600;700;800;900"
          },
          {
            name: "Roboto",
            styles: "wght@300;400;500;600;700"
          }
        ]
      }
    }),
    /**
     * vite-plugin-radar plugin inject snippets from analytics providers
     *
     * @see https://github.com/stafyniaksacha/vite-plugin-radar
     */
    !process.env.GTM_ID ? void 0 : VitePluginRadar({
      gtm: {
        id: process.env.GTM_ID
      }
    }),
    /**
     * vite-plugin-pwa generate manifest.json and register services worker to enable PWA
     *
     * @see https://github.com/antfu/vite-plugin-pwa
     */
    VitePWA({
      base: "/",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
        "omni-logo-2-192x192.png",
        "omni-logo-2-512x512",
        "omni-logo-2"
      ],
      manifest: {
        name: "Vuero - A complete Vue 3 design system",
        short_name: "Vuero",
        start_url: "/?utm_source=pwa",
        display: "standalone",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "omni-logo-2-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "omni-logo-2-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "omni-logo-2-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      mode: isProd ? "production" : "development",
      // registerType: 'autoUpdate',
      workbox: {
        /**
         * precache files that match the glob pattern
         *
         * @see https://vite-pwa-org.netlify.app/guide/service-worker-precache.html
         */
        globPatterns: ["**/*.{js,css,ico,png,svg,webp,jpg,jpeg}"],
        /**
         * add external cache of google fonts
         *
         * @see https://vite-pwa-org.netlify.app/workbox/generate-sw.html
         */
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
                // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
                // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    /**
     * rollup-plugin-purgecss plugin is responsible of purging css rules
     * that are not used in the bundle
     *
     * @see https://github.com/FullHuman/purgecss/tree/main/packages/rollup-plugin-purgecss
     */
    purgecss({
      output: false,
      content: [`./src/**/*.vue`],
      variables: false,
      safelist: {
        standard: [
          /(autv|lnil|lnir|fas?)/,
          /-(leave|enter|appear)(|-(to|from|active))$/,
          /^(?!(|.*?:)cursor-move).+-move$/,
          /^router-link(|-exact)-active$/,
          /data-v-.*/
        ]
      },
      defaultExtractor(content) {
        const contentWithoutStyleBlocks = content.replace(/<style[^]+?<\/style>/gi, "");
        return contentWithoutStyleBlocks.match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g) || [];
      }
    }),
    /**
     * vite-plugin-imagemin optimize all images sizes from public or asset folder
     *
     * @see https://github.com/anncwb/vite-plugin-imagemin
     */
    !MINIFY_IMAGES ? void 0 : ImageMin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false
      },
      optipng: {
        optimizationLevel: 7
      },
      mozjpeg: {
        quality: 60
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4
      },
      svgo: {
        plugins: [
          {
            name: "removeViewBox",
            active: false
          },
          {
            name: "removeEmptyAttrs",
            active: false
          }
        ]
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAidml0ZS1wbHVnaW4tcHVyZ2UtY29tbWVudHMvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxPbW5pZmlzaFxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXExpZ2h0SG91c2VTdGFuZGFsb25lXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxPbW5pZmlzaFxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXExpZ2h0SG91c2VTdGFuZGFsb25lXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9PbW5pZmlzaC9Eb2N1bWVudHMvR2l0SHViL0xpZ2h0SG91c2VTdGFuZGFsb25lL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSwgZGlybmFtZSB9IGZyb20gJ25vZGU6cGF0aCdcclxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ25vZGU6dXJsJ1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgVnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IFZ1ZVJvdXRlciBmcm9tICd1bnBsdWdpbi12dWUtcm91dGVyL3ZpdGUnXHJcbmltcG9ydCB7IFZ1ZVJvdXRlckF1dG9JbXBvcnRzIH0gZnJvbSAndW5wbHVnaW4tdnVlLXJvdXRlcidcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcclxuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSAndW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZSdcclxuaW1wb3J0IFVuZm9udHMgZnJvbSAndW5wbHVnaW4tZm9udHMvdml0ZSdcclxuaW1wb3J0IHsgVml0ZVBsdWdpblJhZGFyIH0gZnJvbSAndml0ZS1wbHVnaW4tcmFkYXInXHJcbmltcG9ydCBQdXJnZUljb25zIGZyb20gJ3ZpdGUtcGx1Z2luLXB1cmdlLWljb25zJ1xyXG5pbXBvcnQgSW1hZ2VNaW4gZnJvbSAndml0ZS1wbHVnaW4taW1hZ2VtaW4nXHJcbmltcG9ydCBWdWVJMThuUGx1Z2luIGZyb20gJ0BpbnRsaWZ5L3VucGx1Z2luLXZ1ZS1pMThuL3ZpdGUnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcbmltcG9ydCBwdXJnZWNzcyBmcm9tICdyb2xsdXAtcGx1Z2luLXB1cmdlY3NzJ1xyXG5pbXBvcnQgVW5oZWFkVml0ZSBmcm9tICdAdW5oZWFkL2FkZG9ucy92aXRlJ1xyXG5pbXBvcnQgeyB1bmhlYWRWdWVDb21wb3NhYmxlc0ltcG9ydHMgfSBmcm9tICdAdW5oZWFkL3Z1ZSdcclxuXHJcbi8vIGxvY2FsIHZpdGUgcGx1Z2luXHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcclxuY29uc3QgVml0ZVBsdWdpblZ1ZXJvRG9jID0gKG9wdGlvbnM6IGFueSkgPT4ge31cclxuaW1wb3J0IHsgVml0ZVBsdWdpblB1cmdlQ29tbWVudHMgfSBmcm9tICcuL3ZpdGUtcGx1Z2luLXB1cmdlLWNvbW1lbnRzJ1xyXG5cclxuLy8gb3B0aW9ucyB2aWEgZW52IHZhcmlhYmxlc1xyXG5jb25zdCBNSU5JRllfSU1BR0VTID0gcHJvY2Vzcy5lbnYuTUlOSUZZID8gcHJvY2Vzcy5lbnYuTUlOSUZZID09PSAndHJ1ZScgOiBmYWxzZVxyXG5cclxuY29uc3QgaXNQcm9kID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJ1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgdGhlIG1haW4gY29uZmlndXJhdGlvbiBmaWxlIGZvciB2aXRlanNcclxuICpcclxuICogQHNlZSBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIC8vIFByb2plY3Qgcm9vdCBkaXJlY3RvcnkgKHdoZXJlIGluZGV4Lmh0bWwgaXMgbG9jYXRlZCkuXHJcbiAgcm9vdDogcHJvY2Vzcy5jd2QoKSxcclxuICAvLyBCYXNlIHB1YmxpYyBwYXRoIHdoZW4gc2VydmVkIGluIGRldmVsb3BtZW50IG9yIHByb2R1Y3Rpb24uXHJcbiAgLy8gWW91IGFsc28gbmVlZCB0byBhZGQgdGhpcyBiYXNlIGxpa2UgYGhpc3Rvcnk6IGNyZWF0ZVdlYkhpc3RvcnkoJ215LXN1YmRpcmVjdG9yeScpYFxyXG4gIC8vIGluIC4vc3JjL3JvdXRlci50c1xyXG4gIC8vIGJhc2U6ICcvbXktc3ViZGlyZWN0b3J5LycsXHJcbiAgYmFzZTogJy8nLFxyXG4gIC8vIERpcmVjdG9yeSB0byBzZXJ2ZSBhcyBwbGFpbiBzdGF0aWMgYXNzZXRzLlxyXG4gIHB1YmxpY0RpcjogJ3B1YmxpYycsXHJcbiAgLy8gQWRqdXN0IGNvbnNvbGUgb3V0cHV0IHZlcmJvc2l0eS5cclxuICBsb2dMZXZlbDogJ2luZm8nLFxyXG4gIC8vIGRldmVsb3BtZW50IHNlcnZlciBjb25maWd1cmF0aW9uXHJcbiAgc2VydmVyOiB7XHJcbiAgICAvLyBWaXRlIDQgZGVmYXVsdHMgdG8gNTE3MywgYnV0IHlvdSBjYW4gb3ZlcnJpZGUgaXQgd2l0aCB0aGUgcG9ydCBvcHRpb24uXHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gIH0sXHJcbiAgLyoqXHJcbiAgICogRGVmaW5lIGFsbG93IHRvIHJlcGxhY2Ugc3RyaW5nIGluIHRoZSBjb2RlIGF0IGJ1aWxkIHRpbWUuXHJcbiAgICovXHJcbiAgZGVmaW5lOiB7XHJcbiAgICAvLyBWU0NPREVfVEVYVE1BVEVfREVCVUcgaXMgdXNlZCBpbiBzaGlraSwgYnV0IGl0J3Mgbm90IGRlZmluZWQgaW4gdGhlIGJyb3dzZXJcclxuICAgICdwcm9jZXNzLmVudi5WU0NPREVfVEVYVE1BVEVfREVCVUcnOiAnZmFsc2UnLFxyXG4gIH0sXHJcbiAgLyoqXHJcbiAgICogQnkgZGVmYXVsdCwgVml0ZSB3aWxsIGNyYXdsIHlvdXIgaW5kZXguaHRtbCB0byBkZXRlY3QgZGVwZW5kZW5jaWVzIHRoYXRcclxuICAgKiBuZWVkIHRvIGJlIHByZS1idW5kbGVkLiBJZiBidWlsZC5yb2xsdXBPcHRpb25zLmlucHV0IGlzIHNwZWNpZmllZCxcclxuICAgKiBWaXRlIHdpbGwgY3Jhd2wgdGhvc2UgZW50cnkgcG9pbnRzIGluc3RlYWQuXHJcbiAgICpcclxuICAgKiBAc2VlIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvI29wdGltaXplZGVwcy1lbnRyaWVzXHJcbiAgICovXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdAY2tlZGl0b3IvY2tlZGl0b3I1LXZ1ZScsXHJcbiAgICAgICdAY2tlZGl0b3IvY2tlZGl0b3I1LWJ1aWxkLWNsYXNzaWMnLFxyXG4gICAgICAnQGljb25pZnkvaWNvbmlmeScsXHJcbiAgICAgICdAbWFwYm94L21hcGJveC1nbC1nZW9jb2Rlci9kaXN0L21hcGJveC1nbC1nZW9jb2Rlci5taW4uanMnLFxyXG4gICAgICAnQHZlZS12YWxpZGF0ZS96b2QnLFxyXG4gICAgICAnQHZ1ZXVzZS9jb3JlJyxcclxuICAgICAgJ0B2dWVmb3JtL211bHRpc2VsZWN0JyxcclxuICAgICAgJ0B2dWVmb3JtL3NsaWRlcicsXHJcbiAgICAgICdiaWxsYm9hcmQuanMnLFxyXG4gICAgICAnZGF5anMnLFxyXG4gICAgICAnZHJvcHpvbmUnLFxyXG4gICAgICAnZHJhZ3VsYScsXHJcbiAgICAgICdkZWZ1JyxcclxuICAgICAgJ2ZpbGVwb25kJyxcclxuICAgICAgJ2ZpbGVwb25kLXBsdWdpbi1maWxlLXZhbGlkYXRlLXNpemUnLFxyXG4gICAgICAnZmlsZXBvbmQtcGx1Z2luLWZpbGUtdmFsaWRhdGUtdHlwZScsXHJcbiAgICAgICdmaWxlcG9uZC1wbHVnaW4taW1hZ2UtZXhpZi1vcmllbnRhdGlvbicsXHJcbiAgICAgICdmaWxlcG9uZC1wbHVnaW4taW1hZ2UtY3JvcCcsXHJcbiAgICAgICdmaWxlcG9uZC1wbHVnaW4taW1hZ2UtZWRpdCcsXHJcbiAgICAgICdmaWxlcG9uZC1wbHVnaW4taW1hZ2UtcHJldmlldycsXHJcbiAgICAgICdmaWxlcG9uZC1wbHVnaW4taW1hZ2UtcmVzaXplJyxcclxuICAgICAgJ2ZpbGVwb25kLXBsdWdpbi1pbWFnZS10cmFuc2Zvcm0nLFxyXG4gICAgICAnZm9jdXMtdHJhcC12dWUnLFxyXG4gICAgICAnaW1hc2snLFxyXG4gICAgICAnbnByb2dyZXNzJyxcclxuICAgICAgJ25vdHlmJyxcclxuICAgICAgJ21hcGJveC1nbCcsXHJcbiAgICAgICdwaG90b3N3aXBlL2xpZ2h0Ym94JyxcclxuICAgICAgJ3Bob3Rvc3dpcGUnLFxyXG4gICAgICAncGx5cicsXHJcbiAgICAgICd2LWNhbGVuZGFyJyxcclxuICAgICAgJ3ZlZS12YWxpZGF0ZScsXHJcbiAgICAgICd2dWUnLFxyXG4gICAgICAndnVlLXNjcm9sbHRvJyxcclxuICAgICAgJ3Z1ZTMtYXBleGNoYXJ0cycsXHJcbiAgICAgICd2dWUtdGlwcHknLFxyXG4gICAgICAndnVlLWkxOG4nLFxyXG4gICAgICAndnVlLXJvdXRlcicsXHJcbiAgICAgICd1bnBsdWdpbi12dWUtcm91dGVyL3J1bnRpbWUnLFxyXG4gICAgICAnc2ltcGxlYmFyJyxcclxuICAgICAgJ3Rpbnktc2xpZGVyL3NyYy90aW55LXNsaWRlcicsXHJcbiAgICAgICd2dWUtYWNjZXNzaWJsZS1jb2xvci1waWNrZXInLFxyXG4gICAgICAnem9kJyxcclxuICAgICAgJ0BzdGVmYW5wcm9ic3QvcmVtYXJrLXNoaWtpJyxcclxuICAgICAgJ3JlaHlwZS1leHRlcm5hbC1saW5rcycsXHJcbiAgICAgICdyZWh5cGUtcmF3JyxcclxuICAgICAgJ3JlaHlwZS1zYW5pdGl6ZScsXHJcbiAgICAgICdyZWh5cGUtc3RyaW5naWZ5JyxcclxuICAgICAgJ3JlaHlwZS1zbHVnJyxcclxuICAgICAgJ3JlaHlwZS1hdXRvbGluay1oZWFkaW5ncycsXHJcbiAgICAgICdyZW1hcmstZ2ZtJyxcclxuICAgICAgJ3JlbWFyay1wYXJzZScsXHJcbiAgICAgICdyZW1hcmstcmVoeXBlJyxcclxuICAgICAgJ3NoaWtpJyxcclxuICAgICAgJ3VuaWZpZWQnLFxyXG4gICAgICAnd29ya2JveC13aW5kb3cnLFxyXG4gICAgICAndGV4dGFyZWEtbWFya2Rvd24tZWRpdG9yL2Rpc3QvZXNtL2Jvb3RzdHJhcCcsXHJcbiAgICBdLFxyXG4gICAgLy8gZGlzYWJsZWQ6IGZhbHNlLFxyXG4gIH0sXHJcbiAgLy8gV2lsbCBiZSBwYXNzZWQgdG8gQHJvbGx1cC9wbHVnaW4tYWxpYXMgYXMgaXRzIGVudHJpZXMgb3B0aW9uLlxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBmaW5kOiAnL0BzcmMvJyxcclxuICAgICAgICByZXBsYWNlbWVudDogYC9zcmMvYCxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcclxuICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICAvLyBEbyBub3Qgd2FybiBhYm91dCBsYXJnZSBjaHVua3NcclxuICAgIC8vIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogSW5maW5pdHksXHJcbiAgICAvLyBEb3VibGUgdGhlIGRlZmF1bHQgc2l6ZSB0aHJlc2hvbGQgZm9yIGlubGluZWQgYXNzZXRzXHJcbiAgICAvLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL2J1aWxkLW9wdGlvbnMuaHRtbCNidWlsZC1hc3NldHNpbmxpbmVsaW1pdFxyXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYgKiAyLFxyXG4gICAgLy8gY29tbW9uanNPcHRpb25zOiB7IGluY2x1ZGU6IFtdIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICAvKipcclxuICAgICAqIHBsdWdpbi12dWUgcGx1Z2luIGluamVjdCB2dWUgbGlicmFyeSBhbmQgYWxsb3cgc2ZjIGZpbGVzIHRvIHdvcmsgKCoudnVlKVxyXG4gICAgICpcclxuICAgICAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVqcy92aXRlL3RyZWUvbWFpbi9wYWNrYWdlcy9wbHVnaW4tdnVlXHJcbiAgICAgKi9cclxuICAgIFZ1ZSh7XHJcbiAgICAgIGluY2x1ZGU6IFsvXFwudnVlJC9dLFxyXG4gICAgICBzY3JpcHQ6IHtcclxuICAgICAgICBkZWZpbmVNb2RlbDogdHJ1ZSxcclxuICAgICAgICBwcm9wc0Rlc3RydWN0dXJlOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1bnBsdWdpbi12dWUtaTE4biBwbHVnaW4gZG9lcyBpMThuIHJlc291cmNlcyBwcmUtY29tcGlsYXRpb24gLyBvcHRpbWl6YXRpb25zXHJcbiAgICAgKlxyXG4gICAgICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vaW50bGlmeS9idW5kbGUtdG9vbHMvYmxvYi9tYWluL3BhY2thZ2VzL3VucGx1Z2luLXZ1ZS1pMThuL1JFQURNRS5tZFxyXG4gICAgICovXHJcbiAgICBWdWVJMThuUGx1Z2luKHtcclxuICAgICAgaW5jbHVkZTogcmVzb2x2ZShkaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSksICcuL3NyYy9sb2NhbGVzLyoqJyksXHJcbiAgICAgIGZ1bGxJbnN0YWxsOiBmYWxzZSxcclxuICAgICAgY29tcG9zaXRpb25Pbmx5OiB0cnVlLFxyXG4gICAgfSksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1bnBsdWdpbi12dWUtcm91dGVyIHBsdWdpbiBnZW5lcmF0ZSByb3V0ZXMgYmFzZWQgb24gZmlsZSBzeXN0ZW1cclxuICAgICAqIGFsbG93IHRvIHVzZSB0eXBlZCByb3V0ZXMgYW5kIHVzYWdlIG9mIGRlZmluZUxvYWRlclxyXG4gICAgICpcclxuICAgICAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3Bvc3ZhL3VucGx1Z2luLXZ1ZS1yb3V0ZXJcclxuICAgICAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3Z1ZWpzL3JmY3MvYmxvYi9hZDY5ZGEyYWVlOTI0MmVmODhmMDM2NzEzZGI2OGYzZWYyNzRiYjFiL2FjdGl2ZS1yZmNzLzAwMDAtcm91dGVyLXVzZS1sb2FkZXIubWRcclxuICAgICAqL1xyXG4gICAgVnVlUm91dGVyKHtcclxuICAgICAgcm91dGVzRm9sZGVyOiAnc3JjL3BhZ2VzJyxcclxuICAgICAgZHRzOiAnLi90eXBlcy9yb3V0ZXIuZC50cycsXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogRGF0YSBGZXRjaGluZyBpcyBhbiBleHBlcmltZW50YWwgZmVhdHVyZSBmcm9tIHZ1ZSAmIHZ1ZS1yb3V0ZXJcclxuICAgICAgICpcclxuICAgICAgICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vdnVlanMvcmZjcy9kaXNjdXNzaW9ucy80NjBcclxuICAgICAgICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vcG9zdmEvdW5wbHVnaW4tdnVlLXJvdXRlci90cmVlL21haW4vc3JjL2RhdGEtZmV0Y2hpbmdcclxuICAgICAgICovXHJcbiAgICAgIGRhdGFGZXRjaGluZzogdHJ1ZSxcclxuICAgIH0pLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5oZWFkIHByb3ZpZGVzIGEgVml0ZSBwbHVnaW4gdG8gb3B0aW1pc2UgeW91ciBidWlsZHMsIGJ5IHJlbW92aW5nIGNvbXBvc2FibGVzIHRoYXQgYXJlbid0IG5lZWRlZCBhbmQgc2ltcGxpZnlpbmcgeW91ciBjb2RlLlxyXG4gICAgICpcclxuICAgICAqIEBzZWUgaHR0cHM6Ly91bmhlYWQuaGFybGFuencuY29tL2d1aWRlL2dldHRpbmctc3RhcnRlZC92aXRlLXBsdWdpblxyXG4gICAgICovXHJcbiAgICBVbmhlYWRWaXRlKCksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1bnBsdWdpbi1hdXRvLWltcG9ydCBhbGxvdyB0byBhdXRvbWF0aWNhbHkgaW1wb3J0IG1vZHVsZXMvY29tcG9uZW50c1xyXG4gICAgICpcclxuICAgICAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3VucGx1Z2luLWF1dG8taW1wb3J0XHJcbiAgICAgKi9cclxuICAgIEF1dG9JbXBvcnQoe1xyXG4gICAgICBkdHM6ICcuL3R5cGVzL2ltcG9ydHMuZC50cycsXHJcbiAgICAgIGltcG9ydHM6IFsndnVlJywgJ0B2dWV1c2UvY29yZScsIFZ1ZVJvdXRlckF1dG9JbXBvcnRzLCB1bmhlYWRWdWVDb21wb3NhYmxlc0ltcG9ydHNdLFxyXG4gICAgfSksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGlzIGFuIGludGVybmFsIHZpdGUgcGx1Z2luIHRoYXQgbG9hZCBtYXJrZG93biBmaWxlcyBhcyB2dWUgY29tcG9uZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBAc2VlIC9kb2N1bWVudGF0aW9uXHJcbiAgICAgKiBAc2VlIC92aXRlLXBsdWdpbi12dWVyby1kb2NcclxuICAgICAqIEBzZWUgL3NyYy9jb21wb25lbnRzL3BhcnRpYWxzL2RvY3VtZW50YXRpb24vRG9jdW1lbnRhdGlvbkl0ZW0udnVlXHJcbiAgICAgKiBAc2VlIC9zcmMvY29tcG9zYWJsZS91c2VNYXJrZG93blRvYy50c1xyXG4gICAgICovXHJcbiAgICBWaXRlUGx1Z2luVnVlcm9Eb2Moe1xyXG4gICAgICBwYXRoUHJlZml4OiAnZG9jdW1lbnRhdGlvbicsXHJcbiAgICAgIHdyYXBwZXJDb21wb25lbnQ6ICdEb2N1bWVudGF0aW9uSXRlbScsXHJcbiAgICAgIHNoaWtpOiB7XHJcbiAgICAgICAgdGhlbWU6IHtcclxuICAgICAgICAgIGxpZ2h0OiAnbWluLWxpZ2h0JyxcclxuICAgICAgICAgIGRhcms6ICdnaXRodWItZGFyaycsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgc291cmNlTWV0YToge1xyXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgZWRpdFByb3RvY29sOiAndnNjb2RlOi8vdnNjb2RlLXJlbW90ZS93c2wrVWJ1bnR1JywgLy8gb3IgJ3ZzY29kZTovL2ZpbGUnXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgdml0ZSBwbHVnaW4gdGhhdCByZW1vdmUgaHRtbCBjb21tZW50cyBmcm9tIGNvZGUuXHJcbiAgICAgKlxyXG4gICAgICogQHNlZSAvdml0ZS1wbHVnaW4tcHVyZ2UtY29tbWVudHNcclxuICAgICAqL1xyXG4gICAgVml0ZVBsdWdpblB1cmdlQ29tbWVudHMoKSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIHVucGx1Z2luLXZ1ZS1jb21wb25lbnRzIHBsdWdpbiBpcyByZXNwb25zaWJsZSBvZiBhdXRvbG9hZGluZyBjb21wb25lbnRzXHJcbiAgICAgKiBkb2N1bWVudGF0aW9uIGFuZCBtZCBmaWxlIGFyZSBsb2FkZWQgZm9yIGVsZW1lbnRzIGFuZCBjb21wb25lbnRzIHNlY3Rpb25zXHJcbiAgICAgKlxyXG4gICAgICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vYW50ZnUvdW5wbHVnaW4tdnVlLWNvbXBvbmVudHNcclxuICAgICAqL1xyXG4gICAgQ29tcG9uZW50cyh7XHJcbiAgICAgIGRpcnM6IFsnZG9jdW1lbnRhdGlvbicsICdzcmMvY29tcG9uZW50cycsICdzcmMvbGF5b3V0cyddLFxyXG4gICAgICBleHRlbnNpb25zOiBbJ3Z1ZScsICdtZCddLFxyXG4gICAgICBkdHM6ICcuL3R5cGVzL2NvbXBvbmVudHMuZC50cycsXHJcbiAgICAgIGluY2x1ZGU6IFsvXFwudnVlJC8sIC9cXC52dWVcXD92dWUvLCAvXFwubWQkL10sXHJcbiAgICB9KSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIHZpdGUtcGx1Z2luLXB1cmdlLWljb25zIHBsdWdpbiBpcyByZXNwb25zaWJsZSBvZiBhdXRvbG9hZGluZyBpY29uZXMgZnJvbSBtdWx0aXBsZXMgcHJvdmlkZXJzXHJcbiAgICAgKlxyXG4gICAgICogQHNlZSBodHRwczovL2ljb25lcy5uZXRsaWZ5LmFwcC9cclxuICAgICAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3B1cmdlLWljb25zL3RyZWUvbWFpbi9wYWNrYWdlcy92aXRlLXBsdWdpbi1wdXJnZS1pY29uc1xyXG4gICAgICovXHJcbiAgICBQdXJnZUljb25zKCksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB2aXRlLXBsdWdpbi1mb250cyBwbHVnaW4gaW5qZWN0IHdlYmZvbnRzIGZyb20gZGlmZmVyZW50cyBwcm92aWRlcnNcclxuICAgICAqXHJcbiAgICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdGFmeW5pYWtzYWNoYS92aXRlLXBsdWdpbi1mb250c1xyXG4gICAgICovXHJcbiAgICBVbmZvbnRzKHtcclxuICAgICAgZ29vZ2xlOiB7XHJcbiAgICAgICAgZmFtaWxpZXM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ0ZpcmEgQ29kZScsXHJcbiAgICAgICAgICAgIHN0eWxlczogJ3dnaHRANDAwOzYwMCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnTW9udHNlcnJhdCcsXHJcbiAgICAgICAgICAgIHN0eWxlczogJ3dnaHRANTAwOzYwMDs3MDA7ODAwOzkwMCcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnUm9ib3RvJyxcclxuICAgICAgICAgICAgc3R5bGVzOiAnd2dodEAzMDA7NDAwOzUwMDs2MDA7NzAwJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdml0ZS1wbHVnaW4tcmFkYXIgcGx1Z2luIGluamVjdCBzbmlwcGV0cyBmcm9tIGFuYWx5dGljcyBwcm92aWRlcnNcclxuICAgICAqXHJcbiAgICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdGFmeW5pYWtzYWNoYS92aXRlLXBsdWdpbi1yYWRhclxyXG4gICAgICovXHJcbiAgICAhcHJvY2Vzcy5lbnYuR1RNX0lEXHJcbiAgICAgID8gdW5kZWZpbmVkXHJcbiAgICAgIDogVml0ZVBsdWdpblJhZGFyKHtcclxuICAgICAgICAgIGd0bToge1xyXG4gICAgICAgICAgICBpZDogcHJvY2Vzcy5lbnYuR1RNX0lELFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIHZpdGUtcGx1Z2luLXB3YSBnZW5lcmF0ZSBtYW5pZmVzdC5qc29uIGFuZCByZWdpc3RlciBzZXJ2aWNlcyB3b3JrZXIgdG8gZW5hYmxlIFBXQVxyXG4gICAgICpcclxuICAgICAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3ZpdGUtcGx1Z2luLXB3YVxyXG4gICAgICovXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgYmFzZTogJy8nLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXHJcbiAgICAgICAgJ2Zhdmljb24uc3ZnJyxcclxuICAgICAgICAnZmF2aWNvbi5pY28nLFxyXG4gICAgICAgICdyb2JvdHMudHh0JyxcclxuICAgICAgICAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLFxyXG4gICAgICAgICdvbW5pLWxvZ28tMi0xOTJ4MTkyLnBuZycsXHJcbiAgICAgICAgJ29tbmktbG9nby0yLTUxMng1MTInLFxyXG4gICAgICAgICdvbW5pLWxvZ28tMicsXHJcbiAgICAgIF0sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgbmFtZTogJ1Z1ZXJvIC0gQSBjb21wbGV0ZSBWdWUgMyBkZXNpZ24gc3lzdGVtJyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnVnVlcm8nLFxyXG4gICAgICAgIHN0YXJ0X3VybDogJy8/dXRtX3NvdXJjZT1wd2EnLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICB0aGVtZV9jb2xvcjogJyNmZmZmZmYnLFxyXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdvbW5pLWxvZ28tMi0xOTJ4MTkyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnb21uaS1sb2dvLTItNTEyeDUxMi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJ29tbmktbG9nby0yLTUxMng1MTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICBtb2RlOiBpc1Byb2QgPyAncHJvZHVjdGlvbicgOiAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgICAvLyByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIHByZWNhY2hlIGZpbGVzIHRoYXQgbWF0Y2ggdGhlIGdsb2IgcGF0dGVyblxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHNlZSBodHRwczovL3ZpdGUtcHdhLW9yZy5uZXRsaWZ5LmFwcC9ndWlkZS9zZXJ2aWNlLXdvcmtlci1wcmVjYWNoZS5odG1sXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxpY28scG5nLHN2Zyx3ZWJwLGpwZyxqcGVnfSddLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBhZGQgZXh0ZXJuYWwgY2FjaGUgb2YgZ29vZ2xlIGZvbnRzXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAc2VlIGh0dHBzOi8vdml0ZS1wd2Etb3JnLm5ldGxpZnkuYXBwL3dvcmtib3gvZ2VuZXJhdGUtc3cuaHRtbFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC5nb29nbGVhcGlzXFwuY29tXFwvLiovaSxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnZ29vZ2xlLWZvbnRzLWNhY2hlJyxcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDM2NSwgLy8gPD09IDM2NSBkYXlzXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuZ3N0YXRpY1xcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2dzdGF0aWMtZm9udHMtY2FjaGUnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1LCAvLyA8PT0gMzY1IGRheXNcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcm9sbHVwLXBsdWdpbi1wdXJnZWNzcyBwbHVnaW4gaXMgcmVzcG9uc2libGUgb2YgcHVyZ2luZyBjc3MgcnVsZXNcclxuICAgICAqIHRoYXQgYXJlIG5vdCB1c2VkIGluIHRoZSBidW5kbGVcclxuICAgICAqXHJcbiAgICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9GdWxsSHVtYW4vcHVyZ2Vjc3MvdHJlZS9tYWluL3BhY2thZ2VzL3JvbGx1cC1wbHVnaW4tcHVyZ2Vjc3NcclxuICAgICAqL1xyXG4gICAgcHVyZ2Vjc3Moe1xyXG4gICAgICBvdXRwdXQ6IGZhbHNlLFxyXG4gICAgICBjb250ZW50OiBbYC4vc3JjLyoqLyoudnVlYF0sXHJcbiAgICAgIHZhcmlhYmxlczogZmFsc2UsXHJcbiAgICAgIHNhZmVsaXN0OiB7XHJcbiAgICAgICAgc3RhbmRhcmQ6IFtcclxuICAgICAgICAgIC8oYXV0dnxsbmlsfGxuaXJ8ZmFzPykvLFxyXG4gICAgICAgICAgLy0obGVhdmV8ZW50ZXJ8YXBwZWFyKSh8LSh0b3xmcm9tfGFjdGl2ZSkpJC8sXHJcbiAgICAgICAgICAvXig/ISh8Lio/OiljdXJzb3ItbW92ZSkuKy1tb3ZlJC8sXHJcbiAgICAgICAgICAvXnJvdXRlci1saW5rKHwtZXhhY3QpLWFjdGl2ZSQvLFxyXG4gICAgICAgICAgL2RhdGEtdi0uKi8sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgICAgZGVmYXVsdEV4dHJhY3Rvcihjb250ZW50KSB7XHJcbiAgICAgICAgY29uc3QgY29udGVudFdpdGhvdXRTdHlsZUJsb2NrcyA9IGNvbnRlbnQucmVwbGFjZSgvPHN0eWxlW15dKz88XFwvc3R5bGU+L2dpLCAnJylcclxuICAgICAgICByZXR1cm4gY29udGVudFdpdGhvdXRTdHlsZUJsb2Nrcy5tYXRjaCgvW0EtWmEtejAtOS1fLzpdKltBLVphLXowLTktXy9dKy9nKSB8fCBbXVxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB2aXRlLXBsdWdpbi1pbWFnZW1pbiBvcHRpbWl6ZSBhbGwgaW1hZ2VzIHNpemVzIGZyb20gcHVibGljIG9yIGFzc2V0IGZvbGRlclxyXG4gICAgICpcclxuICAgICAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2FubmN3Yi92aXRlLXBsdWdpbi1pbWFnZW1pblxyXG4gICAgICovXHJcbiAgICAhTUlOSUZZX0lNQUdFU1xyXG4gICAgICA/IHVuZGVmaW5lZFxyXG4gICAgICA6IEltYWdlTWluKHtcclxuICAgICAgICAgIGdpZnNpY2xlOiB7XHJcbiAgICAgICAgICAgIG9wdGltaXphdGlvbkxldmVsOiA3LFxyXG4gICAgICAgICAgICBpbnRlcmxhY2VkOiBmYWxzZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBvcHRpcG5nOiB7XHJcbiAgICAgICAgICAgIG9wdGltaXphdGlvbkxldmVsOiA3LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIG1vempwZWc6IHtcclxuICAgICAgICAgICAgcXVhbGl0eTogNjAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgcG5ncXVhbnQ6IHtcclxuICAgICAgICAgICAgcXVhbGl0eTogWzAuOCwgMC45XSxcclxuICAgICAgICAgICAgc3BlZWQ6IDQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc3Znbzoge1xyXG4gICAgICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3JlbW92ZVZpZXdCb3gnLFxyXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBmYWxzZSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdyZW1vdmVFbXB0eUF0dHJzJyxcclxuICAgICAgICAgICAgICAgIGFjdGl2ZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSksXHJcbiAgXSxcclxufSlcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxPbW5pZmlzaFxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXExpZ2h0SG91c2VTdGFuZGFsb25lXFxcXHZpdGUtcGx1Z2luLXB1cmdlLWNvbW1lbnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxPbW5pZmlzaFxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXExpZ2h0SG91c2VTdGFuZGFsb25lXFxcXHZpdGUtcGx1Z2luLXB1cmdlLWNvbW1lbnRzXFxcXGluZGV4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9PbW5pZmlzaC9Eb2N1bWVudHMvR2l0SHViL0xpZ2h0SG91c2VTdGFuZGFsb25lL3ZpdGUtcGx1Z2luLXB1cmdlLWNvbW1lbnRzL2luZGV4LnRzXCI7aW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgTWFnaWNTdHJpbmcgZnJvbSAnbWFnaWMtc3RyaW5nJ1xyXG5cclxuZnVuY3Rpb24gcGFyc2VJZChpZDogc3RyaW5nKSB7XHJcbiAgY29uc3QgaW5kZXggPSBpZC5pbmRleE9mKCc/JylcclxuICBpZiAoaW5kZXggPCAwKSByZXR1cm4gaWRcclxuICBlbHNlIHJldHVybiBpZC5zbGljZSgwLCBpbmRleClcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQbHVnaW5PcHRpb25zIHtcclxuICBzb3VyY2VtYXA/OiBib29sZWFuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIHBsdWdpbiByZW1vdmVzIEhUTUwgY29tbWVudHMgZnJvbSB5b3VyIGNvZGUuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gVml0ZVBsdWdpblB1cmdlQ29tbWVudHMoeyBzb3VyY2VtYXAgPSBmYWxzZSB9OiBQbHVnaW5PcHRpb25zID0ge30pIHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ3B1cmdlLWNvbW1lbnRzJyxcclxuICAgIGVuZm9yY2U6ICdwcmUnLFxyXG4gICAgdHJhbnNmb3JtOiAoY29kZSwgaWQpID0+IHtcclxuICAgICAgY29uc3QgcGFyc2VkSWQgPSBwYXJzZUlkKGlkKVxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIShcclxuICAgICAgICAgIHBhcnNlZElkLmVuZHNXaXRoKCcudnVlJykgfHxcclxuICAgICAgICAgIHBhcnNlZElkLmVuZHNXaXRoKCcuaHRtbCcpIHx8XHJcbiAgICAgICAgICBwYXJzZWRJZC5lbmRzV2l0aCgnLnN2ZycpXHJcbiAgICAgICAgKVxyXG4gICAgICApIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgICBpZiAoIWNvZGUuaW5jbHVkZXMoJzwhLS0nKSkge1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzID0gbmV3IE1hZ2ljU3RyaW5nKGNvZGUpXHJcbiAgICAgIHMucmVwbGFjZSgvPCEtLVtcXHdcXFdcXHNdKj8tLT4vZywgJycpXHJcblxyXG4gICAgICBpZiAocy5oYXNDaGFuZ2VkKCkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29kZTogcy50b1N0cmluZygpLFxyXG4gICAgICAgICAgbWFwOiBzb3VyY2VtYXAgJiYgKHMuZ2VuZXJhdGVNYXAoeyBzb3VyY2U6IGlkLCBpbmNsdWRlQ29udGVudDogdHJ1ZSB9KSBhcyBhbnkpLFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICB9IHNhdGlzZmllcyBQbHVnaW5cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1XLFNBQVMsU0FBUyxlQUFlO0FBQ3BZLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLGVBQWU7QUFDdEIsU0FBUyw0QkFBNEI7QUFDckMsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxhQUFhO0FBQ3BCLFNBQVMsdUJBQXVCO0FBQ2hDLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sY0FBYztBQUNyQixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sZ0JBQWdCO0FBQ3ZCLFNBQVMsbUNBQW1DOzs7QUNmNUMsT0FBTyxpQkFBaUI7QUFFeEIsU0FBUyxRQUFRLElBQVk7QUFDM0IsUUFBTSxRQUFRLEdBQUcsUUFBUSxHQUFHO0FBQzVCLE1BQUksUUFBUTtBQUFHLFdBQU87QUFBQTtBQUNqQixXQUFPLEdBQUcsTUFBTSxHQUFHLEtBQUs7QUFDL0I7QUFTTyxTQUFTLHdCQUF3QixFQUFFLFlBQVksTUFBTSxJQUFtQixDQUFDLEdBQUc7QUFDakYsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsV0FBVyxDQUFDLE1BQU0sT0FBTztBQUN2QixZQUFNLFdBQVcsUUFBUSxFQUFFO0FBQzNCLFVBQ0UsRUFDRSxTQUFTLFNBQVMsTUFBTSxLQUN4QixTQUFTLFNBQVMsT0FBTyxLQUN6QixTQUFTLFNBQVMsTUFBTSxJQUUxQjtBQUNBO0FBQUEsTUFDRjtBQUNBLFVBQUksQ0FBQyxLQUFLLFNBQVMsTUFBTSxHQUFHO0FBQzFCO0FBQUEsTUFDRjtBQUVBLFlBQU0sSUFBSSxJQUFJLFlBQVksSUFBSTtBQUM5QixRQUFFLFFBQVEsc0JBQXNCLEVBQUU7QUFFbEMsVUFBSSxFQUFFLFdBQVcsR0FBRztBQUNsQixlQUFPO0FBQUEsVUFDTCxNQUFNLEVBQUUsU0FBUztBQUFBLFVBQ2pCLEtBQUssYUFBYyxFQUFFLFlBQVksRUFBRSxRQUFRLElBQUksZ0JBQWdCLEtBQUssQ0FBQztBQUFBLFFBQ3ZFO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7OztBRDlDaU8sSUFBTSwyQ0FBMkM7QUFvQmxSLElBQU0scUJBQXFCLENBQUMsWUFBaUI7QUFBQztBQUk5QyxJQUFNLGdCQUFnQixRQUFRLElBQUksU0FBUyxRQUFRLElBQUksV0FBVyxTQUFTO0FBRTNFLElBQU0sU0FBUyxRQUFRLElBQUksYUFBYTtBQU94QyxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBLEVBRTFCLE1BQU0sUUFBUSxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtsQixNQUFNO0FBQUE7QUFBQSxFQUVOLFdBQVc7QUFBQTtBQUFBLEVBRVgsVUFBVTtBQUFBO0FBQUEsRUFFVixRQUFRO0FBQUE7QUFBQSxJQUVOLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJQSxRQUFRO0FBQUE7QUFBQSxJQUVOLHFDQUFxQztBQUFBLEVBQ3ZDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUE7QUFBQSxFQUVGO0FBQUE7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtSLG1CQUFtQixPQUFPO0FBQUE7QUFBQSxFQUU1QjtBQUFBLEVBQ0EsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1QLElBQUk7QUFBQSxNQUNGLFNBQVMsQ0FBQyxRQUFRO0FBQUEsTUFDbEIsUUFB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
