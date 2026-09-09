import { spawnSync } from "node:child_process";
import { writeFileSync, renameSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const target = process.argv[2];
const projectRef = process.argv[3];
if (!["--local", "--linked", "--project-id"].includes(target) ||
    (target === "--project-id" && !/^[a-z]{20}$/.test(projectRef ?? ""))) {
  throw new Error("사용법: npm run db:types -- --local, --linked 또는 --project-id <REF>");
}
const args = ["gen", "types", "typescript", target];
if (target === "--project-id") args.push(projectRef);
const result = spawnSync("supabase", [...args, "--schema", "public", "--agent", "no", "--output-format", "text"], {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
if (result.status !== 0 || result.error || !result.stdout.includes("export type Database")) {
  // Never truncate a previously generated type file when CLI/auth/network fails.
  throw new Error("DB 타입 생성 실패. Supabase CLI 연결 상태를 확인하세요. 기존 파일은 유지됩니다.");
}
const directory = resolve("src/types");
mkdirSync(directory, { recursive: true });
const temporary = resolve(directory, "database.ts.tmp");
writeFileSync(temporary, result.stdout);
renameSync(temporary, resolve(directory, "database.ts"));
console.log("src/types/database.ts 생성 완료");
