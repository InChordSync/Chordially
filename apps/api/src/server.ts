import { createApp } from "./app.js";

const port = 3001;

createApp().listen(port, () => {
  console.log(`API listening on port ${port}`);
});
