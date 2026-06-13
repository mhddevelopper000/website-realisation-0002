import { defineNitroConfig } from 'nitropack'

export default defineNitroConfig({
  output: {
    dir: 'out',
    publicDir: 'out/public',
  },
  preset: 'static',
})
