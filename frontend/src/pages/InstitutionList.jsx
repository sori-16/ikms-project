// Created by: Soreti (Team Leader) - Demo Implementation
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Institution.css';
import { Building2, MapPin } from 'lucide-react';

function InstitutionList() {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const response = await axios.get('http://localhost:5000/institutions');
                setInstitutions(response.data);
            } catch (error) {
                console.error('Error fetching institutions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitutions();
    }, []);

    return (
        <div className="container">
            <div className="institution-header">
                <h1>Research Institutions</h1>
                <p>Discover knowledge from top universities and research centers across Ethiopia.</p>
            </div>

            {loading ? (
                <div className="loading-state">Loading institutions...</div>
            ) : (
                <div className="institution-grid">
                    {institutions.map((inst) => (
                        <Link to={`/institution/${inst.id}`} key={inst.id} style={{ textDecoration: 'none' }}>
                            <div className="glass-panel institution-card">
                                <h2>{inst.name}</h2>
                                <div className="institution-location">
                                    <MapPin size={16} />
                                    <span>{inst.location}</span>
                                </div>
                                <p className="institution-desc">
                                    {inst.description || 'A leading center for research and education.'}
                                </p>
                                <div className="card-footer">
                                    View Research Profile →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Empty State for Demo */}
            {!loading && institutions.length === 0 && (
                <div className="empty-state">
                    <p>No institutions registered yet.</p>
                    <p className="text-small">Admin can add institutions via API.</p>
                </div>
            )}
        </div>
    );
}

export default InstitutionList;
