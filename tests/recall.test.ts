import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText, docTitle, snippet } from "../lib/notes.ts";
import { pca2d } from "../lib/pca.ts";
import { diversify, topK } from "../lib/vector.ts";

test("short paragraphs merge into passages and long text splits on sentences", () => {
  const para = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
  const merged = chunkText(`${para(15)}\n\n${para(15)}\n\n${para(15)}`, 110);
  assert.equal(merged.length, 1);
  const long = Array.from({ length: 40 }, (_, i) => `This is sentence number ${i} of a long paragraph.`).join(" ");
  const chunks = chunkText(long, 60);
  assert.ok(chunks.length > 2);
  assert.ok(chunks.every((c) => c.split(/\s+/).length <= 110));
  assert.deepEqual(chunkText("tiny"), []);
});

test("snippet centers on the query term and trims long text", () => {
  const text = `${"filler ".repeat(80)}the budget meeting is on friday ${"more ".repeat(80)}`;
  const s = snippet(text, "budget meeting");
  assert.ok(s.includes("budget"));
  assert.ok(s.length <= 245);
  assert.equal(snippet("short text", "x"), "short text");
  assert.equal(docTitle("notes.md"), "notes");
});

test("pca2d is deterministic, bounded and separates two clusters along the first axis", () => {
  const a = Array.from({ length: 10 }, (_, i) => new Float32Array([5 + i * 0.01, 0, 0.01 * i, 0]));
  const b = Array.from({ length: 10 }, (_, i) => new Float32Array([-5 - i * 0.01, 0, -0.01 * i, 0]));
  const p1 = pca2d([...a, ...b]);
  const p2 = pca2d([...a, ...b]);
  assert.deepEqual(p1, p2);
  assert.ok(p1.every(([x, y]) => Math.abs(x) <= 1 + 1e-9 && Math.abs(y) <= 1 + 1e-9));
  const left = p1.slice(0, 10).map((p) => Math.sign(p[0]));
  const right = p1.slice(10).map((p) => Math.sign(p[0]));
  assert.ok(left.every((s) => s === left[0]) && right.every((s) => s === right[0]) && left[0] !== right[0]);
  assert.deepEqual(pca2d([]), []);
});

test("retrieval ranks by similarity and caps results per document", () => {
  const q = new Float32Array([1, 0]);
  const vs = [new Float32Array([1, 0]), new Float32Array([0.95, 0.05]), new Float32Array([0.9, 0.1]), new Float32Array([0, 1])];
  const docs = ["a", "a", "a", "b"];
  const top = topK(q, vs, 4, 0.5);
  assert.deepEqual(top.map((s) => s.index), [0, 1, 2]);
  assert.deepEqual(diversify(top, (i) => docs[i], 2).map((s) => s.index), [0, 1]);
});
