'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const candidates = [
  '/usr/share/javascript/libjs-autolink/autolink.js',
  path.join(__dirname, '..', '..', 'autolink.js'),
];

const autolinkPath = candidates.find((candidate) => fs.existsSync(candidate));
if (!autolinkPath) {
  throw new Error('autolink.js not found in expected locations');
}

require(autolinkPath);

const cases = [
  {
    name: 'plain text untouched',
    input: 'No URL here',
    expected: 'No URL here',
  },
  {
    name: 'single http link',
    input: 'Visit http://example.com',
    expected: "Visit <a href='http://example.com'>http://example.com</a>",
  },
  {
    name: 'multiple links',
    input: 'Docs http://example.com and https://example.org',
    expected:
      "Docs <a href='http://example.com'>http://example.com</a> and <a href='https://example.org'>https://example.org</a>",
  },
  {
    name: 'ftp link',
    input: 'FTP ftp://ftp.example.com',
    expected: "FTP <a href='ftp://ftp.example.com'>ftp://ftp.example.com</a>",
  },
  {
    name: 'subdomain support',
    input: 'Check it: http://some.sub.domain',
    expected:
      "Check it: <a href='http://some.sub.domain'>http://some.sub.domain</a>",
  },
  {
    name: 'tld agnostic',
    input: 'Click here http://bit.ly/1337 now',
    expected:
      "Click here <a href='http://bit.ly/1337'>http://bit.ly/1337</a> now",
  },
  {
    name: 'punctuation handled',
    input: 'Go here now http://example.com!',
    expected: "Go here now <a href='http://example.com'>http://example.com</a>!",
  },
  {
    name: 'unicode apostrophe',
    input: 'Safety for Syria’s Women http://example.com/story',
    expected:
      "Safety for Syria’s Women <a href='http://example.com/story'>http://example.com/story</a>",
  },
  {
    name: 'newline support',
    input: 'Line one\nhttp://example.com',
    expected:
      "Line one\n<a href='http://example.com'>http://example.com</a>",
  },
  {
    name: 'html break support',
    input: 'Line one<br>http://example.com',
    expected:
      "Line one<br><a href='http://example.com'>http://example.com</a>",
  },
  {
    name: 'hash fragment preserved',
    input: 'Go here now http://example.com/#query=index',
    expected:
      "Go here now <a href='http://example.com/#query=index'>http://example.com/#query=index</a>",
  },
  {
    name: 'escaped fragment preserved',
    input: 'Go here now http://twitter.com/#!/PostDeskUK',
    expected:
      "Go here now <a href='http://twitter.com/#!/PostDeskUK'>http://twitter.com/#!/PostDeskUK</a>",
  },
  {
    name: 'parentheses support',
    input:
      'My favorite Wikipedia Article http://en.wikipedia.org/wiki/Culture_of_honor_(Southern_United_States)',
    expected:
      "My favorite Wikipedia Article <a href='http://en.wikipedia.org/wiki/Culture_of_honor_(Southern_United_States)'>http://en.wikipedia.org/wiki/Culture_of_honor_(Southern_United_States)</a>",
  },
  {
    name: 'html list support',
    input: '<li>http://example.com</li>',
    expected:
      "<li><a href='http://example.com'>http://example.com</a></li>",
  },
  {
    name: 'image tag untouched',
    input: "Image <img src='http://example.com/logo.png'>",
    expected: "Image <img src='http://example.com/logo.png'>",
  },
  {
    name: 'anchor tag untouched',
    input: "Anchor <a href='http://example.com'>http://example.com</a>",
    expected: "Anchor <a href='http://example.com'>http://example.com</a>",
  },
  {
    name: 'anchor tag with trailing url',
    input:
      "Anchor <a href='http://example.com'>http://example.com</a> to http://example.com",
    expected:
      "Anchor <a href='http://example.com'>http://example.com</a> to <a href='http://example.com'>http://example.com</a>",
  },
];

for (const { name, input, expected } of cases) {
  const actual = input.autoLink();
  assert.strictEqual(actual, expected, `Case "${name}" failed`);
}

const attributeResult = 'See http://example.com'.autoLink({
  target: '_blank',
  rel: 'noreferrer',
});

assert.strictEqual(
  attributeResult,
  "See <a href='http://example.com' target='_blank' rel='noreferrer'>http://example.com</a>",
  'Attributes were not applied correctly'
);

const callbackResult = 'Lookup http://example.com'.autoLink({
  callback: (url) => `[${url}](${url})`,
});

assert.strictEqual(
  callbackResult,
  'Lookup [http://example.com](http://example.com)',
  'Callback did not override rendering'
);

const fallbackResult = 'Link http://example.com'.autoLink({
  target: '_blank',
  callback: undefined,
});

assert.strictEqual(
  fallbackResult,
  "Link <a href='http://example.com' target='_blank'>http://example.com</a>",
  'Default rendering should be used when callback is undefined'
);

const selectiveCallbackResult =
  'Image http://example.com/logo.png and site http://example.com'.autoLink({
    target: '_blank',
    callback: (url) =>
      /\.(gif|png|jpe?g)$/i.test(url)
        ? `<img src='${url}' alt='${url}'>`
        : undefined,
  });

assert.strictEqual(
  selectiveCallbackResult,
  "Image <img src='http://example.com/logo.png' alt='http://example.com/logo.png'> and site <a href='http://example.com' target='_blank'>http://example.com</a>",
  'Callback should transform images and fall back for other URLs'
);
