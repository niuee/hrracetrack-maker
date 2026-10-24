import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Material UI 5's icon subpaths default to CommonJS; use its ESM build.
      { find: /^@mui\/icons-material\/(.*)$/, replacement: '@mui/icons-material/esm/$1' },
    ],
  },
});
