import config from '@tuomashatakka/eslint-config'


export default [
  { ignores: [ 'dist/**', 'public/**', 'node_modules/**' ]},
  ...config,
]
