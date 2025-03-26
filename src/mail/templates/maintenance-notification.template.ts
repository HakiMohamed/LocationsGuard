export const maintenanceNotificationTemplate = (automobile: any, maintenance: any, maintenanceType: string): string => {
    return `
        <h1>Rappel de maintenance</h1>
        <p>Une maintenance est programmée pour le véhicule suivant :</p>
        <ul>
            <li><strong>Marque :</strong> ${automobile.brand}</li>
            <li><strong>Modèle :</strong> ${automobile.model}</li>
            <li><strong>Année :</strong> ${automobile.year}</li>
            <li><strong>Immatriculation :</strong> ${automobile.licensePlate}</li>
        </ul>
        <p><strong>Type de maintenance :</strong> ${maintenanceType}</p>
        <p><strong>Date programmée :</strong> ${new Date(maintenance.scheduledDate).toLocaleDateString()}</p>
        <p><strong>Kilométrage actuel :</strong> ${automobile.mileage} km</p>
        ${maintenance.description ? `<p><strong>Description :</strong> ${maintenance.description}</p>` : ''}
        ${maintenance.notes ? `<p><strong>Notes :</strong> ${maintenance.notes}</p>` : ''}
        <p>Veuillez prendre les dispositions nécessaires pour effectuer cette maintenance.</p>
    `;
}; 