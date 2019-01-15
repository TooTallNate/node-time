{
    'targets': [{
        'target_name': 'time',
        'sources': [ 'src/time_napi.cc' ],
        'include_dirs': ["<!@(node -p \"require('node-addon-api').include\")"],
        'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"],
        'cflags!': [ '-fno-exceptions' ],
        'cflags_cc!': [ '-fno-exceptions' ],
        'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7'
        },
        'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
        },
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
     }]
}
