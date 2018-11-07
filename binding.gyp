{
  'targets': [
    {
      'target_name': 'time',
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': { 'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'include_dirs': [
        '<!@(node -p "require(\'node-addon-api\').include")',
      ],
      'sources': [ 'src/time.cc' ],
      'conditions': [
        ['OS=="mac"', {
          'defines': [
            '__DARWIN_UNIX03', # For char* timezone
            'HAVE_TM_GMTOFF'
          ]
        }],
        ['OS=="linux"', {
          'defines': [
            'HAVE_TM_GMTOFF'
          ]
        }],
        ['OS=="solaris"', {
          'defines': [
            'HAVE_ALTZONE',
            'HAVE_TIMEZONE'
          ]
        }]
      ]
    }
  ]
}
