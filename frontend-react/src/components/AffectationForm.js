import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css'; // ton fichier CSS

const AffectationForm = () => {
  const [employes, setEmployes] = useState([]);
  const [materiels, setMateriels] = useState([]);
  const [selectedEmploye, setSelectedEmploye] = useState('');
  const [selectedMateriels, setSelectedMateriels] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Charger employés
    axios.get('/api/employes')
      .then(res => setEmployes(res.data))
      .catch(err => console.error(err));

    // Charger matériels (EPI)
    axios.get('/api/materiels')
      .then(res => setMateriels(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleMaterielsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setSelectedMateriels(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/affectations', {
        employe_id: selectedEmploye,
        materiels: selectedMateriels,
      });
      setMessage(res.data.message || 'Affectation réussie');
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'affectation");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Affecter des EPI</h2>

      <label>Employé :</label>
      <select
        value={selectedEmploye}
        onChange={(e) => setSelectedEmploye(e.target.value)}
        required
      >
        <option value="">-- Choisir un employé --</option>
        {employes.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.nom} {emp.prenom}
          </option>
        ))}
      </select>

      <h3>Ajouter des matériels</h3>
      <select
        multiple
        value={selectedMateriels}
        onChange={handleMaterielsChange}
        size={5}
        required
      >
        {materiels.map(mat => (
          <option key={mat.id} value={mat.id}>
            {mat.nom}
          </option>
        ))}
      </select>

      <button type="submit">Valider l'affectation</button>

      {message && <p>{message}</p>}
    </form>
  );
};

export default AffectationForm;
