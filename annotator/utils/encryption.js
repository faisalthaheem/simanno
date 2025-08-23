const crypto = require('crypto');
const fs = require('fs');

function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

function encryptData(data, key) {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, keyBuffer);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptData(encryptedData, key) {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = Buffer.from(key, 'hex');
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher(algorithm, keyBuffer);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

function encryptWriteFile(plainText, encryptedFile, key) {
  try {
    let cipherText = null;
    if (plainText.length > 0) {
      cipherText = encryptData(plainText, key);
    }

    if (cipherText && cipherText.length > 0) {
      fs.writeFileSync(encryptedFile, cipherText);
      return true;
    }
  } catch (error) {
    console.error('Encryption error:', error);
  }
  
  return false;
}

function encryptFile(plainFile, encryptedFile, key) {
  try {
    const plainText = fs.readFileSync(plainFile, 'utf8');
    return encryptWriteFile(plainText, encryptedFile, key);
  } catch (error) {
    console.error('File encryption error:', error);
  }
  
  return false;
}

function decryptReadFile(encryptedFile, key) {
  try {
    const cipherText = fs.readFileSync(encryptedFile, 'utf8');
    
    if (cipherText.length > 0) {
      return decryptData(cipherText, key);
    }
  } catch (error) {
    console.error('Decryption error:', error);
  }
  
  return null;
}

function decryptFile(encryptedFile, plainFile, key) {
  try {
    const plainText = decryptReadFile(encryptedFile, key);
    
    if (plainText && plainText.length > 0) {
      fs.writeFileSync(plainFile, plainText);
      return true;
    }
  } catch (error) {
    console.error('File decryption error:', error);
  }
  
  return false;
}

module.exports = {
  generateKey,
  encryptData,
  decryptData,
  encryptWriteFile,
  encryptFile,
  decryptReadFile,
  decryptFile
};