module.exports = {
  presets: ['next/babel'],
  env: {
    test: {
      presets: [
        [
          'next/babel',
          {
            'preset-env': {
              targets: {
                node: 'current',
              },
              modules: 'commonjs',
            },
            'preset-react': {
              runtime: 'automatic',
            }
          },
        ],
      ],
    },
  },
}