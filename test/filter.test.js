const filter = require("../lib/filter");

test('test change nothing', () => {
    let str = `<!DOCTYPE html><html><head></head><body>字</body></html>`;
    expect(filter(str))
        .toBe(`<!DOCTYPE html><html><head></head><body>字</body></html>`)
})

test('test inner text', () => {
    let str = `<!DOCTYPE html><html><head></head><body>中文English</body></html>`;
    expect(filter(str))
        .toBe(`<!DOCTYPE html><html><head></head><body>中文<hanla></hanla>English</body></html>`)
})

test('test ignore space', () => {
    let str = `<!DOCTYPE html><html><head></head><body>中文 English</body></html>`;
    expect(filter(str))
        .toBe(`<!DOCTYPE html><html><head></head><body>中文 English</body></html>`)
})

test('test cross match 1', () => {
    let str = `<!DOCTYPE html><html><head></head><body>中文<em>English</em></body></html>`;
    expect(filter(str))
        .toBe(`<!DOCTYPE html><html><head></head><body>中文<hanla></hanla><em>English</em></body></html>`)
})

test('test cross match 2', () => {
    let str = `<!DOCTYPE html><html><head></head><body>中文<em>English</em></body></html>`;
    expect(filter(str))
        .toBe(`<!DOCTYPE html><html><head></head><body>中文<hanla></hanla><em>English</em></body></html>`)
})

test('test cross match 3', () => {
    let str = `<!DOCTYPE html><html><head></head><body><a href="link">中文</a><em>English</em></body></html>`;
    expect(filter(str))
        .toBe(`<!DOCTYPE html><html><head></head><body><a href="link">中文</a><hanla></hanla><em>English</em></body></html>`)
})

test('test cross match 4', () => {
    let str = `<!DOCTYPE html><html><head></head><body><div><div><div><a href="link">中文</a></div></div></div><em>English</em></body></html>`;
    expect(filter(str))
        .toBe(`<!DOCTYPE html><html><head></head><body><div><div><div><a href="link">中文</a></div></div></div><hanla></hanla><em>English</em></body></html>`)
})
