import { renderToString } from "react-dom/server";

function Greeting({ name }: { name: string }) {
  return <h1 className="title">Hello, {name}</h1>;
}

const html = renderToString(<Greeting name="Bun" />);
console.log(html);
