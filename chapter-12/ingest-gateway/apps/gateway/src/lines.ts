// Splits a stream of bytes into lines without ever holding more than
// one chunk and one partial line in memory.
export async function* readLines(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let rest = "";
  for await (const chunk of stream) {
    const text = rest + decoder.decode(chunk, { stream: true });
    const lines = text.split("\n");
    rest = lines.pop()!; // the last piece may be an unfinished line
    yield* lines;
  }
  rest += decoder.decode(); // flush any final multi-byte character
  if (rest) yield rest;
}
