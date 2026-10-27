// Reusable TransformStreams for text pipelines.

// Turns text chunks into one chunk per line.
export function splitLines() {
  let rest = "";
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      const lines = (rest + chunk).split("\n");
      rest = lines.pop()!;
      for (const line of lines) if (line) controller.enqueue(line);
    },
    flush(controller) {
      if (rest) controller.enqueue(rest);
    },
  });
}

// Keeps events of one type and passes them on as NDJSON lines.
export function keepType(type: string) {
  return new TransformStream<string, string>({
    transform(line, controller) {
      try {
        if (JSON.parse(line).type === type) {
          controller.enqueue(line + "\n");
        }
      } catch {
        // skip lines that are not JSON
      }
    },
  });
}
