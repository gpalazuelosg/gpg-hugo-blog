import {defineType, defineField, defineArrayMember} from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
      description: 'Shown on listing pages and used as the meta description fallback.',
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Heading 4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
        }),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              validation: (rule) => rule.required(),
            }),
          ],
        }),
        defineArrayMember({
          type: 'code',
          options: {
            language: 'text',
            languageAlternatives: [
              {title: 'Plain text', value: 'text'},
              {title: 'Bash', value: 'bash'},
              {title: 'CSS', value: 'css'},
              {title: 'Go', value: 'go'},
              {title: 'HTML', value: 'html'},
              {title: 'JavaScript', value: 'javascript'},
              {title: 'JSON', value: 'json'},
              {title: 'Markdown', value: 'markdown'},
              {title: 'Python', value: 'python'},
              {title: 'Rust', value: 'rust'},
              {title: 'SQL', value: 'sql'},
              {title: 'TSX', value: 'tsx'},
              {title: 'TypeScript', value: 'typescript'},
              {title: 'YAML', value: 'yaml'},
            ],
            withFilename: true,
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      description: 'Post is public when this is set and not in the future.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'metaDesc',
          title: 'Meta description',
          type: 'text',
          rows: 2,
          description: 'Optional. Falls back to summary if empty.',
          validation: (rule) => rule.max(160),
        }),
        defineField({
          name: 'ogImage',
          title: 'Open Graph image',
          type: 'image',
          options: {hotspot: true},
          description: 'Optional. Falls back to cover image if empty.',
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Published, newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'publishedAt', media: 'coverImage'},
  },
})
