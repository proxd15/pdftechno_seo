// DecryptionHandler.js
import { useState, useEffect } from 'react';

const DecryptionHandler = ({ 
  file, 
  onSuccess, 
  onError, 
  onDecrypted 
}) => {
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState(null);
  
  const attemptDecryption = async (password) => {
    setIsDecrypting(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Attempt decryption with PDF.js
      const loadingTask = window.pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      });
      
      const pdf = await loadingTask.promise;
      
      // If we get here, decryption was successful
      
      // Create a decrypted file with the same name
      const decryptedBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const decryptedFile = new File([decryptedBlob], file.name, { type: 'application/pdf' });
      
      // Attach password as property for server use
      Object.defineProperty(decryptedFile, 'password', {
        value: password,
        writable: true,
        enumerable: true,
        configurable: true
      });
      
      onDecrypted(decryptedFile);
      onSuccess();
      
    } catch (error) {
      console.error('Decryption failed:', error);
      
      if (error.name === 'PasswordException' || error.message.includes('password')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Failed to decrypt the PDF. The file may be corrupted.');
        onError(error.message || 'Failed to decrypt the PDF.');
      }
    } finally {
      setIsDecrypting(false);
    }
  };
  
  return {
    password,
    setPassword,
    isDecrypting,
    error,
    attemptDecryption
  };
};

export default DecryptionHandler;