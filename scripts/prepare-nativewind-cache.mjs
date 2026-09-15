import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const cacheFile = resolve(
  process.cwd(),
  "node_modules/react-native-css-interop/.cache/web.css",
);

try {
  await access(cacheFile);
  console.log("[nativewind-cache] existing web CSS cache preserved");
} catch {
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(
    cacheFile,
    "/* NativeWind Metro build placeholder; generated CSS replaces this during export. */\n",
    { flag: "wx" },
  );
  console.log("[nativewind-cache] web CSS cache placeholder prepared");
}
