{
  'targets': [
    {
      'target_name': 'time',
      'sources': [ 'src/time.cc' ],
      'conditions': [
        ['OS=="mac"', {
          'defines': [
            '__DARWIN_UNIX03'  # For char* timezone
          ]
        }]
      ]
    }
  ]
}
