import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapispecs/library.json',
  output: [
    {
      path: './projects/reference/src/app/areas/shared',
      postProcess: ['prettier'],
      clean: true,
    },
  ],
  plugins: [
    'zod',
    {
      name: '@hey-api/typescript',
      bundle: false,
    },
  ],
});
