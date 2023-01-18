const Filter = require("../lib/filter");

const conf = {
  enable: false,
  inject_css: true,
  tag_name: 'hanla',
  entry: {
    name: 'body',
    type: 'tag',
  }
};

const filter = new Filter(conf);

function fragment(...content) {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '</head>',
    '<body>',
    ...content,
    '</body>',
    '</html>'
  ].join('');
}

test('test empty', () => {
  const str = fragment();
  expect(filter.process(str)).toBe(str)
})

test('test unchanged', () => {
  const str = fragment('字');
  expect(filter.process(str)).toBe(str);
})

test('test inner text', () => {
  const input = fragment('中文English中文');
  const output = fragment('中文', '<hanla></hanla>', 'English', '<hanla></hanla>', '中文');
  expect(filter.process(input)).toBe(output);
})

test('test already inserted', () => {
  const str = fragment('中文', '<hanla></hanla>', 'English');
  expect(filter.process(str)).toBe(str);
})

test('test wrapping inner text', () => {
  const input = fragment('中文English中文');
  const output = fragment('中文', '<hanla></hanla>', 'English', '<hanla></hanla>', '中文');
  expect(filter.process(input)).toBe(output);
})

test('test ignore space', () => {
  const str = fragment('中文 English');
  expect(filter.process(str)).toBe(str);
})

test('test cross match 1', () => {
  const input = fragment('中文<em>English</em>');
  const output = fragment('中文', '<hanla></hanla>', '<em>English</em>');
  expect(filter.process(input)).toBe(output);
})

test('test cross match 2', () => {
  const input = fragment('<em>中文</em>English');
  const output = fragment('<em>中文<hanla></hanla></em>', 'English');
  expect(filter.process(input)).toBe(output);
})

test('test cross match 3', () => {
  const input = fragment('<a href="link">中文</a>', '<em>English</em>');
  const output = fragment('<a href="link">中文<hanla></hanla>', '</a>', '<em>English</em>')
  expect(filter.process(input)).toBe(output);
})

test('test cross match complex', () => {
  const input = fragment(
    '<div>',
    '<div>',
    '<div>',
    '<a href="link">中文English中文</a>',
    '</div>',
    '</div>',
    '</div>',
    '<em>English</em>');

  const output = fragment(
    '<div>',
    '<div>',
    '<div>',
    '<a href="link">',
    '中文',
    '<hanla></hanla>',
    'English',
    '<hanla></hanla>',
    '中文',
    '<hanla></hanla>',
    '</a>',
    '</div>',
    '</div>',
    '</div>',
    '<em>English</em>');

  expect(filter.process(input)).toBe(output);
})

test('test filter div only', () => {
  const input = fragment('<p>字note</p>', '<div>中文English</div>');
  const output = fragment(
    '<p>字note</p>',
    '<div>',
    '中文',
    '<hanla></hanla>',
    'English',
    '</div>');

  expect((new Filter({
    ...conf,
    entry: { name: 'div' }
  })).process(input))
    .toBe(output);
})

test('test filter .hanla only', () => {
  const input = fragment(
    '<p>字note</p>',
    '<div class="hanla other-class">',
    '中文English',
    '</div>');
  const output = fragment(
    '<p>字note</p>',
    '<div class="hanla other-class">',
    '中文',
    '<hanla></hanla>',
    'English',
    '</div>');

  expect((new Filter({
    ...conf,
    entry: {
      type: 'class',
      name: 'hanla'
    }
  })).process(input))
    .toBe(output);
})

test('test match multi nodes', () => {
  const input = fragment(
    '<div class="hanla">English中文</div>',
    '<div class="hanla">',
    '中文English',
    '<div class="hanla">',
    '中文English',
    '</div>',
    '</div>');
  const output = fragment(
    '<div class="hanla">',
    'English',
    '<hanla></hanla>',
    '中文',
    '</div>',
    '<div class="hanla">',
    '中文',
    '<hanla></hanla>',
    'English',
    '<div class="hanla">',
    '<hanla></hanla>',
    '中文',
    '<hanla></hanla>',
    'English',
    '</div>',
    '</div>');

  expect(filter.process(input)).toBe(output);
})


test('test bug', () => {
  const input = fragment(
    '<div class="hanla">',
    '<p>',
    '正如',
    '<a href="#系统要求">系统要求</a>',
    '中parallel的输出中所提到的，当论文数据处理用到了该工具的时候，应该按照parallel的作者给出的形式',
    '<span class="citation" data-cites="tange2011gnu">',
    '[<a href="#ref-tange2011gnu" role="doc-biblioref">1</a>]',
    '</span>',
    '进行引用。',
    '</p>',
    '</div>');
  const output = fragment(
    '<div class="hanla">',
    '<p>',
    '正如',
    '<a href="#系统要求">系统要求</a>',
    '中',
    '<hanla></hanla>',
    'parallel',
    '<hanla></hanla>',
    '的输出中所提到的，当论文数据处理用到了该工具的时候，应该按照',
    '<hanla></hanla>',
    'parallel',
    '<hanla></hanla>',
    '的作者给出的形式',
    '<hanla></hanla>',
    '<span class="citation" data-cites="tange2011gnu">',
    '[<a href="#ref-tange2011gnu" role="doc-biblioref">1</a>]',
    '</span>',
    '<hanla></hanla>',
    '进行引用。',
    '</p>',
    '</div>')
  expect(filter.process(input))
    .toBe(output);
})
