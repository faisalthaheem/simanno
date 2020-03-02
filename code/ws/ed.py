import logging
import traceback
import io
import argparse as argparse
from cryptography.fernet import Fernet

#create logger
logger = logging.getLogger('encrypt')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler('encrypt.log')
fh.setLevel(logging.DEBUG)
# create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
# create formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)
# add the handlers to the logger
logger.addHandler(fh)
logger.addHandler(ch)

def generateKey():
    return Fernet.generate_key()

def encryptData(byteData, key):
    
    cipher_suite = Fernet(bytes(key,"utf-8"))
    cipher_text = cipher_suite.encrypt(byteData)

    return cipher_text

def decryptData(byteData, key):
    
    cipher_suite = Fernet(bytes(key,"utf-8"))
    plain_text = cipher_suite.decrypt(byteData)

    return plain_text

def encryptWriteFile(plainText, encryptedfile, key):
    try:
        
        cipherText = None
        if len(plainText) > 0:
            cipherText = encryptData(plainText, key)

        if cipherText is not None and len(cipherText) > 0:
            with open(encryptedfile, 'wb') as f:
                f.write(cipherText)
            return True
    
    except:
        logger.error(traceback.format_exc())

    return False

def encryptFile(plainfile, encryptedfile, key):
    
    try:
        plainText = None
        with open(plainfile, 'rb') as f:
            plainText = f.read()
        
        return encryptWriteFile(plainText, encryptedfile, key)
        
    except:
        logger.error(traceback.format_exc())

    return False

def decryptReadFile(encryptedfile, key):

    plainText = None
    try:

        cipherText = None
        with open(encryptedfile, 'rb') as f:
            cipherText = f.read()

        if len(cipherText) > 0:
            plainText = decryptData(cipherText, key)

    except:
        logger.error(traceback.format_exc())
        plainText = None

    return plainText

def decryptFile(encryptedfile, plainfile, key):
    
    try:
       
        plainText = decryptReadFile(encryptedfile, key)
        
        if plainText is not None and len(plainText) > 0:
            with open(plainfile, 'wb') as f:
                f.write(plainText)
            return True
    except:
        logger.error(traceback.format_exc())

    return False

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument("-fp", "--file.plain", required=True,
            help="file to encrypt")
    ap.add_argument("-fe", "--file.encrypted", required=True,
            help="encrypted file path")
    ap.add_argument("-ek", "--encryption.key", required=True,
            help="key to use for encryption/decryption")
    ap.add_argument("-em", "--encryption.mode", required=True,
            help="[e] or [d] or [g] without braces for encrypt or decrypt or generate and print random key")
    args = vars(ap.parse_args())

    if args["encryption.mode"] is 'e':
        encryptFile(args["file.plain"], args["file.encrypted"], args["encryption.key"])
    elif args["encryption.mode"] is 'd':
        decryptFile(args["file.encrypted"], args["file.plain"], args["encryption.key"])
    elif args["encryption.mode"] is 'g':
        print(generateKey())
    else:
        logger.log("unknow mode.")


