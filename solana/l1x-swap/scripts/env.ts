import fs from "fs";
import dotenv from "dotenv";

const env = {
  get(key: string): string {
    dotenv.config();
    return process.env[key] || '';
  },

  set(key: string, value: string) {
    let envFileContent = fs.readFileSync('.env', 'utf-8');
    let line = envFileContent.split('\n').find((line) => line.startsWith(key));
    if (line) {
      envFileContent = envFileContent.replace(line, `${key}=${value}`);
      fs.writeFileSync('.env', envFileContent, 'utf-8');
      console.log("Updating .env file with new value");
    }
    dotenv.config();
  }
};

export default env
