// Raw byte SHA256 values measured after downloading exact GitHub revisions.
export const projects = [
  { id: 'todomvc', platform: 'web', repo: 'tastejs/todomvc', revision: 'ff43b02e59dfa604386bb382034b2cd07c2bcd8a', license: 'MIT', feature: 'ES5 Todo model/store CRUD, filters, counters and ID lifecycle', files: [
    ['examples/javascript-es5/src/store.js', '0bc9d37949d094d104a5a0050f68a0b20d2a2b536d5c31fac70c95185ff08303'],
    ['examples/javascript-es5/src/model.js', '7f3dd8368e8b1aded3c004a8fe86b7594d43495aec2fa4f0a5b3933f98654ff1'],
    ['license.md', '32238c5c6759b589ea768661b6eb0fcb42449b74d57cdf09928743f2e1eb748d']
  ] },
  { id: 'sharex', platform: 'desktop', repo: 'ShareX/ShareX', revision: '4b8e66cfab23c54bf4a9d5c2bd7d10c7b2561358', license: 'Repository GPL-3.0; file header says GPL v2-or-later under GPL v3 heading; retain both notices', feature: 'CRC32 standard/custom seed/polynomial and actual offset API behavior', files: [
    ['ShareX.HelpersLib/Cryptographic/Crc32.cs', 'c4bc744c95b4142850e41eadaadbbb5b525314df1286d9692ea4b51ad2f6ea02'],
    ['LICENSE.txt', 'c53a65c2fd561c87eaabf1072ef5dcab8653042bc15308465f52413585eb6271']
  ] },
  { id: 'markor', platform: 'android', repo: 'gsantner/markor', revision: 'aff9492c55a1d0a09e3b11e603a0487678bb4f27', license: 'Apache-2.0 repository; GsTextUtils Unlicense OR CC0-1.0', feature: 'Filename natural comparator with exact isNullOrEmpty dependency-method extraction', files: [
    ['app/src/main/java/net/gsantner/opoc/util/AlphanumComparator.java', 'da97aa3672d8aece6b7c45a9f8731ed66d0fb57a6741ebb2b50fd6d26d9e2271'],
    ['app/src/main/java/net/gsantner/opoc/format/GsTextUtils.java', 'e5adff8ca3f1c4138ebd19f973a45d532c1e65b118875d960f62b86f633cdfc8'],
    ['LICENSE.txt', 'c437394423b46d2d56b4a9a533626b0e32cec757a9185adab8b1e7b43edd57ef']
  ] }
];
