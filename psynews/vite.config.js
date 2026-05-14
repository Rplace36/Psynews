import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase'))                    return 'supabase-vendor';
          if (id.includes('react-helmet-async'))           return 'helmet';
          if (id.includes('@tiptap') || id.includes('lowlight') || id.includes('prosemirror')) return 'tiptap-vendor';
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('node_modules/react/')) return 'react-vendor';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
