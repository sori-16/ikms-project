import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';

const UploadForm = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | null

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('http://127.0.0.1:5000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus('success');
            setFile(null); // Reset
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2><Upload size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Upload Research Paper</h2>
            <form onSubmit={handleUpload}>
                <div style={{ marginBottom: '1.5rem', border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', transition: 'all 0.2s' }}>
                    <input
                        type="file"
                        id="fileData"
                        accept=".pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="fileData" style={{ cursor: 'pointer', display: 'block' }}>
                        {file ? (
                            <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                <FileText size={48} style={{ marginBottom: '1rem' }} />
                                <br />
                                {file.name}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)' }}>
                                <Upload size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <br />
                                Click to Select PDF
                            </div>
                        )}
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="submit" className="btn-primary" disabled={uploading || !file}>
                        {uploading ? 'Processing...' : 'Upload & Analyze'}
                    </button>

                    {status === 'success' && <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={18} /> Success</span>}
                    {status === 'error' && <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={18} /> Failed</span>}
                </div>
            </form>
        </div>
    );
};

export default UploadForm;
