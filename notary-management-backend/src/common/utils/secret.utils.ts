import * as bcrypt from 'bcrypt';

export class SecretUtils {
  static async hash(raw: string): Promise<string> {
    const rounds = 12;
    return await bcrypt.hash(raw, rounds);
  }

  static async compare(raw: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(raw, hash);
  }
}
