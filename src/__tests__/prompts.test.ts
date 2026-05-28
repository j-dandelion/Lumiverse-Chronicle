import { parseSummaryJson, sanitizeJsonForParse, buildSummarizePrompt, extractContentKeywords } from '../prompts'

// ── Test cases ──────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

function eq<T>(a: T, b: T, label: string) {
  if (a === b) {
    passed++
  } else {
    failed++
    console.error(`FAIL: ${label} — expected "${b}", got "${a}"`)
  }
}

function p(text: string) { return parseSummaryJson(text) }

// 1. Perfect JSON
const perfect = '{"title":"Hello","keys":["a","b"],"content":"World"}'
const r1 = p(perfect)
assert(r1 !== null, 'perfect json parses')
eq(r1?.title, 'Hello', 'perfect title')
eq(r1?.keys.length, 2, 'perfect keys')
eq(r1?.content, 'World', 'perfect content')

// 2. With markdown fences
const fenced = '```json\n{"title":"Hi","keys":["x"],"content":"Yo"}\n```'
const r2 = p(fenced)
assert(r2 !== null, 'fenced json parses')
eq(r2?.title, 'Hi', 'fenced title')

// 3. With prose wrapper
const prose = 'Here is the summary:\n{"title":"Test","keys":["a"],"content":"Text"}'
const r3 = p(prose)
assert(r3 !== null, 'prose-wrapped json parses')
eq(r3?.title, 'Test', 'prose title')

// 4. Missing keys (still valid)
const noKeys = '{"title":"T","content":"C"}'
const r4 = p(noKeys)
assert(r4 !== null, 'no keys is ok')
eq(r4?.keys.length, 0, 'no keys empty')

// 5. Empty content (should fail)
const empty = '{"title":"T","keys":["a"],"content":""}'
assert(p(empty) === null, 'empty content returns null')

// 6. Truncated JSON (missing close brace)
const truncated = '{"title":"T","keys":["a"],"content":"C"'
assert(p(truncated) === null, 'truncated json returns null')

// 7. Extra fields (should parse fine)
const extra = '{"title":"T","keys":["a"],"content":"C","extra":true}'
const r7 = p(extra)
assert(r7 !== null, 'extra fields ok')
eq(r7?.title, 'T', 'extra fields title')

// 8. Nested braces in content
const nested = '{"title":"T","keys":["a"],"content":"The {thing} happened"}'
const r8 = p(nested)
assert(r8 !== null, 'nested braces ok')
eq(r8?.content, 'The {thing} happened', 'nested braces content')

// 9. Long keys truncated
const longKey = 'x'.repeat(200)
const longKeys = `{"title":"T","keys":["${longKey}"],"content":"C"}`
const r9 = p(longKeys)
assert(r9 !== null, 'long keys parses')
eq(r9?.keys[0]?.length, 100, 'long key truncated to 100')

// 10. Garbage input
assert(p('not json at all') === null, 'garbage returns null')
assert(p('') === null, 'empty returns null')

// 11. Wrong shape
assert(p('{"unrelated": "data"}') === null, 'wrong shape returns null')

// 12. Missing title (uses fallback)
const noTitle = '{"keys":["a"],"content":"C"}'
const r12 = p(noTitle)
assert(r12 !== null, 'no title ok')
eq(r12?.title, 'Untitled Entry', 'missing title fallback')

// ── sanitizeJsonForParse edge cases ──────────────────────────────────

// 13. Trailing comma stripping (outside string)
const s13 = sanitizeJsonForParse('{"a": 1,}')
eq(s13, '{"a": 1}', 'trailing comma before } stripped')

// 14. Trailing comma in array (outside string)
const s14 = sanitizeJsonForParse('{"a": [1, 2,]}')
eq(s14, '{"a": [1, 2]}', 'trailing comma before ] stripped')

// 15. Comma+brace inside string content NOT stripped
const s15 = sanitizeJsonForParse('{"content": "hello,} world"}')
eq(s15, '{"content": "hello,} world"}', 'comma-brace inside string preserved')

// 16. Tab character inside string escaped
const s16 = sanitizeJsonForParse('{"content": "hello\tworld"}')
eq(s16, '{"content": "hello\\tworld"}', 'tab escaped to \\\\t')

// 17. Newlines inside string escaped (existing behavior)
const s17 = sanitizeJsonForParse('{"content": "line1\nline2"}')
eq(s17, '{"content": "line1\\nline2"}', 'newline escaped')

// 18. parseSummaryJson with unescaped newlines in content (the original bug)
const withNewlines = '{"title":"Test","keys":["k1"],"content":"line1\nline2\nline3"}'
const r18 = p(withNewlines)
assert(r18 !== null, 'newlines in content parses')
eq(r18?.content, 'line1\nline2\nline3', 'content with newlines extracted')

// 19. parseSummaryJson with tab in content
const withTab = '{"title":"T","keys":["k"],"content":"col1	col2"}'
const r19 = p(withTab)
assert(r19 !== null, 'tab in content parses')
eq(r19?.content, 'col1	col2', 'content with tab extracted')

// 20. parseSummaryJson with "keywords" field name (not "keys") — prompt says "keywords"
const withKeywords = '{"title":"Test","keywords":["alpha","beta","gamma"],"content":"summary text"}'
const r20 = p(withKeywords)
assert(r20 !== null, '"keywords" field parses')
assert(r20?.keys.length === 3, '3 keywords extracted')
eq(r20?.keys[0], 'alpha', 'first keyword extracted')
eq(r20?.keys[2], 'gamma', 'last keyword extracted')

// ── buildSummarizePrompt tests ──────────────────────────────────────

// 21. Default prompt without sceneNumber — {number} stays literal
const bp1 = buildSummarizePrompt([{ role: 'user', content: 'hello' }], 'Test')
assert(bp1.systemPrompt.includes('{number}'), '{number} present when no sceneNumber')

// 22. Default prompt with sceneNumber — {number} replaced
const bp2 = buildSummarizePrompt([{ role: 'user', content: 'hello' }], 'Test', undefined, '05')
assert(!bp2.systemPrompt.includes('{number}'), '{number} removed when sceneNumber provided')
assert(bp2.systemPrompt.includes('05'), 'scene number injected: 05')

// 23. Custom prompt with sceneNumber — {number} replaced in custom prompt too
const bp3 = buildSummarizePrompt(
  [{ role: 'user', content: 'hello' }], 'Test',
  'Custom prompt with {number} placeholder', '42'
)
assert(!bp3.systemPrompt.includes('{number}'), '{number} replaced in custom prompt')
assert(bp3.systemPrompt.includes('Custom prompt with 42'), 'scene number injected in custom prompt: 42')

// 24. Recent context appended to system prompt
const bp4 = buildSummarizePrompt(
  [{ role: 'user', content: 'hello' }], 'Test', undefined, '03',
  '\n\n<> Recent scenes:\n- Scene 02: stuff happened'
)
assert(bp4.systemPrompt.includes('Recent scenes:'), 'recent context appended')

// 25. User prompt template still works
assert(bp1.userPrompt.includes('Test'), 'title in user prompt')
assert(bp1.userPrompt.includes('hello'), 'message content in user prompt')

// ── extractContentKeywords tests ──────────────────────────────────────

// 26. Basic extraction from content
const extracted = extractContentKeywords('The commander stood on the observation deck watching the starship approach the alien planet.', 'First Contact')
assert(extracted.length > 0, 'extracts keywords from content')
assert(extracted.includes('observation'), 'observation extracted')
assert(extracted.includes('commander'), 'commander extracted')
assert(extracted.includes('starship'), 'starship extracted')
assert(extracted.includes('planet'), 'planet extracted')

// 27. Empty content — title-only fallback
const titleOnly = extractContentKeywords('', 'First Contact')
assert(titleOnly.length > 0, 'title contributes keywords')
assert(titleOnly.includes('contact'), 'title words extracted')

// 28. Short words filtered from content, title still contributes
const shortWords = extractContentKeywords('a an the cat dog bird fish run big red', 'First Contact')
assert(!shortWords.includes('cat'), '"cat" filtered (3 chars)')
assert(!shortWords.includes('dog'), '"dog" filtered (3 chars)')
assert(!shortWords.includes('the'), '"the" filtered (< 4 chars)')
assert(shortWords.includes('first'), 'title word kept')
assert(shortWords.includes('contact'), 'title word kept')

// 29. Stop words filtered
const stopWords = extractContentKeywords('this and that with from between', 'First Contact')
assert(!stopWords.includes('this'), 'stop word filtered')
assert(!stopWords.includes('between'), 'stop word filtered')
assert(stopWords.includes('first'), 'title word kept')

// 30. Max 20 keywords
const manyWords = extractContentKeywords(
  Array.from({ length: 50 }, (_, i) => `word${i} `).join(''),
  'Title'
)
assert(manyWords.length <= 20, 'max 20 keywords')

// ── Additional field name variants ────────────────────────────────────

// 31. parseSummaryJson with "key" (singular) field name
const withKey = '{"title":"Test","key":["alpha","beta"],"content":"summary text"}'
const r31 = p(withKey)
assert(r31 !== null, '"key" field parses')
assert(r31?.keys.length === 2, '2 keys from "key" field')

// 32. parseSummaryJson with "tags" field name
const withTags = '{"title":"Test","tags":["alpha","beta","gamma"],"content":"summary text"}'
const r32 = p(withTags)
assert(r32 !== null, '"tags" field parses')
assert(r32?.keys.length === 3, '3 keys from "tags" field')

// 33. parseSummaryJson empty keys array — still valid (fallback handles this at worker level)
const emptyKeys = '{"title":"Test","keys":[],"content":"summary text"}'
const r33 = p(emptyKeys)
assert(r33 !== null, 'empty keys array still valid')
assert(r33?.keys.length === 0, 'empty keys array parsed as empty')

// ── Results ──────────────────────────────────────────────────────────

console.log(`${passed} passed, ${failed} failed`)
if (failed > 0) throw new Error(`${failed} test(s) failed`)
