import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";

// fungsi Logging
function logActivity(message: string) {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  const timestamp = `${date} ${time}`;
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync("activity.log", logMessage);
}

// fungsi enksripsi
async function encryptFile(filePath: string, password: string): Promise<void> {
  try {
    logActivity(`Mulai mengenkripsi file ${filePath}`);

    if (!fs.existsSync(filePath)) {
      const errorMessage = `File tidak ditemukan: ${filePath}`;
      logActivity(errorMessage);
      throw new Error(errorMessage);
    }

    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const algorithm = "aes-192-cbc";
    const key = crypto.scryptSync(password, "salt", 24);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(fileContent, "utf8", "hex");
    encrypted += cipher.final("hex");

    const encryptedFilePath =
      filePath.replace(/\.[^/.]+$/, "") + "_encrypted.txt";
    const encryptedContent = iv.toString("hex") + ":" + encrypted;

    await fs.promises.writeFile(encryptedFilePath, encryptedContent);
    logActivity(`Berhasil mengenkripsi file ${filePath}`);
    console.log(`File berhasil dienkripsi: ${encryptedFilePath}`);
  } catch (error: any) {
    const errorMessage = `Error ketika mengenkripsi file: ${error.message}`;
    logActivity(errorMessage);
    throw new Error(errorMessage);
  }
}

// fungsi dekripsi
async function decryptFile(filePath: string, password: string): Promise<void> {
  try {
    logActivity(`Mulai mendekripsi file ${filePath}`);

    if (!fs.existsSync(filePath)) {
      const errorMessage = `File tidak ditemukan: ${filePath}`;
      logActivity(errorMessage);
      throw new Error(errorMessage);
    }

    const encryptedContent = await fs.promises.readFile(filePath, "utf8");
    const algorithm = "aes-192-cbc";
    const key = crypto.scryptSync(password, "salt", 24);

    const parts = encryptedContent.split(":");
    if (parts.length < 2) {
        const errorMessage = "Format file terenkripsi tidak valid";
        logActivity(errorMessage);
        throw new Error(errorMessage);
    }

    const iv = Buffer.from(parts.shift()!, "hex");
    const encrypted = parts.join(":");

    try {
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      const decryptedFilePath = filePath.replace(
        /_encrypted\.txt$/,
        "_decrypted.txt"
      );
      await fs.promises.writeFile(decryptedFilePath, decrypted);
      logActivity(`Berhasil mendekripsi file ${filePath}`);
      console.log(`File berhasil didekripsi: ${decryptedFilePath}`);
    } catch (error) {
      throw new Error("Password yang dimasukkan salah");
    }
  } catch (error: any) {
    const errorMessage = `Error ketika mendekripsi file: ${error.message}`;
    logActivity(errorMessage);
    throw new Error(errorMessage);
  }
}

async function main() {
  try {
    const [command, filePath, password] = process.argv.slice(2);

    if (!command || !filePath || !password) {
      const errorMessage =
        "Usage: ts-node index.ts <encrypt|decrypt> <filePath> <password>";
      logActivity(errorMessage);
      throw new Error(errorMessage);
    }

    switch (command.toLowerCase()) {
      case "encrypt":
        await encryptFile(filePath, password);
        break;
      case "decrypt":
        await decryptFile(filePath, password);
        break;
      default:
        const errorMessage =
          "Command tidak valid. Gunakan encrypt atau decrypt";
        logActivity(errorMessage);
        throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
