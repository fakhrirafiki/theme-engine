import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: false,
  external: ['react', 'react-dom'],
  bundle: true,
  outDir: 'dist',
  // Add "use client" banner to the main bundle
  banner: {
    js: '"use client";',
  },
  esbuildOptions(options) {
    // Transform JSX for CommonJS compatibility
    options.jsx = 'automatic'
  }
})
