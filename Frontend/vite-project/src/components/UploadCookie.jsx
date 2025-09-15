import React, { useState } from "react";
import axios from "axios";
import "./UploadCookie.css"; // ✅ import styles

function UploadCookie({ email, onUploadSuccess }) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result.split(",")[1];
        resolve(result);
      };
      reader.onerror = (err) => reject(err);
    });

  const handleFileChange = async (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      setError("Only .txt files are allowed.");
      return;
    }

    try {
      setUploading(true);
      setFileName(file.name);

      const base64 = await convertToBase64(file);

      const res = await axios.post(
        "https://harmonixor-api-1.onrender.com/harmonixor/users/upload-cookie",
        {
          email,
          cookieBase64: base64,
        }
      );

      if (res.data.uploaded) {
        if (onUploadSuccess) onUploadSuccess(true);
        console.log("file is uploaded");
      } else {
        setError("Upload failed.");
        if (onUploadSuccess) onUploadSuccess(false);
      }
    } catch (err) {
      setError("Upload failed. Try again.");
      console.error(err);
      if (onUploadSuccess) onUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="uploadcookie-box capsule">
      <h3 className="uploadcookie-title">Upload Cookie File</h3>
      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        disabled={uploading}
        className="uploadcookie-input"
      />
      {fileName && <p className="uploadcookie-info">Selected: {fileName}</p>}
      {error && <p className="uploadcookie-error">{error}</p>}
      {uploading && <p className="uploadcookie-status">Uploading...</p>}
    </div>
  );
}

export default UploadCookie;
