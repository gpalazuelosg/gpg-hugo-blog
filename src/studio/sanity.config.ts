import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {codeInput} from '@sanity/code-input'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production'

if (!projectId) {
  throw new Error(
    'SANITY_STUDIO_PROJECT_ID is required. Copy .env.example to .env and fill it in.',
  )
}

export default defineConfig({
  name: 'default',
  title: 'palazuelos.dev',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool(), codeInput()],
  schema: {types: schemaTypes},
})
