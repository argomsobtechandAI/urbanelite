import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        services: resolve(__dirname, 'services.html'),
        partner: resolve(__dirname, 'partner.html'),
        contact: resolve(__dirname, 'contact.html'),
        privacy: resolve(__dirname, 'privacy.html'),
      },
    },
  },
})
