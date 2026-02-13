// Created by: Soreti (Team Leader) - Demo Implementation
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Institution.css';
import { MapPin, BookOpen, Calendar } from 'lucide-react';

function InstitutionProfile() {
    const { id } = useParams();
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstitution = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/institutions/${id}`);
                setInstitution(response.data);
            } catch (error) {
                console.error('Error fetching institution:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitution();
    }, [id]);

    if (loading) return <div className="loading-state">Loading profile...</div>;
    if (!institution) return <div className="empty-state">Institution not found</div>;

    return (
        <div className="container">
            {/* Header Section */}
            <div className="institution-header">
                <h1>{institution.name}</h1>
                <div className="institution-meta">
                    <div className="meta-item">
                        <MapPin size={20} />
                        <span>{institution.location}</span>
                    </div>
                    <div className="meta-item">
                        <BookOpen size={20} />
                        <span>{institution.documents?.length || 0} Publications</span>
                    </div>
                </div>
                <p style={{ maxWidth: '800px', margin: '2rem auto', lineHeight: '1.6' }}>
                    {institution.description}
                </p>
            </div>

            {/* Publications Section */}
            <h2 className="section-title">Latest Research</h2>

            <div className="documents-grid">
                {institution.documents && institution.documents.length > 0 ? (
                    institution.documents.map((doc) => (
                        <Link to={`/document/${doc.id}`} key={doc.id} className="document-card">
                            <h3>{doc.title}</h3>
                            <p className="abstract">{doc.abstract}</p>
                            <div className="doc-footer">
                                <span className="meta-item">
                                    <Calendar size={14} />
                                    {doc.publication_date || 'Unknown Date'}
                                </span>
                                <span>Type: Research Paper</span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="empty-state" style={{ textAlign: 'left', padding: '1rem' }}>
                        No public research documents available yet.
                    </p>
                )}
            </div>
        </div>
    );
}

export default InstitutionProfile;
