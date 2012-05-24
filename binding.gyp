{
  'targets': [
    {
      'target_name': 'pinba_bindings',
      'sources': [
        'src/pinba_bindings.cc',
      ],
      'conditions': [
        ['OS=="win"', {
          # no Windows support...
        }, {
          'libraries': [
            #'-L/usr/local/pinba/lib -lpinba'
          ],
        }],
        ['OS=="mac"', {
          # cflags on OS X are stupid and have to be defined like this
          'xcode_settings': {
            'OTHER_CFLAGS': [
              #'-I/usr/local/pinba/include'
            ]
          }
        }, {
          'cflags': [
            #'-I/usr/local/pinba/include'
          ],
        }]
      ]
    }
  ]
}
