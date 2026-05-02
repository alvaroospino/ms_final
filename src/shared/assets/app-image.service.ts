import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { appImageConfig } from "../config/database.config.js";

export class AppImageService {
  private readonly cache = new Map<string, string | null>();

  invalidateDefaultImage(esEmpresa: boolean): void {
    const fileName = esEmpresa
      ? appImageConfig.defaultEmpresaImageName
      : appImageConfig.defaultPersonaImageName;
    const imagePath = resolve(process.cwd(), appImageConfig.baseDir, fileName);
    this.cache.delete(imagePath);
  }

  async getAuthImageBase64(esEmpresa: boolean): Promise<string | null> {
    const fileName = esEmpresa
      ? appImageConfig.defaultEmpresaImageName
      : appImageConfig.defaultPersonaImageName;
    const imagePath = resolve(process.cwd(), appImageConfig.baseDir, fileName);

    if (this.cache.has(imagePath)) {
      return this.cache.get(imagePath) ?? null;
    }

    try {
      const imageBuffer = await readFile(imagePath);
      const imageBase64 = imageBuffer.toString("base64");
      this.cache.set(imagePath, imageBase64);
      return imageBase64;
    } catch (error) {
      const fileError = error as NodeJS.ErrnoException;
      if (fileError.code === "ENOENT") {
        this.cache.set(imagePath, null);
        return null;
      }

      throw error;
    }
  }
}

export const appImageService = new AppImageService();
