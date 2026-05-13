import fs from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

export async function readJson<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const text = await fs.readFile(path.join(DATA_DIR, filename), "utf-8")
    return JSON.parse(text) as T
  } catch {
    return defaultValue
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf-8")
}
