import fs from 'node:fs/promises'
import path from 'node:path'
import { minify as minifyHtml } from 'html-minifier-terser'
import { minify as minifyJs } from 'terser'

const kb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`

/** Vite already minifies the bundled JS and CSS. This plugin finishes the job for everything else that is
 *  shipped as a web page file: the HTML document, scripts copied verbatim from /public, and the JSON manifest. */
export function minifyStatic() {
  let outDir = ''

  async function rewrite(file, transform) {
    const before = await fs.readFile(file, 'utf8')
    const after = await transform(before)
    await fs.writeFile(file, after)
    console.log(`  minified ${path.relative(outDir, file).padEnd(24)} ${kb(Buffer.byteLength(before))} -> ${kb(Buffer.byteLength(after))}`)
  }

  return {
    name: 'foxtrack-minify-static',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      console.log('Minifying static files:')
      await rewrite(path.join(outDir, 'index.html'), async (source) => {
        const minified = await minifyHtml(source, {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          minifyCSS: true,
          minifyJS: true,
        })
        // The minifier silently rewrites the viewport tag ("1.0" -> "1", drops spaces). The course brief prescribes
        // this exact tag, so restore it verbatim; it is the one thing in the document worth keeping readable.
        const viewport = /<meta\s+name="viewport"[^>]*>/.exec(source)?.[0]
        return viewport ? minified.replace(/<meta name="viewport"[^>]*>/, viewport) : minified
      })

      for (const entry of await fs.readdir(outDir, { withFileTypes: true })) {
        const file = path.join(outDir, entry.name)
        if (!entry.isFile()) continue
        if (entry.name.endsWith('.js')) {
          await rewrite(file, async (source) => (await minifyJs(source, { compress: true, mangle: true })).code)
        } else if (entry.name.endsWith('.webmanifest') || entry.name.endsWith('.json')) {
          await rewrite(file, (source) => JSON.stringify(JSON.parse(source)))
        }
      }
    },
  }
}
