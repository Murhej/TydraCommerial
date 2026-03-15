import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const repoBase = '/TydraCommerial/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: isGithubActions ? repoBase : '/',
})
